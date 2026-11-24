import assert from 'node:assert/strict';
import { mock } from 'node:test';
import type Stripe from 'stripe';
import type { calendar_v3 } from 'googleapis';

async function main() {
  // All provider methods and the database transaction are replaced below.
  process.env.STRIPE_SECRET_KEY = 'synthetic-placeholder';
  process.env.DATABASE_URL ||= 'postgresql://synthetic:synthetic@127.0.0.1:5432/synthetic';
  process.env.GOOGLE_CALENDAR_ID = 'synthetic-calendar';
  const { google } = await import('googleapis');
  const { stripe } = await import('../lib/stripe');
  const { prisma } = await import('../lib/db');
  const { confirmPaidBooking, cancelCalendarBooking, bookingEventId } = await import('../lib/booking-confirmation');
  const { POST } = await import('../app/api/booking/confirm/route');
  const { NextRequest } = await import('next/server');

  const sessions = new Map<string, Stripe.Checkout.Session>();
  const events = new Map<string, calendar_v3.Schema$Event>();
  let inserts = 0;
  let eventReads = 0;
  let lockStatements = 0;
  let failMetadata = false;
  let failInsertResponse = false;
  let failDelete = false;
  let unavailable = false;
  let expireAfterAvailability = false;
  let restoreClock: (() => void) | undefined;
  let serial = Promise.resolve();

  if (process.env.BOOKING_CHECK_REAL_DB !== '1') Object.defineProperty(prisma, '$transaction', { configurable: true, value: async (callback: (transaction: unknown) => Promise<unknown>) => {
    const previous = serial;
    let release!: () => void;
    serial = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      return await callback({ $executeRaw: async () => { lockStatements++; return 0; } });
    } finally { release(); }
  } });
  Object.defineProperty(prisma.contactSubmission, 'findMany', { configurable: true, value: async () => [...sessions.values()].map((session) => ({ stripeSessionId: session.id })) });
  mock.method(stripe.checkout.sessions, 'retrieve', async (id: string) => {
    const session = sessions.get(id);
    assert.ok(session, 'only synthetic sessions may be read');
    return structuredClone(session);
  });
  mock.method(stripe.checkout.sessions, 'update', async (id: string, params: Stripe.Checkout.SessionUpdateParams) => {
    if (failMetadata) { failMetadata = false; throw new Error('synthetic metadata failure'); }
    const session = sessions.get(id)!;
    session.metadata = { ...session.metadata, ...params.metadata } as Stripe.Metadata;
    return structuredClone(session);
  });
  const fakeCalendar = {
    events: {
      get: async ({ eventId }: { eventId: string }) => {
        eventReads++;
        const event = events.get(eventId);
        if (!event) throw Object.assign(new Error('synthetic missing event'), { code: 404 });
        return { data: structuredClone(event) };
      },
      list: async (query: calendar_v3.Params$Resource$Events$List) => ({
        data: { items: [...events.values()].filter((event) => {
          if (query.privateExtendedProperty) {
            const [key, value] = query.privateExtendedProperty[0].split('=');
            return event.extendedProperties?.private?.[key] === value;
          }
          if (query.timeMin && Date.parse(event.end?.dateTime || '') <= Date.parse(query.timeMin)) return false;
          if (query.timeMax && Date.parse(event.start?.dateTime || '') >= Date.parse(query.timeMax)) return false;
          if (query.q && !event.description?.includes(query.q)) return false;
          return true;
        }).map((event) => structuredClone(event)) },
      }),
      insert: async ({ requestBody }: { requestBody: calendar_v3.Schema$Event }) => {
        const id = requestBody.id!;
        assert.match(id, /^[0-9a-v]{5,1024}$/);
        if (events.has(id)) throw Object.assign(new Error('synthetic duplicate'), { code: 409 });
        inserts++;
        events.set(id, { ...structuredClone(requestBody), status: 'confirmed' });
        if (failInsertResponse) { failInsertResponse = false; throw new Error('synthetic lost insert response'); }
        return { data: { id } };
      },
      patch: async ({ eventId, requestBody }: { eventId: string; requestBody: calendar_v3.Schema$Event }) => {
        const event = events.get(eventId)!;
        Object.assign(event, structuredClone(requestBody));
        return { data: structuredClone(event) };
      },
      delete: async ({ eventId }: { eventId: string }) => {
        const sessionId = events.get(eventId)?.extendedProperties?.private?.psiCheckoutSession;
        if (sessionId) assert.equal(sessions.get(sessionId)?.metadata?.psiCalendarStatus, 'cancelled');
        if (failDelete) { failDelete = false; throw new Error('synthetic delete failure'); }
        events.delete(eventId);
        return { data: {} };
      },
    },
    freebusy: {
      query: async () => {
        if (expireAfterAvailability) {
          const later = Date.now() + 45000;
          const clock = mock.method(Date, 'now', () => later);
          restoreClock = () => clock.mock.restore();
        }
        return { data: { calendars: { 'synthetic-calendar': unavailable
          ? { errors: [{ reason: 'forbidden' }] }
          : { busy: [...events.values()].filter((event) => event.status !== 'cancelled').map((event) => ({
            start: event.start?.dateTime, end: event.end?.dateTime,
          })) } } } };
      },
    },
  };
  mock.method(google as unknown as { calendar: () => unknown }, 'calendar', () => fakeCalendar);
  // Expected simulated failures should not clutter the test output.
  mock.method(console, 'error', () => {});

  function reset(id = 'cs_test_synthetic'): Stripe.Checkout.Session {
    sessions.clear(); events.clear(); inserts = 0; eventReads = 0;
    failMetadata = false; failInsertResponse = false; failDelete = false; unavailable = false; expireAfterAvailability = false;
    const session = {
      id, status: 'complete', payment_status: 'paid', mode: 'payment', amount_total: 15900,
      customer_email: 'booking@example.invalid',
      metadata: {
        customerName: 'Synthetic Customer', propertyAddress: '100 Example Street',
        appointmentStart: '2099-12-01T17:00:00Z', appointmentEnd: '2099-12-01T19:30:00Z',
      },
      payment_intent: { latest_charge: { amount: 15900, amount_captured: 15900, amount_refunded: 0, refunded: false, refunds: { data: [] } } },
    } as unknown as Stripe.Checkout.Session;
    sessions.set(id, session);
    return session;
  }
  function legacy(id = 'legacyrandomid'): calendar_v3.Schema$Event {
    const session = [...sessions.values()][0];
    const event: calendar_v3.Schema$Event = {
      id, status: 'confirmed', summary: 'Original appointment title',
      description: 'Email: booking@example.invalid\nBooked via: precisionsewerinspections.com',
      location: '100 Example Street',
      start: { dateTime: session.metadata!.appointmentStart },
      end: { dateTime: session.metadata!.appointmentEnd },
    };
    events.set(id, event);
    return event;
  }

  let session = reset();
  const initialConcurrency = await Promise.all(Array.from({ length: 12 }, () => confirmPaidBooking(session.id)));
  assert.equal(inserts, 1);
  assert.equal(events.size, 1);
  assert.equal(new Set(initialConcurrency.map((result) => result.eventId)).size, 1);
  assert.equal(initialConcurrency.filter((result) => !result.reused).length, 1);

  session = reset();
  const first = await confirmPaidBooking(session.id);
  assert.equal(first.reused, false);
  const repeated = await Promise.all(Array.from({ length: 12 }, () => confirmPaidBooking(session.id)));
  assert.ok(repeated.every((result) => result.reused && result.eventId === first.eventId));
  assert.equal(inserts, 1);
  assert.equal(events.size, 1);
  assert.equal(session.metadata!.psiCalendarEventId, bookingEventId(session.id));

  session = reset();
  const oldEvent = legacy();
  assert.equal((await confirmPaidBooking(session.id)).eventId, oldEvent.id);
  assert.equal(inserts, 0);
  assert.equal(oldEvent.summary, 'Original appointment title');
  assert.equal(oldEvent.extendedProperties?.private?.psiCheckoutSession, session.id);

  session = reset(); const unboundMoved = legacy();
  unboundMoved.start = { dateTime: '2099-12-02T17:00:00Z' };
  unboundMoved.end = { dateTime: '2099-12-02T19:30:00Z' };
  assert.equal((await confirmPaidBooking(session.id)).reason, 'review');
  assert.equal(inserts, 0);

  session = reset(); const previousVisit = legacy();
  previousVisit.start = { dateTime: '2000-12-01T17:00:00Z' };
  previousVisit.end = { dateTime: '2000-12-01T19:30:00Z' };
  assert.equal((await confirmPaidBooking(session.id)).reason, 'confirmed');
  assert.equal(inserts, 1);

  session = reset(); legacy('legacyone'); legacy('legacytwo');
  assert.equal((await confirmPaidBooking(session.id)).reason, 'review');
  assert.equal(inserts, 0);

  session = reset(); legacy().description = 'A different customer';
  assert.equal((await confirmPaidBooking(session.id)).reason, 'conflict');
  assert.equal(inserts, 0);

  session = reset(); session.metadata!.psiCalendarEventId = 'lostmapping';
  assert.equal((await confirmPaidBooking(session.id)).reason, 'review');
  assert.equal(session.metadata!.psiCalendarStatus, 'missing');
  assert.equal(inserts, 0);

  session = reset(); events.set(bookingEventId(session.id), { id: bookingEventId(session.id), status: 'cancelled' });
  assert.equal((await confirmPaidBooking(session.id)).reason, 'cancelled');
  assert.equal(inserts, 0);

  session = reset();
  const charge = (session.payment_intent as Stripe.PaymentIntent).latest_charge as Stripe.Charge;
  charge.refunded = true; charge.amount_refunded = 15900;
  assert.equal((await confirmPaidBooking(session.id)).reason, 'refunded');
  assert.equal(eventReads, 0); assert.equal(inserts, 0);

  session = reset();
  ((session.payment_intent as Stripe.PaymentIntent).latest_charge as Stripe.Charge).refunds!.data = [{ status: 'pending' } as Stripe.Refund];
  assert.equal((await confirmPaidBooking(session.id)).reason, 'review');
  assert.equal(eventReads, 0); assert.equal(inserts, 0);

  session = reset(); session.metadata!.appointmentStart = '2000-01-01T17:00:00Z'; session.metadata!.appointmentEnd = '2000-01-01T19:30:00Z';
  assert.equal((await confirmPaidBooking(session.id)).reason, 'expired');
  assert.equal(inserts, 0);

  session = reset(); failMetadata = true;
  await assert.rejects(confirmPaidBooking(session.id), /synthetic metadata failure/);
  assert.equal((await confirmPaidBooking(session.id)).reused, true);
  assert.equal(inserts, 1);

  session = reset(); const movedLegacy = legacy(); failMetadata = true;
  await assert.rejects(confirmPaidBooking(session.id), /synthetic metadata failure/);
  movedLegacy.start = { dateTime: '2099-12-02T17:00:00Z' };
  movedLegacy.end = { dateTime: '2099-12-02T19:30:00Z' };
  const movedResult = await confirmPaidBooking(session.id);
  assert.equal(movedResult.eventId, movedLegacy.id);
  assert.equal(movedResult.appointment?.date, movedLegacy.start.dateTime);
  assert.equal(inserts, 0);

  session = reset(); failInsertResponse = true;
  assert.equal((await confirmPaidBooking(session.id)).reason, 'confirmed');
  assert.equal(inserts, 1);

  session = reset(); legacy().extendedProperties = { private: { psiCheckoutSession: 'cs_test_other' } };
  assert.equal((await confirmPaidBooking(session.id)).reason, 'review');
  assert.equal(inserts, 0);

  session = reset(); const booking = await confirmPaidBooking(session.id); failDelete = true;
  await assert.rejects(cancelCalendarBooking(booking.eventId!), /synthetic delete failure/);
  assert.equal((await confirmPaidBooking(session.id)).reason, 'cancelled');
  await cancelCalendarBooking(booking.eventId!);
  assert.equal(events.size, 0); assert.equal(inserts, 1);

  session = reset(); const oldCancellation = legacy();
  await cancelCalendarBooking(oldCancellation.id!);
  assert.equal(session.metadata!.psiCalendarStatus, 'cancelled');
  assert.equal(events.size, 0);

  session = reset(); const movedCancellation = legacy();
  movedCancellation.start = { dateTime: '2099-12-02T17:00:00Z' };
  movedCancellation.end = { dateTime: '2099-12-02T19:30:00Z' };
  await cancelCalendarBooking(movedCancellation.id!);
  assert.equal(session.metadata!.psiCalendarStatus, 'cancelled');
  assert.equal(session.metadata!.psiCalendarEventId, movedCancellation.id);
  assert.equal((await confirmPaidBooking(session.id)).reason, 'cancelled');
  assert.equal(events.size, 0); assert.equal(inserts, 0);

  session = reset(); const suppliedCancellation = legacy();
  suppliedCancellation.start = { dateTime: '2099-12-02T17:00:00Z' };
  suppliedCancellation.end = { dateTime: '2099-12-02T19:30:00Z' };
  await cancelCalendarBooking(suppliedCancellation.id!, session.id);
  assert.equal((await confirmPaidBooking(session.id)).reason, 'cancelled');
  assert.equal(events.size, 0); assert.equal(inserts, 0);

  session = reset(); const ambiguousCancellation = legacy();
  ambiguousCancellation.start = { dateTime: '2099-12-03T17:00:00Z' };
  ambiguousCancellation.end = { dateTime: '2099-12-03T19:30:00Z' };
  const anotherPayment = structuredClone(session); anotherPayment.id = 'cs_test_anotherpayment';
  anotherPayment.metadata!.appointmentStart = '2099-12-02T17:00:00Z';
  anotherPayment.metadata!.appointmentEnd = '2099-12-02T19:30:00Z';
  sessions.set(anotherPayment.id, anotherPayment);
  await assert.rejects(cancelCalendarBooking(ambiguousCancellation.id!), { status: 409 });
  assert.equal(events.size, 1);
  assert.equal(session.metadata!.psiCalendarStatus, undefined);
  assert.equal(anotherPayment.metadata!.psiCalendarStatus, undefined);

  session = reset(); const unresolvedCancellation = legacy();
  sessions.clear();
  await assert.rejects(cancelCalendarBooking(unresolvedCancellation.id!), { status: 409 });
  assert.equal(events.size, 1);
  assert.equal(session.metadata!.psiCalendarStatus, undefined);

  session = reset(); const wrongPropertyCancellation = legacy();
  wrongPropertyCancellation.location = '200 Different Street';
  await assert.rejects(cancelCalendarBooking(wrongPropertyCancellation.id!, session.id), { status: 409 });
  assert.equal(events.size, 1);
  assert.equal(session.metadata!.psiCalendarStatus, undefined);

  session = reset(); const unrelatedCancellation = legacy();
  unrelatedCancellation.description = 'Unrelated Calendar appointment';
  await assert.rejects(cancelCalendarBooking(unrelatedCancellation.id!, session.id), { status: 409 });
  assert.equal(events.size, 1);
  assert.equal(session.metadata!.psiCalendarStatus, undefined);
  await cancelCalendarBooking(unrelatedCancellation.id!);
  assert.equal(events.size, 0);

  session = reset(); unavailable = true;
  await assert.rejects(confirmPaidBooking(session.id), /availability could not be verified/);
  assert.equal(inserts, 0);

  session = reset(); expireAfterAvailability = true;
  await assert.rejects(confirmPaidBooking(session.id), /timed out/);
  restoreClock?.();
  assert.equal(inserts, 0);

  session = reset();
  const second = structuredClone(session); second.id = 'cs_test_second'; second.customer_email = 'second@example.invalid';
  sessions.set(second.id, second);
  const simultaneous = await Promise.all([confirmPaidBooking(session.id), confirmPaidBooking(second.id)]);
  assert.deepEqual(simultaneous.map((result) => result.reason), ['confirmed', 'conflict']);
  assert.equal(inserts, 1);

  session = reset();
  const response = await POST(new NextRequest('http://localhost/api/booking/confirm', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: session.id }),
  }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).reason, 'confirmed');
  await assert.rejects(confirmPaidBooking('invalid'), /valid Checkout session ID/);
  if (process.env.BOOKING_CHECK_REAL_DB !== '1') assert.ok(lockStatements > 0);
  mock.restoreAll();
  await prisma.$disconnect();
  console.log('booking-confirmation-check: PASS (retries, concurrency, legacy reuse, cancellation, refund, expired bookings, provider failures, route)');
}

main().catch((error) => { mock.restoreAll(); console.error(error); process.exitCode = 1; });
