"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

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

interface OpsMonitorResponse {
  success: boolean;
  checkedAt: string;
  overallStatus: CheckStatus;
  checks: MonitorCheck[];
  recentBookings: RecentBooking[];
  error?: string;
}

function statusClasses(status: CheckStatus): string {
  switch (status) {
    case "ok":
      return "border-green-200 bg-green-50 text-green-800";
    case "warn":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "fail":
      return "border-red-200 bg-red-50 text-red-800";
  }
}

function statusIcon(status: CheckStatus) {
  switch (status) {
    case "ok":
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case "warn":
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    case "fail":
      return <XCircle className="h-5 w-5 text-red-600" />;
  }
}

function formatMoney(amount: number | null): string {
  if (amount == null) return "n/a";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatCents(amount: number | null | undefined): string {
  if (amount == null) return "n/a";
  return formatMoney(amount / 100);
}

export function OpsMonitorTab() {
  const [data, setData] = useState<OpsMonitorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchMonitor = useCallback(async (mode: "initial" | "refresh" = "refresh") => {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    setError("");

    try {
      const response = await fetch("/api/admin/ops-monitor", { cache: "no-store" });
      const body = (await response.json()) as OpsMonitorResponse;
      if (!response.ok || !body.success) {
        throw new Error(body.error || `Monitor failed with HTTP ${response.status}`);
      }
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load monitor");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitor("initial");
    const interval = setInterval(() => fetchMonitor("refresh"), 60000);
    return () => clearInterval(interval);
  }, [fetchMonitor]);

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-600">Loading live operations checks</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-5 w-5" />
          <div>
            <h2 className="font-semibold">Monitor failed to load</h2>
            <p className="mt-1 text-sm">{error}</p>
            <button
              onClick={() => fetchMonitor("refresh")}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const failingBookings = data.recentBookings.filter((booking) => booking.issues.length > 0).length;

  return (
    <div className="space-y-6">
      <section className={`rounded-xl border p-5 shadow-sm ${statusClasses(data.overallStatus)}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            {statusIcon(data.overallStatus)}
            <div>
              <h2 className="text-lg font-semibold">
                {data.overallStatus === "ok"
                  ? "Live customer flow healthy"
                  : data.overallStatus === "warn"
                    ? "Live customer flow needs attention"
                    : "Live customer flow failing"}
              </h2>
              <p className="mt-1 text-sm">
                {failingBookings > 0
                  ? `${failingBookings} recent paid booking${failingBookings === 1 ? "" : "s"} have downstream data issues.`
                  : "Website, calendar, payment, database, and PWA checks returned clean."}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs opacity-80">
                <Clock className="h-3.5 w-3.5" />
                Last checked {new Date(data.checkedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchMonitor("refresh")}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm font-medium shadow-sm hover:bg-white disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {data.checks.map((check) => (
          <article key={check.id} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {statusIcon(check.status)}
                <div>
                  <h3 className="font-semibold text-gray-900">{check.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{check.summary}</p>
                </div>
              </div>
              {check.durationMs != null && (
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                  {check.durationMs}ms
                </span>
              )}
            </div>
            <div className="mt-4 space-y-1 border-t border-gray-100 pt-3">
              {check.evidence.map((line) => (
                <p key={line} className="font-mono text-xs text-gray-600">
                  {line}
                </p>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Recent Paid Bookings</h3>
          </div>
          <span className="text-sm text-gray-500">{data.recentBookings.length} checked</span>
        </div>
        <div className="divide-y divide-gray-100">
          {data.recentBookings.map((booking) => (
            <article key={booking.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {booking.issues.length ? statusIcon("fail") : statusIcon("ok")}
                    <h4 className="font-semibold text-gray-900">{booking.name}</h4>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {booking.serviceType || "unknown service"}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {formatMoney(booking.amountPaid)}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1 text-sm text-gray-600 md:grid-cols-2">
                    <p>{booking.email}</p>
                    <p>{booking.phone || "No phone"}</p>
                    <p>{booking.propertyAddress || "No address"}</p>
                    <p>
                      {booking.appointmentDate || "No date"} {booking.appointmentTime || ""}
                    </p>
                  </div>
                </div>
                {booking.stripeSessionId && (
                  <a
                    href={`https://dashboard.stripe.com/payments/${booking.stripe?.paymentIntentId || ""}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Stripe
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium uppercase text-gray-500">Stripe</p>
                  <p className="mt-1 text-sm text-gray-800">
                    {booking.stripe
                      ? `${booking.stripe.paymentStatus} / ${formatCents(booking.stripe.amountTotal)} / refunded ${formatCents(booking.stripe.refundedAmount)}`
                      : "No Stripe read"}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium uppercase text-gray-500">Calendar</p>
                  <p className="mt-1 text-sm text-gray-800">
                    {booking.calendar
                      ? `${booking.calendar.status} / phone ${booking.calendar.hasPhone ? "yes" : "no"} / address ${booking.calendar.hasAddress ? "yes" : "no"}`
                      : "No event"}
                  </p>
                  {booking.calendar?.eventId && (
                    <p className="mt-1 font-mono text-xs text-gray-500">{booking.calendar.eventId}</p>
                  )}
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium uppercase text-gray-500">PWA Job</p>
                  <p className="mt-1 text-sm text-gray-800">
                    {booking.job
                      ? `${booking.job.jobNumber} / ${booking.job.status}`
                      : "Missing from Job table"}
                  </p>
                </div>
              </div>

              {booking.issues.length > 0 && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="mb-2 text-sm font-semibold text-red-800">Issues</p>
                  <ul className="space-y-1">
                    {booking.issues.map((issue) => (
                      <li key={issue} className="text-sm text-red-700">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
