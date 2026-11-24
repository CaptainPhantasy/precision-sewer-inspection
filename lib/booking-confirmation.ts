import { createHash } from 'node:crypto';
import type Stripe from 'stripe';
import type { calendar_v3 } from 'googleapis';
import { stripe } from './stripe';
import { prisma } from './db';
import {
  CALENDAR_REQUEST_OPTIONS,
  assertBookingDeadline,
  createBookingEvent,
  deleteBookingEvent,
  getBookingCalendarId,
  getBookingEndTime,
  getCalendarClient,
  isSlotAvailable,
  withCalendarBookingLock,
  type BookingDetails,
} from './google-calendar';

const STRIPE_REQUEST_OPTIONS = { timeout: 5000, maxNetworkRetries: 0 };
const BOOKING_SOURCE = 'Booked via: precisionsewerinspections.com';

export interface BookingConfirmationResult {
  success: true;
  calendarBooked: boolean;
  reason: 'confirmed' | 'no_appointment' | 'cancelled' | 'refunded' | 'expired' | 'review' | 'conflict';
  message: string;
  eventId?: string;
  reused?: boolean;
  needsReschedule?: boolean;
  needsReview?: boolean;
  appointment?: { date: string; display: string };
}

export class BookingConfirmationError extends Error {
  constructor(message: string, public status = 503) {
    super(message);
    this.name = 'BookingConfirmationError';
  }
}

function statusCode(error: unknown): number | undefined {
  const candidate = error as { code?: unknown; response?: { status?: number } };
  return candidate.response?.status ?? (typeof candidate.code === 'number' ? candidate.code : undefined);
}

export function bookingEventId(sessionId: string): string {
  return `psi${createHash('sha256').update(`psi-checkout-calendar:v1:${sessionId}`).digest('hex')}`;
}

function normalizedAddress(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function eventEmails(event: calendar_v3.Schema$Event): string[] {
  const emails = event.description?.match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
  return [...emails, ...(event.attendees || []).map((attendee) => attendee.email || '')].map((email) => email.toLowerCase());
}

function matchesLegacyIdentity(event: calendar_v3.Schema$Event, booking: BookingDetails): boolean {
  return Boolean(
    booking.customerEmail && booking.propertyAddress
    && event.description?.includes(BOOKING_SOURCE)
    && eventEmails(event).includes(booking.customerEmail.toLowerCase())
    && normalizedAddress(event.location || '') === normalizedAddress(booking.propertyAddress),
  );
}

/** Old events have random IDs, so adoption needs the complete booking identity. */
export function matchesLegacyBooking(event: calendar_v3.Schema$Event, booking: BookingDetails): boolean {
  return matchesLegacyIdentity(event, booking)
    && Date.parse(event.start?.dateTime || '') === Date.parse(booking.startTime)
    && Date.parse(event.end?.dateTime || '') === Date.parse(booking.endTime || getBookingEndTime(booking.startTime));
}

function bookingFromSession(session: Stripe.Checkout.Session): BookingDetails | null {
  const metadata = session.metadata || {};
  if (!metadata.appointmentStart) return null;
  const start = new Date(metadata.appointmentStart);
  if (!Number.isFinite(start.getTime())) {
    throw new BookingConfirmationError('The booking has an invalid appointment time.', 400);
  }
  const end = new Date(metadata.appointmentEnd || getBookingEndTime(metadata.appointmentStart));
  if (!Number.isFinite(end.getTime()) || end <= start) {
    throw new BookingConfirmationError('The booking has an invalid appointment time.', 400);
  }
  return {
    customerName: metadata.customerName || session.customer_details?.name || 'Customer',
    customerEmail: session.customer_email || session.customer_details?.email || '',
    customerPhone: metadata.customerPhone || '',
    propertyAddress: metadata.propertyAddress || '',
    serviceType: metadata.serviceType || 'Sewer Inspection',
    accessMethod: metadata.accessMethod || metadata.sewerAccessMethod || 'Standard',
    notes: metadata.message,
    startTime: start.toISOString(), endTime: end.toISOString(),
  };
}

function unbooked(reason: Exclude<BookingConfirmationResult['reason'], 'confirmed'>, message: string): BookingConfirmationResult {
  return {
    success: true, calendarBooked: false, reason, message,
    ...(reason === 'review' ? { needsReview: true } : {}),
    ...(reason === 'conflict' ? { needsReschedule: true } : {}),
  };
}

function confirmed(event: calendar_v3.Schema$Event, reused: boolean): BookingConfirmationResult {
  const start = event.start?.dateTime;
  const end = event.end?.dateTime;
  if (!event.id || !start || !end) throw new BookingConfirmationError('The stored appointment needs review.');
  const format = (date: string) => new Date(date).toLocaleTimeString('en-US', {
    timeZone: 'America/Indiana/Indianapolis', hour: 'numeric', minute: '2-digit',
  });
  return {
    success: true, calendarBooked: true, reason: 'confirmed',
    message: reused ? 'Your existing appointment is confirmed.' : 'Booking confirmed and added to the calendar.',
    eventId: event.id, reused,
    appointment: { date: start, display: `${format(start)} – ${format(end)} Eastern Time` },
  };
}

async function readEvent(eventId: string): Promise<calendar_v3.Schema$Event | null> {
  assertBookingDeadline();
  try {
    return (await getCalendarClient().events.get({ calendarId: getBookingCalendarId(), eventId }, CALENDAR_REQUEST_OPTIONS)).data;
  } catch (error) {
    if (statusCode(error) === 404) return null;
    if (statusCode(error) === 410) return { id: eventId, status: 'cancelled' };
    throw error;
  }
}

async function saveBookingState(sessionId: string, state: string, eventId?: string): Promise<void> {
  assertBookingDeadline();
  await stripe.checkout.sessions.update(sessionId, {
    metadata: {
      psiCalendarStatus: state,
      ...(eventId ? {
        psiCalendarEventId: eventId,
        psiCalendarCalendarId: getBookingCalendarId(),
      } : {}),
    },
  }, STRIPE_REQUEST_OPTIONS);
}

async function refundState(session: Stripe.Checkout.Session): Promise<'active' | 'refunded' | 'pending'> {
  assertBookingDeadline();
  let paymentIntent = session.payment_intent;
  if (typeof paymentIntent === 'string') {
    paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntent, { expand: ['latest_charge.refunds'] }, STRIPE_REQUEST_OPTIONS,
    );
  }
  let charge = paymentIntent?.latest_charge;
  if (typeof charge === 'string') {
    charge = await stripe.charges.retrieve(charge, {}, STRIPE_REQUEST_OPTIONS);
  }
  if (!charge && (session.amount_total || 0) > 0) {
    throw new BookingConfirmationError('Payment refund status could not be verified.');
  }
  if (!charge) return 'active';
  const captured = charge.amount_captured || charge.amount;
  if (charge.refunded || (captured > 0 && charge.amount_refunded >= captured)) return 'refunded';
  if (charge.refunds?.data.some((refund) => refund.status === 'pending' || refund.status === 'requires_action')) {
    return 'pending';
  }
  return 'active';
}

async function adoptEvent(sessionId: string, event: calendar_v3.Schema$Event): Promise<BookingConfirmationResult> {
  const owner = event.extendedProperties?.private?.psiCheckoutSession;
  if (owner && owner !== sessionId) return unbooked('review', 'This appointment is linked to another payment and needs review.');
  if (event.status === 'cancelled') {
    await saveBookingState(sessionId, 'cancelled', event.id!);
    return unbooked('cancelled', 'This appointment was cancelled. Please contact us to arrange another date.');
  }
  if (!event.id) throw new BookingConfirmationError('Calendar returned an appointment without an ID.');
  if (!owner) {
    assertBookingDeadline();
    await getCalendarClient().events.patch({
      calendarId: getBookingCalendarId(), eventId: event.id,
      requestBody: { extendedProperties: { private: { ...event.extendedProperties?.private, psiCheckoutSession: sessionId } } },
    }, { ...CALENDAR_REQUEST_OPTIONS, headers: event.etag ? { 'If-Match': event.etag } : undefined });
  }
  await saveBookingState(sessionId, 'confirmed', event.id);
  return confirmed(event, true);
}

async function listBookingEvents(
  query: Pick<calendar_v3.Params$Resource$Events$List, 'timeMin' | 'timeMax' | 'privateExtendedProperty' | 'q'>,
): Promise<calendar_v3.Schema$Event[]> {
  const events: calendar_v3.Schema$Event[] = [];
  let pageToken: string | undefined;
  do {
    assertBookingDeadline();
    const response = await getCalendarClient().events.list({
      ...query, calendarId: getBookingCalendarId(),
      singleEvents: true, showDeleted: true, maxResults: 2500, pageToken,
    }, CALENDAR_REQUEST_OPTIONS);
    events.push(...(response.data.items || []));
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);
  return events;
}

/** Both the success page and Zapier call this entry point with the Stripe session ID. */
export async function confirmPaidBooking(sessionId: string): Promise<BookingConfirmationResult> {
  if (typeof sessionId !== 'string' || !/^cs_(live|test)_[a-zA-Z0-9]+$/.test(sessionId) || sessionId.length > 255) {
    throw new BookingConfirmationError('A valid Checkout session ID is required.', 400);
  }
  return withCalendarBookingLock(async () => {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent.latest_charge.refunds'] }, STRIPE_REQUEST_OPTIONS);
    if (session.status !== 'complete' || session.payment_status !== 'paid') throw new BookingConfirmationError('Payment has not completed.', 400);
    const metadata = session.metadata || {};
    const refunds = await refundState(session);
    if (refunds === 'refunded') {
      await saveBookingState(sessionId, 'refunded');
      return unbooked('refunded', 'This payment has been refunded. Contact us to arrange any further service.');
    }
    if (refunds === 'pending') return unbooked('review', 'A refund is pending. Please contact us about your appointment.');
    if (metadata.psiCalendarStatus === 'cancelled') return unbooked('cancelled', 'This appointment was cancelled. Please contact us to arrange another date.');
    if (metadata.psiCalendarStatus === 'refunded') return unbooked('refunded', 'This payment has been refunded. Contact us to arrange any further service.');
    if (metadata.psiCalendarStatus === 'missing') return unbooked('review', 'The previous appointment was removed and needs review before it can be booked again.');
    if (metadata.psiCalendarStatus === 'expired') return unbooked('expired', 'The original appointment time has passed. Please contact us to arrange another date.');
    if (metadata.psiCalendarCalendarId && metadata.psiCalendarCalendarId !== getBookingCalendarId()) return unbooked('review', 'The stored appointment belongs to a different calendar and needs review.');
    const booking = bookingFromSession(session);
    if (!booking) return unbooked('no_appointment', 'Payment confirmed. We will contact you to schedule your inspection.');
    if (!booking.customerEmail || !booking.propertyAddress) return unbooked('review', 'The booking contact or service address is missing. Please contact us to confirm your appointment.');

    const eventId = metadata.psiCalendarEventId || bookingEventId(sessionId);
    const existing = await readEvent(eventId);
    if (existing) return adoptEvent(sessionId, existing);
    if (metadata.psiCalendarEventId) {
      await saveBookingState(sessionId, 'missing');
      return unbooked('review', 'The previous appointment was removed and needs review before it can be booked again.');
    }
    // A prior adoption may have patched Google successfully before Stripe's metadata write failed.
    const linked = (await listBookingEvents({ privateExtendedProperty: [`psiCheckoutSession=${sessionId}`] }))
      .filter((event) => event.extendedProperties?.private?.psiCheckoutSession === sessionId);
    if (linked.length > 1) return unbooked('review', 'More than one appointment is linked to this payment and needs review.');
    if (linked.length === 1) return adoptEvent(sessionId, linked[0]);
    const matches = (await listBookingEvents({ timeMin: booking.startTime, timeMax: booking.endTime }))
      .filter((event) => matchesLegacyBooking(event, booking));
    if (matches.length > 1) return unbooked('review', 'More than one matching appointment exists. Please contact us to confirm the correct booking.');
    if (matches.length === 1) return adoptEvent(sessionId, matches[0]);
    if (Date.parse(booking.startTime) <= Date.now()) {
      await saveBookingState(sessionId, 'expired');
      return unbooked('expired', 'The original appointment time has passed. Please contact us to arrange another date.');
    }
    const upcoming = await listBookingEvents({ q: booking.customerEmail, timeMin: new Date().toISOString() });
    if (upcoming.some((event) => !event.extendedProperties?.private?.psiCheckoutSession && matchesLegacyIdentity(event, booking))) {
      return unbooked('review', 'An existing appointment for this property has a different time. Please contact us to confirm the date.');
    }
    if (!await isSlotAvailable(booking.startTime, booking.endTime)) return unbooked('conflict', 'Your selected appointment time is unavailable. Please contact us to arrange another time.');
    try {
      await createBookingEvent(booking, { eventId, checkoutSessionId: sessionId });
    } catch (error) {
      // A response can be lost after Google creates the event. Reconcile the same ID.
      const recovered = await readEvent(eventId);
      if (recovered) return adoptEvent(sessionId, recovered);
      throw error;
    }
    await saveBookingState(sessionId, 'confirmed', eventId);
    return confirmed({ id: eventId, start: { dateTime: booking.startTime }, end: { dateTime: booking.endTime } }, false);
  });
}

/** Resolve older events by customer/property identity, including manual reschedules. */
async function legacySessionId(event: calendar_v3.Schema$Event): Promise<string | undefined> {
  if (!event.description?.includes(BOOKING_SOURCE)) return undefined;
  const emails = eventEmails(event);
  if (!emails.length) return undefined;
  const submissions = await prisma.contactSubmission.findMany({
    where: { email: { in: emails, mode: 'insensitive' }, stripeSessionId: { not: null } },
    select: { stripeSessionId: true },
  });
  const matches: string[] = [];
  for (const candidate of new Set(submissions.map((submission) => submission.stripeSessionId).filter(Boolean))) {
    assertBookingDeadline();
    const session = await stripe.checkout.sessions.retrieve(candidate!, {}, STRIPE_REQUEST_OPTIONS);
    const booking = bookingFromSession(session);
    if (booking && matchesLegacyIdentity(event, booking)) matches.push(session.id);
  }
  if (matches.length > 1) throw new BookingConfirmationError('This appointment matches multiple payments and needs review before cancellation.', 409);
  return matches[0];
}

export async function cancelCalendarBooking(eventId: string, checkoutSessionId?: string): Promise<void> {
  return withCalendarBookingLock(async () => {
    const event = await readEvent(eventId);
    const linkedSession = event?.extendedProperties?.private?.psiCheckoutSession;
    if (checkoutSessionId && linkedSession && checkoutSessionId !== linkedSession) throw new BookingConfirmationError('The appointment is linked to a different Checkout session.', 409);
    const sessionId = checkoutSessionId || linkedSession || (event ? await legacySessionId(event) : undefined);
    if (!sessionId && event?.description?.includes(BOOKING_SOURCE)) {
      throw new BookingConfirmationError('This website appointment could not be matched to a Checkout session and needs review before cancellation.', 409);
    }
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {}, STRIPE_REQUEST_OPTIONS);
      const booking = bookingFromSession(session);
      const storedEventId = session.metadata?.psiCalendarEventId;
      if (storedEventId && storedEventId !== eventId) throw new BookingConfirmationError('The payment is linked to a different appointment.', 409);
      if (!linkedSession && !storedEventId && (!event || !booking || !matchesLegacyIdentity(event, booking))) throw new BookingConfirmationError('The appointment could not be matched to this payment.', 409);
      // Record cancellation before deletion so retries cannot recreate the event.
      await saveBookingState(sessionId, 'cancelled', eventId);
    }
    if (!event || event.status === 'cancelled') return;
    try { await deleteBookingEvent(eventId); } catch (error) {
      if (statusCode(error) !== 404 && statusCode(error) !== 410) throw error;
    }
  });
}
