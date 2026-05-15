import type { SessionListRow } from "@/lib/analytics/queries";

export function formatSessionDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export function formatSessionSource(row: SessionListRow) {
  if (row.utm_source) {
    return row.utm_medium ? `${row.utm_source} / ${row.utm_medium}` : row.utm_source;
  }
  if (row.referrer_domain) return row.referrer_domain;
  return "Direct";
}

export function formatVisitorId(visitorId: string) {
  if (visitorId.length <= 10) return visitorId;
  return `${visitorId.slice(0, 8)}…`;
}

export function formatDeviceLabel(row: SessionListRow) {
  const device = row.device === "unknown" ? "Desktop" : row.device;
  const cap = device.charAt(0).toUpperCase() + device.slice(1);
  if (row.browser) return `${cap} · ${row.browser}`;
  return cap;
}

export function formatLocation(row: SessionListRow) {
  if (row.city && row.country) return `${row.city}, ${row.country}`;
  if (row.country) return row.country;
  return "—";
}
