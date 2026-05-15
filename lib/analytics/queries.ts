import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BreakdownRow,
  OverviewStats,
  TimeSeriesPoint,
} from "@/lib/types";
import {
  differenceInDays,
  eachDayOfInterval,
  format,
  parseISO,
  subDays,
} from "date-fns";

export interface DateRange {
  from: Date;
  to: Date;
}

function defaultRange(): DateRange {
  const to = new Date();
  const from = subDays(to, 30);
  return { from, to };
}

export async function getWebsitesForUser(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("websites")
    .select("id, user_id, name, domain, tracking_id, share_id, settings, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getOverviewStats(
  supabase: SupabaseClient,
  websiteId: string,
  range: DateRange = defaultRange()
): Promise<OverviewStats> {
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id, visitor_id, is_bounce, duration_seconds, pageview_count")
    .eq("website_id", websiteId)
    .gte("started_at", fromIso)
    .lte("started_at", toIso);

  if (error) throw error;

  const rows = sessions ?? [];
  const sessionCount = rows.length;
  const visitors = new Set(rows.map((s) => s.visitor_id)).size;
  const pageviews = rows.reduce((sum, s) => sum + (s.pageview_count ?? 0), 0);
  const bounces = rows.filter((s) => s.is_bounce).length;
  const totalDuration = rows.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);

  return {
    pageviews,
    sessions: sessionCount,
    visitors,
    bounceRate: sessionCount ? (bounces / sessionCount) * 100 : 0,
    avgDuration: sessionCount ? totalDuration / sessionCount : 0,
  };
}

export async function getTimeSeries(
  supabase: SupabaseClient,
  websiteId: string,
  range: DateRange = defaultRange()
): Promise<TimeSeriesPoint[]> {
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  const { data: pageviews, error } = await supabase
    .from("pageviews")
    .select("created_at, session_id")
    .eq("website_id", websiteId)
    .gte("created_at", fromIso)
    .lte("created_at", toIso);

  if (error) throw error;

  const days = eachDayOfInterval({ start: range.from, end: range.to });
  const byDay = new Map<string, { pageviews: number; sessions: Set<string> }>();

  for (const day of days) {
    byDay.set(format(day, "yyyy-MM-dd"), { pageviews: 0, sessions: new Set() });
  }

  for (const pv of pageviews ?? []) {
    const key = format(parseISO(pv.created_at), "yyyy-MM-dd");
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.pageviews += 1;
      bucket.sessions.add(pv.session_id);
    }
  }

  return Array.from(byDay.entries()).map(([date, bucket]) => ({
    date,
    pageviews: bucket.pageviews,
    sessions: bucket.sessions.size,
  }));
}

async function breakdown(
  supabase: SupabaseClient,
  websiteId: string,
  column: string,
  range: DateRange,
  limit = 10
): Promise<BreakdownRow[]> {
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  const { data, error } = await supabase
    .from("sessions")
    .select(column)
    .eq("website_id", websiteId)
    .gte("started_at", fromIso)
    .lte("started_at", toIso);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const val = String(
      (row as unknown as Record<string, unknown>)[column] ?? "Unknown"
    );
    counts.set(val, (counts.get(val) ?? 0) + 1);
  }

  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  return Array.from(counts.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: total ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export const getTopPages = async (
  supabase: SupabaseClient,
  websiteId: string,
  range: DateRange
) => {
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  const { data, error } = await supabase
    .from("pageviews")
    .select("path")
    .eq("website_id", websiteId)
    .gte("created_at", fromIso)
    .lte("created_at", toIso);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.path, (counts.get(row.path) ?? 0) + 1);
  }

  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  return Array.from(counts.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: total ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
};

export const getTrafficSources = async (
  supabase: SupabaseClient,
  websiteId: string,
  range: DateRange
) => {
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  const { data, error } = await supabase
    .from("sessions")
    .select("utm_source, utm_medium, referrer_domain")
    .eq("website_id", websiteId)
    .gte("started_at", fromIso)
    .lte("started_at", toIso);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    let label = "Direct";
    if (row.utm_source) {
      label = `${row.utm_source}${row.utm_medium ? ` / ${row.utm_medium}` : ""}`;
    } else if (row.referrer_domain) {
      label = row.referrer_domain;
    }
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  return Array.from(counts.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: total ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
};

export const getCountries = (
  supabase: SupabaseClient,
  websiteId: string,
  range: DateRange,
  limit = 10
) => breakdown(supabase, websiteId, "country", range, limit);

export const getBrowsers = (supabase: SupabaseClient, websiteId: string, range: DateRange) =>
  breakdown(supabase, websiteId, "browser", range);

export const getDevices = (supabase: SupabaseClient, websiteId: string, range: DateRange) =>
  breakdown(supabase, websiteId, "device", range);

export const getOs = (supabase: SupabaseClient, websiteId: string, range: DateRange) =>
  breakdown(supabase, websiteId, "os", range);

export interface EventRow {
  name: string;
  count: number;
  percentage: number;
  lastSeen: string;
}

export interface SessionListRow {
  id: string;
  visitor_id: string;
  started_at: string;
  duration_seconds: number;
  is_bounce: boolean;
  pageview_count: number;
  country: string | null;
  city: string | null;
  device: string;
  browser: string | null;
  os: string | null;
  referrer_domain: string | null;
  utm_source: string | null;
  utm_medium: string | null;
}

export async function getSessionList(
  supabase: SupabaseClient,
  websiteId: string,
  range: DateRange = defaultRange(),
  limit = 100
): Promise<SessionListRow[]> {
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, visitor_id, started_at, duration_seconds, is_bounce, pageview_count, country, city, device, browser, os, referrer_domain, utm_source, utm_medium"
    )
    .eq("website_id", websiteId)
    .gte("started_at", fromIso)
    .lte("started_at", toIso)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as SessionListRow[];
}

export async function getTopEvents(
  supabase: SupabaseClient,
  websiteId: string,
  range: DateRange = defaultRange()
): Promise<EventRow[]> {
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("name, created_at")
    .eq("website_id", websiteId)
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const counts = new Map<string, { count: number; lastSeen: string }>();
  for (const row of data ?? []) {
    const existing = counts.get(row.name);
    if (!existing) {
      counts.set(row.name, { count: 1, lastSeen: row.created_at });
    } else {
      existing.count += 1;
      if (row.created_at > existing.lastSeen) {
        existing.lastSeen = row.created_at;
      }
    }
  }

  const total = Array.from(counts.values()).reduce((a, b) => a + b.count, 0);
  return Array.from(counts.entries())
    .map(([name, { count, lastSeen }]) => ({
      name,
      count,
      percentage: total ? (count / total) * 100 : 0,
      lastSeen,
    }))
    .sort((a, b) => b.count - a.count);
}

export function parseDateRange(
  fromParam?: string | null,
  toParam?: string | null
): DateRange {
  const to = toParam ? parseISO(toParam) : new Date();
  const from = fromParam ? parseISO(fromParam) : subDays(to, 30);
  const days = differenceInDays(to, from);
  if (days > 366) {
    return { from: subDays(to, 366), to };
  }
  return { from, to };
}
