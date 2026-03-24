/**
 * Spectrograph Image Generator
 * Renders acoustic analysis data as an SVG frequency visualization.
 * Output: base64 data URL for direct embedding in HTML/PDF reports.
 *
 * No external dependencies — pure SVG generation.
 */

import type { AcousticSegment, AcousticResult } from "./acoustic-analysis.service";

// ─── Design Tokens ────────────────────────────────────────────────────────────

const CHART = {
  width: 720,
  height: 320,
  padding: { top: 40, right: 30, bottom: 60, left: 70 },
  barGap: 8,
  cornerRadius: 4,
} as const;

const COLORS = {
  background: "#f8fafc",
  gridLine: "#e2e8f0",
  axisText: "#64748b",
  titleText: "#0c2340",
  barFill: "#0369a1",
  barStroke: "#0c2340",
  // Band indicator colors
  present: "#059669",
  faint: "#d97706",
  absent: "#94a3b8",
  strong: "#dc2626",
  // Frequency zones
  lowFreq: "#60a5fa",
  midFreq: "#3b82f6",
  highFreq: "#1d4ed8",
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getBandColor(band: string): string {
  const normalized = band.toLowerCase();
  if (normalized === "present") return COLORS.present;
  if (normalized === "strong") return COLORS.strong;
  if (normalized === "faint") return COLORS.faint;
  return COLORS.absent;
}

function getFreqColor(hz: number): string {
  if (hz < 500) return COLORS.lowFreq;
  if (hz < 1000) return COLORS.midFreq;
  return COLORS.highFreq;
}

function truncateLabel(label: string, maxLen: number = 18): string {
  if (label.length <= maxLen) return label;
  return label.slice(0, maxLen - 1) + "…";
}

// ─── SVG Generators ───────────────────────────────────────────────────────────

function renderFrequencyBarChart(segments: AcousticSegment[]): string {
  const { width, height, padding, barGap, cornerRadius } = CHART;
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const maxFreq = Math.max(...segments.map((s) => s.dominantFrequencyHz), 1500);
  const yMax = Math.ceil(maxFreq / 500) * 500; // Round up to nearest 500
  const barWidth = (plotW - barGap * (segments.length - 1)) / segments.length;

  // Y-axis grid lines
  const gridCount = 5;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const val = (yMax / gridCount) * i;
    const y = padding.top + plotH - (val / yMax) * plotH;
    return `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"
        stroke="${COLORS.gridLine}" stroke-width="1" stroke-dasharray="${i === 0 ? "0" : "4,4"}" />
      <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end"
        fill="${COLORS.axisText}" font-size="11" font-family="Inter, Helvetica Neue, sans-serif">${Math.round(val)}</text>`;
  }).join("");

  // Bars
  const bars = segments
    .map((seg, i) => {
      const x = padding.left + i * (barWidth + barGap);
      const barH = (seg.dominantFrequencyHz / yMax) * plotH;
      const y = padding.top + plotH - barH;
      const color = getFreqColor(seg.dominantFrequencyHz);
      const label = truncateLabel(seg.label);

      return `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}"
        rx="${cornerRadius}" fill="${color}" fill-opacity="0.85" stroke="${COLORS.barStroke}" stroke-width="1" stroke-opacity="0.2" />
      <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle"
        fill="${COLORS.titleText}" font-size="12" font-weight="600" font-family="Inter, Helvetica Neue, sans-serif">${seg.dominantFrequencyHz} Hz</text>
      <text x="${x + barWidth / 2}" y="${padding.top + plotH + 16}" text-anchor="middle"
        fill="${COLORS.axisText}" font-size="10" font-family="Inter, Helvetica Neue, sans-serif">${escapeXml(label)}</text>`;
    })
    .join("");

  // Band indicators (small dots below each bar)
  const bandIndicators = segments
    .map((seg, i) => {
      const x = padding.left + i * (barWidth + barGap);
      const baseY = padding.top + plotH + 28;
      const dotR = 5;
      const dotGap = 14;
      const bands = [
        { label: "R", value: seg.resonanceBand },
        { label: "H", value: seg.harmonicsBand },
        { label: "T", value: seg.highFreqTail },
      ];

      return bands
        .map((b, j) => {
          const cx = x + barWidth / 2 - dotGap + j * dotGap;
          const cy = baseY + 8;
          return `
          <circle cx="${cx}" cy="${cy}" r="${dotR}" fill="${getBandColor(b.value)}" fill-opacity="0.9" />
          <text x="${cx}" y="${cy + 3.5}" text-anchor="middle"
            fill="white" font-size="7" font-weight="700" font-family="Inter, sans-serif">${b.label}</text>`;
        })
        .join("");
    })
    .join("");

  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="${COLORS.background}" rx="8" />

    <!-- Title -->
    <text x="${width / 2}" y="24" text-anchor="middle"
      fill="${COLORS.titleText}" font-size="14" font-weight="700" font-family="Plus Jakarta Sans, Inter, sans-serif">
      Acoustic Frequency Analysis — Dominant Frequency by Segment
    </text>

    <!-- Y-axis label -->
    <text x="16" y="${padding.top + plotH / 2}" text-anchor="middle"
      fill="${COLORS.axisText}" font-size="11" font-family="Inter, sans-serif"
      transform="rotate(-90, 16, ${padding.top + plotH / 2})">Frequency (Hz)</text>

    <!-- Grid & Axes -->
    ${gridLines}
    <line x1="${padding.left}" y1="${padding.top + plotH}" x2="${width - padding.right}" y2="${padding.top + plotH}"
      stroke="${COLORS.axisText}" stroke-width="1.5" />

    <!-- Bars -->
    ${bars}

    <!-- Band indicators -->
    ${bandIndicators}

    <!-- Legend -->
    <g transform="translate(${padding.left}, ${height - 8})">
      <circle cx="0" cy="-3" r="4" fill="${COLORS.present}" />
      <text x="8" y="0" fill="${COLORS.axisText}" font-size="9" font-family="Inter, sans-serif">Present</text>
      <circle cx="55" cy="-3" r="4" fill="${COLORS.faint}" />
      <text x="63" y="0" fill="${COLORS.axisText}" font-size="9" font-family="Inter, sans-serif">Faint</text>
      <circle cx="100" cy="-3" r="4" fill="${COLORS.absent}" />
      <text x="108" y="0" fill="${COLORS.axisText}" font-size="9" font-family="Inter, sans-serif">Absent</text>
      <text x="170" y="0" fill="${COLORS.axisText}" font-size="9" font-family="Inter, sans-serif">R=Resonance  H=Harmonics  T=High-Freq Tail</text>
    </g>
  </svg>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a spectrograph SVG from acoustic analysis results.
 * Returns a base64 data URL suitable for <img src="..."> embedding.
 */
export function generateSpectrographDataUrl(result: AcousticResult): string | null {
  if (!result.success || result.segments.length === 0) return null;

  const svg = renderFrequencyBarChart(result.segments);
  const base64 = Buffer.from(svg, "utf-8").toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Generate raw SVG string (for debugging or direct embedding).
 */
export function generateSpectrographSVG(result: AcousticResult): string | null {
  if (!result.success || result.segments.length === 0) return null;
  return renderFrequencyBarChart(result.segments);
}
