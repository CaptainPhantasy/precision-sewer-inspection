import { NextResponse } from "next/server";
import { google, type calendar_v3 } from "googleapis";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CheckStatus = "ok" | "warn" | "fail";

interface MonitorCheck {
  id: string;
  title: string;
  status: CheckStatus;
  summary: string;
  evidence: string[];
  durationMs?: number;
}

interface RecentBooking {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  propertyAddress: string | null;
  appointmentDate: string | null;
  appointmentTime: string | null;
  amountPaid: number | null;
  stripeSessionId: string | null;
  createdAt: string;
  status: string;
  serviceType: string | null;
  stripe?: {
    paymentStatus: string;
    checkoutStatus: string | null;
    paymentIntentId: string | null;
    amountTotal: number | null;
    refundedAmount: number;
  };
  calendar?: {
    eventId: string;
    status: string;
    summary: string | null;
    start: string | null;
    end: string | null;
    description: string | null;
    hasPhone: boolean;
    hasAddress: boolean;
  };
  job?: {
    id: string;
    jobNumber: string;
    status: string;
    technicianId: string | null;
  };
  issues: string[];
}

const STATUS_WEIGHT: Record<CheckStatus, number> = {
  ok: 0,
  warn: 1,
  fail: 2,
};

function overallStatus(checks: MonitorCheck[]): CheckStatus {
  return checks.reduce<CheckStatus>((worst, check) => {
    return STATUS_WEIGHT[check.status] > STATUS_WEIGHT[worst] ? check.status : worst;
  }, "ok");
}

function hasMonitorBearerAccess(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
  return providedSecret === cronSecret;
}

async function timedCheck(
  id: string,
  title: string,
  fn: () => Promise<Omit<MonitorCheck, "id" | "title" | "durationMs">>
): Promise<MonitorCheck> {
  const started = Date.now();
  try {
    const result = await fn();
    return { id, title, durationMs: Date.now() - started, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      id,
      title,
      status: "fail",
      summary: message,
      evidence: [`Exception: ${message}`],
      durationMs: Date.now() - started,
    };
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function calendarClient(): calendar_v3.Calendar {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !key || !process.env.GOOGLE_CALENDAR_ID) {
    throw new Error("Missing Google Calendar service-account configuration");
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}

function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T12:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function normalize(value: string | null | undefined): string {
  return (value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function includesMeaningfulAddress(description: string | null | undefined, propertyAddress: string | null): boolean {
  if (!description || !propertyAddress) return false;
  const firstAddressPart = normalize(propertyAddress.split(",")[0]);
  return firstAddressPart.length > 3 && normalize(description).includes(firstAddressPart);
}

function includesPhone(description: string | null | undefined, phone: string | null): boolean {
  if (!description || !phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && description.replace(/\D/g, "").includes(digits.slice(-7));
}

function bookingNeedsCalendar(booking: { appointmentDate: string | null; appointmentTime: string | null }): boolean {
  return Boolean(booking.appointmentDate && booking.appointmentTime);
}

async function findCalendarEvent(
  calendar: calendar_v3.Calendar,
  booking: { name: string; appointmentDate: string | null }
): Promise<calendar_v3.Schema$Event | null> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId || !booking.appointmentDate) return null;

  const timeMin = `${addDays(booking.appointmentDate, -1)}T00:00:00.000Z`;
  const timeMax = `${addDays(booking.appointmentDate, 2)}T23:59:59.999Z`;
  const response = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    q: booking.name,
    singleEvents: true,
    showDeleted: true,
    orderBy: "startTime",
    maxResults: 10,
  });

  const bookingName = normalize(booking.name);
  return (
    response.data.items?.find((event) => {
      const haystack = normalize(`${event.summary || ""} ${event.description || ""}`);
      return haystack.includes(bookingName);
    }) || null
  );
}

async function buildRecentBookings(): Promise<RecentBooking[]> {
  const bookings = await prisma.contactSubmission.findMany({
    where: {
      source: "stripe-booking",
      status: "paid",
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const calendar = calendarClient();

  return Promise.all(
    bookings.map(async (booking): Promise<RecentBooking> => {
      const issues: string[] = [];

      const [job, calendarEvent, stripeData] = await Promise.all([
        prisma.job.findFirst({
          where: {
            OR: [
              { clientEmail: booking.email },
              ...(booking.propertyAddress ? [{ propertyAddress: booking.propertyAddress }] : []),
            ],
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, jobNumber: true, status: true, technicianId: true },
        }),
        bookingNeedsCalendar(booking)
          ? findCalendarEvent(calendar, {
              name: booking.name,
              appointmentDate: booking.appointmentDate,
            })
          : Promise.resolve(null),
        booking.stripeSessionId
          ? stripe.checkout.sessions
              .retrieve(booking.stripeSessionId, { expand: ["payment_intent"] })
              .then(async (session) => {
                const paymentIntent =
                  typeof session.payment_intent === "string" ? null : session.payment_intent;
                const refunds = paymentIntent
                  ? await stripe.refunds.list({ payment_intent: paymentIntent.id, limit: 20 })
                  : { data: [] };
                return {
                  paymentStatus: session.payment_status,
                  checkoutStatus: session.status || null,
                  paymentIntentId: paymentIntent?.id || null,
                  amountTotal: session.amount_total,
                  refundedAmount: refunds.data.reduce((sum, refund) => sum + (refund.amount || 0), 0),
                };
              })
          : Promise.resolve(undefined),
      ]);

      if (!booking.stripeSessionId) {
        issues.push("Paid booking is missing a Stripe session ID.");
      }

      if (stripeData) {
        const expectedCents = booking.amountPaid != null ? Math.round(booking.amountPaid * 100) : null;
        if (stripeData.paymentStatus !== "paid") {
          issues.push(`Stripe payment status is ${stripeData.paymentStatus}.`);
        }
        if (expectedCents != null && stripeData.amountTotal !== expectedCents) {
          issues.push(`Stripe amount ${stripeData.amountTotal} does not match Neon amount ${expectedCents}.`);
        }
      }

      if (!job) {
        issues.push("Paid booking is not present in the PWA Job table.");
      }

      let calendarPayload: RecentBooking["calendar"];
      if (bookingNeedsCalendar(booking)) {
        if (!calendarEvent) {
          issues.push("No matching Google Calendar event found.");
        } else {
          const start = calendarEvent.start?.dateTime || calendarEvent.start?.date || null;
          const end = calendarEvent.end?.dateTime || calendarEvent.end?.date || null;
          const hasPhone = includesPhone(calendarEvent.description, booking.phone);
          const hasAddress = includesMeaningfulAddress(calendarEvent.description, booking.propertyAddress);

          if (calendarEvent.status === "cancelled" && (stripeData?.refundedAmount || 0) === 0) {
            issues.push("Calendar event is cancelled but Stripe shows no refund.");
          }
          if (!hasPhone) {
            issues.push("Calendar event does not contain the booking phone number.");
          }
          if (!hasAddress) {
            issues.push("Calendar event does not contain the full property address.");
          }

          calendarPayload = {
            eventId: calendarEvent.id || "",
            status: calendarEvent.status || "unknown",
            summary: calendarEvent.summary || null,
            start,
            end,
            description: calendarEvent.description || null,
            hasPhone,
            hasAddress,
          };
        }
      }

      return {
        id: booking.id,
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        propertyAddress: booking.propertyAddress,
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        amountPaid: booking.amountPaid,
        stripeSessionId: booking.stripeSessionId,
        createdAt: booking.createdAt.toISOString(),
        status: booking.status,
        serviceType: booking.serviceType,
        stripe: stripeData,
        calendar: calendarPayload,
        job: job || undefined,
        issues,
      };
    })
  );
}

function recentBookingCheck(bookings: RecentBooking[]): MonitorCheck {
  const issueCount = bookings.reduce((sum, booking) => sum + booking.issues.length, 0);
  if (!bookings.length) {
    return {
      id: "recent-bookings",
      title: "Recent Paid Bookings",
      status: "warn",
      summary: "No paid Stripe bookings found in Neon.",
      evidence: ["Query: ContactSubmission where source=stripe-booking and status=paid."],
    };
  }

  return {
    id: "recent-bookings",
    title: "Recent Paid Bookings",
    status: issueCount > 0 ? "fail" : "ok",
    summary:
      issueCount > 0
        ? `${issueCount} downstream booking issue${issueCount === 1 ? "" : "s"} found.`
        : "Recent paid bookings are coherent across Neon, Stripe, Calendar, and PWA jobs.",
    evidence: bookings.slice(0, 3).map((booking) => {
      const status = booking.issues.length ? "FAIL" : "OK";
      return `${status}: ${booking.name} / ${booking.appointmentDate || "no date"} / ${booking.issues.join(" | ") || "no issues"}`;
    }),
  };
}

export async function GET(request: Request) {
  const hasBearerAccess = hasMonitorBearerAccess(request);
  const user = hasBearerAccess ? null : await getCurrentUser();
  if (!hasBearerAccess && (!user || !hasRole(user, ["ADMIN", "OWNER", "SUPER_ADMIN"]))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = getSiteUrl();

  const [websiteCheck, availabilityCheck, databaseCheck, recentBookings] = await Promise.all([
    timedCheck("public-website", "Public Website", async () => {
      const response = await fetchWithTimeout(siteUrl);
      return {
        status: response.ok ? "ok" : "fail",
        summary: `${response.status} ${response.statusText || ""}`.trim(),
        evidence: [`GET ${siteUrl}`, `Response ok=${response.ok}`],
      };
    }),
    timedCheck("booking-availability", "Booking Availability", async () => {
      const availabilityUrl = `${siteUrl}/api/calendar/availability`;
      const response = await fetchWithTimeout(availabilityUrl);
      const body = (await response.json().catch(() => null)) as
        | { success?: boolean; availability?: Array<{ hasAvailableSlots?: boolean }> }
        | null;
      const daysWithSlots = body?.availability?.filter((day) => day.hasAvailableSlots).length || 0;

      return {
        status: response.ok && body?.success && daysWithSlots > 0 ? "ok" : "fail",
        summary:
          response.ok && body?.success
            ? `${daysWithSlots} day${daysWithSlots === 1 ? "" : "s"} with available booking slots.`
            : "Availability endpoint did not return a successful slot list.",
        evidence: [
          `GET ${availabilityUrl}`,
          `HTTP ${response.status}`,
          `success=${String(body?.success)}`,
          `daysWithSlots=${daysWithSlots}`,
        ],
      };
    }),
    timedCheck("neon-database", "Neon Database", async () => {
      const [submissionCount, jobCount, latestPaid] = await Promise.all([
        prisma.contactSubmission.count(),
        prisma.job.count(),
        prisma.contactSubmission.findFirst({
          where: { source: "stripe-booking", status: "paid" },
          orderBy: { createdAt: "desc" },
          select: { name: true, createdAt: true, stripeSessionId: true },
        }),
      ]);

      return {
        status: latestPaid ? "ok" : "warn",
        summary: latestPaid
          ? `Latest paid booking: ${latestPaid.name} at ${latestPaid.createdAt.toISOString()}.`
          : "Database is reachable, but no paid bookings were found.",
        evidence: [
          `ContactSubmission count=${submissionCount}`,
          `Job count=${jobCount}`,
          `Latest Stripe session=${latestPaid?.stripeSessionId || "none"}`,
        ],
      };
    }),
    buildRecentBookings(),
  ]);

  const bookingCheck = recentBookingCheck(recentBookings);
  const checks = [websiteCheck, availabilityCheck, databaseCheck, bookingCheck];

  return NextResponse.json({
    success: true,
    checkedAt: new Date().toISOString(),
    overallStatus: overallStatus(checks),
    checks,
    recentBookings,
  });
}
