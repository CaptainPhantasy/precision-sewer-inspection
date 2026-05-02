import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendAdminNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CountMap = Record<string, number>;

function countBy<T extends string | null | undefined>(values: T[]): CountMap {
  return values.reduce<CountMap>((acc, value) => {
    const key = value || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function renderMap(map: CountMap): string {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return "<li>None</li>";
  return entries
    .slice(0, 10)
    .map(([key, value]) => `<li><strong>${escapeHtml(key)}</strong>: ${value}</li>`)
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function requireCronSecret(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { success: false, error: "CRON_SECRET is not configured" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}

export async function GET(request: NextRequest) {
  const authError = requireCronSecret(request);
  if (authError) return authError;

  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const expiringBy = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [
    contacts,
    leadCaptures,
    siteVisits,
    siteEvents,
    chatConversations,
    jobs,
    inspectionsAwaitingReview,
    expiringDeliveryTokens,
  ] = await Promise.all([
    prisma.contactSubmission.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.leadCapture.findMany({
      where: { lastActivityAt: { gte: since } },
      orderBy: { lastActivityAt: "desc" },
      take: 25,
    }),
    prisma.siteVisit.findMany({
      where: { visitedAt: { gte: since } },
      select: { pageUrl: true, utmSource: true, referrer: true },
      take: 500,
    }),
    prisma.siteEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { eventType: true, eventTarget: true, pageUrl: true },
      take: 500,
    }),
    prisma.chatConversation.findMany({
      where: { updatedAt: { gte: since } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.job.findMany({
      where: { createdAt: { gte: since } },
      select: { jobNumber: true, clientName: true, propertyAddress: true, status: true, totalPrice: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.inspection.findMany({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      select: {
        inspectionNumber: true,
        status: true,
        updatedAt: true,
        job: { select: { propertyAddress: true, clientName: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 25,
    }),
    prisma.deliveryToken.findMany({
      where: {
        actualExpiresAt: { gte: now, lte: expiringBy },
      },
      select: {
        clientEmail: true,
        displayExpiresAt: true,
        downloadsUsed: true,
        downloadLimit: true,
        inspection: {
          select: {
            inspectionNumber: true,
            job: { select: { propertyAddress: true, clientName: true } },
          },
        },
      },
      orderBy: { actualExpiresAt: "asc" },
      take: 25,
    }),
  ]);

  const pageCounts = countBy(siteVisits.map((visit) => visit.pageUrl));
  const sourceCounts = countBy(siteVisits.map((visit) => visit.utmSource || visit.referrer));
  const eventCounts = countBy(siteEvents.map((event) => event.eventType));
  const jobStatusCounts = countBy(jobs.map((job) => job.status));
  const contactStatusCounts = countBy(contacts.map((contact) => contact.status));

  const subject = `PSI Daily Ops Digest — ${now.toLocaleDateString("en-US", { timeZone: "America/Indianapolis" })}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 720px; margin: 0 auto; color: #1f2937;">
      <h1>PSI Daily Ops Digest</h1>
      <p>Window: ${since.toISOString()} through ${now.toISOString()}</p>

      <h2>Summary</h2>
      <ul>
        <li><strong>New contact submissions:</strong> ${contacts.length}</li>
        <li><strong>Lead captures active:</strong> ${leadCaptures.length}</li>
        <li><strong>Chat conversations updated:</strong> ${chatConversations.length}</li>
        <li><strong>Site visits tracked:</strong> ${siteVisits.length}</li>
        <li><strong>Site events tracked:</strong> ${siteEvents.length}</li>
        <li><strong>New jobs:</strong> ${jobs.length}</li>
        <li><strong>Inspections awaiting review:</strong> ${inspectionsAwaitingReview.length}</li>
        <li><strong>Delivery links expiring within 24 hours:</strong> ${expiringDeliveryTokens.length}</li>
      </ul>

      <h2>Contact Status</h2>
      <ul>${renderMap(contactStatusCounts)}</ul>

      <h2>Job Status</h2>
      <ul>${renderMap(jobStatusCounts)}</ul>

      <h2>Top Pages</h2>
      <ul>${renderMap(pageCounts)}</ul>

      <h2>Traffic Sources</h2>
      <ul>${renderMap(sourceCounts)}</ul>

      <h2>Event Types</h2>
      <ul>${renderMap(eventCounts)}</ul>

      <h2>Inspections Awaiting Review</h2>
      <ul>
        ${inspectionsAwaitingReview.length === 0 ? "<li>None</li>" : inspectionsAwaitingReview.map((inspection) => `
          <li><strong>${escapeHtml(inspection.inspectionNumber)}</strong> — ${escapeHtml(inspection.job.clientName)} — ${escapeHtml(inspection.job.propertyAddress)} — ${inspection.status}</li>
        `).join("")}
      </ul>

      <h2>Delivery Links Expiring Soon</h2>
      <ul>
        ${expiringDeliveryTokens.length === 0 ? "<li>None</li>" : expiringDeliveryTokens.map((token) => `
          <li><strong>${escapeHtml(token.inspection.inspectionNumber)}</strong> — ${escapeHtml(token.inspection.job.clientName)} — ${escapeHtml(token.inspection.job.propertyAddress)} — ${token.downloadsUsed}/${token.downloadLimit} downloads used — display expiry ${token.displayExpiresAt.toISOString()}</li>
        `).join("")}
      </ul>

      <p style="color: #6b7280; font-size: 12px;">Generated by the first-party PSI Vercel Cron route. No Abacus notification IDs were used.</p>
    </div>
  `;

  const emailResult = await sendAdminNotification({ subject, htmlContent });
  const responseBody = {
    success: emailResult.success,
    sent: emailResult.success,
    emailResult,
    window: { since: since.toISOString(), until: now.toISOString() },
    counts: {
      contacts: contacts.length,
      leadCaptures: leadCaptures.length,
      chatConversations: chatConversations.length,
      siteVisits: siteVisits.length,
      siteEvents: siteEvents.length,
      jobs: jobs.length,
      inspectionsAwaitingReview: inspectionsAwaitingReview.length,
      expiringDeliveryTokens: expiringDeliveryTokens.length,
    },
  };

  return NextResponse.json(responseBody, { status: emailResult.success ? 200 : 502 });
}
