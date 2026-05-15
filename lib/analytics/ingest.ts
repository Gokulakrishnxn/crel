import type { SupabaseClient } from "@supabase/supabase-js";
import type { CollectPayload, DeviceType } from "@/lib/types";

function parseReferrerDomain(referrer?: string): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname;
  } catch {
    return null;
  }
}

export async function resolveWebsite(
  supabase: SupabaseClient,
  trackingId: string
) {
  const { data, error } = await supabase
    .from("websites")
    .select("id, domain")
    .eq("tracking_id", trackingId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function upsertSession(
  supabase: SupabaseClient,
  websiteId: string,
  payload: CollectPayload
) {
  const referrerDomain = parseReferrerDomain(payload.referrer);

  const sessionRow = {
    id: payload.sessionId,
    website_id: websiteId,
    visitor_id: payload.visitorId,
    country: payload.country ?? null,
    device: (payload.device ?? "unknown") as DeviceType,
    browser: payload.browser ?? null,
    browser_version: payload.browserVersion ?? null,
    os: payload.os ?? null,
    os_version: payload.osVersion ?? null,
    screen: payload.screen ?? null,
    language: payload.language ?? null,
    referrer: payload.referrer ?? null,
    referrer_domain: referrerDomain,
    utm_source: payload.utm?.source ?? null,
    utm_medium: payload.utm?.medium ?? null,
    utm_campaign: payload.utm?.campaign ?? null,
    utm_term: payload.utm?.term ?? null,
    utm_content: payload.utm?.content ?? null,
  };

  const { error } = await supabase.from("sessions").upsert(sessionRow, {
    onConflict: "id",
    ignoreDuplicates: false,
  });

  if (error) throw error;
}

export async function recordPageview(
  supabase: SupabaseClient,
  websiteId: string,
  payload: CollectPayload
) {
  const path = payload.path ?? "/";

  await upsertSession(supabase, websiteId, payload);

  const { error: pvError } = await supabase.from("pageviews").insert({
    website_id: websiteId,
    session_id: payload.sessionId,
    path,
    title: payload.title ?? null,
    referrer: payload.referrer ?? null,
  });

  if (pvError) throw pvError;

  const { data: session } = await supabase
    .from("sessions")
    .select("pageview_count")
    .eq("id", payload.sessionId)
    .single();

  const count = (session?.pageview_count ?? 0) + 1;

  await supabase
    .from("sessions")
    .update({
      pageview_count: count,
      is_bounce: count <= 1,
      ended_at: new Date().toISOString(),
    })
    .eq("id", payload.sessionId);
}

export async function recordEvent(
  supabase: SupabaseClient,
  websiteId: string,
  payload: CollectPayload
) {
  if (!payload.eventName) return;

  await upsertSession(supabase, websiteId, payload);

  const { error } = await supabase.from("events").insert({
    website_id: websiteId,
    session_id: payload.sessionId,
    name: payload.eventName,
    properties: payload.eventProperties ?? {},
  });

  if (error) throw error;
}

export async function recordHeartbeat(
  supabase: SupabaseClient,
  sessionId: string,
  durationSeconds: number
) {
  const { data } = await supabase
    .from("sessions")
    .select("duration_seconds")
    .eq("id", sessionId)
    .single();

  const current = data?.duration_seconds ?? 0;
  const next = Math.max(current, durationSeconds);

  await supabase
    .from("sessions")
    .update({
      duration_seconds: next,
      ended_at: new Date().toISOString(),
      is_bounce: false,
    })
    .eq("id", sessionId);
}
