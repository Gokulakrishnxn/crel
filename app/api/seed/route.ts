import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { subDays, addHours, addMinutes, format } from "date-fns";

const PAGES = [
  "/",
  "/about",
  "/pricing",
  "/blog",
  "/blog/getting-started",
  "/blog/how-it-works",
  "/docs",
  "/docs/quickstart",
  "/contact",
  "/signup",
];

const SOURCES = [
  { referrer: null, utm_source: null, utm_medium: null },
  { referrer: null, utm_source: null, utm_medium: null },
  { referrer: null, utm_source: null, utm_medium: null },
  { referrer: "https://google.com", utm_source: "google", utm_medium: "organic" },
  { referrer: "https://google.com", utm_source: "google", utm_medium: "organic" },
  { referrer: "https://twitter.com", utm_source: "twitter", utm_medium: "social" },
  { referrer: "https://github.com", utm_source: null, utm_medium: null },
  { referrer: "https://news.ycombinator.com", utm_source: null, utm_medium: null },
  { referrer: "https://reddit.com", utm_source: "reddit", utm_medium: "social" },
  { referrer: null, utm_source: "newsletter", utm_medium: "email" },
  { referrer: null, utm_source: "google", utm_medium: "cpc" },
];

const COUNTRIES = ["US", "GB", "DE", "IN", "CA", "FR", "AU", "BR", "JP", "NL"];
const BROWSERS = ["Chrome", "Safari", "Firefox", "Edge", "Chrome"];
const DEVICES = ["desktop", "mobile", "desktop", "desktop", "mobile", "tablet"];
const OS_LIST = ["macOS", "Windows", "iOS", "Android", "Linux"];
const EVENTS = ["signup", "pricing_click", "docs_view", "contact_submit", "cta_click"];

function uuid() {
  return crypto.randomUUID();
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { websiteId } = await request.json() as { websiteId: string };
  if (!websiteId) {
    return NextResponse.json({ error: "websiteId required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verify website exists
  const { data: website, error: wErr } = await supabase
    .from("websites")
    .select("id")
    .eq("id", websiteId)
    .single();

  if (wErr || !website) {
    return NextResponse.json({ error: "Website not found" }, { status: 404 });
  }

  const sessions: object[] = [];
  const pageviews: object[] = [];
  const events: object[] = [];

  const now = new Date();

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const dayBase = subDays(now, dayOffset);
    // More sessions on recent days, weekdays get more traffic
    const dayOfWeek = dayBase.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseSessions = isWeekend ? randInt(8, 18) : randInt(15, 45);
    // Slight upward trend over time
    const trendMultiplier = 0.6 + (29 - dayOffset) / 29 * 0.8;
    const sessionCount = Math.round(baseSessions * trendMultiplier);

    for (let s = 0; s < sessionCount; s++) {
      const sessionId = uuid();
      const visitorId = uuid().replace(/-/g, "").slice(0, 20);
      const startedAt = addMinutes(dayBase, randInt(0, 1380));
      const pageviewCount = randInt(1, 6);
      const isBounce = pageviewCount === 1;
      const durationSeconds = isBounce ? randInt(5, 30) : randInt(45, 480);
      const endedAt = addMinutes(startedAt, Math.ceil(durationSeconds / 60));
      const src = pick(SOURCES);
      const country = pick(COUNTRIES);
      const browser = pick(BROWSERS);
      const device = pick(DEVICES);
      const os = pick(OS_LIST);

      sessions.push({
        id: sessionId,
        website_id: websiteId,
        visitor_id: visitorId,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
        is_bounce: isBounce,
        pageview_count: pageviewCount,
        country,
        device,
        browser,
        browser_version: String(randInt(100, 130)),
        os,
        os_version: "",
        screen: pick(["1920x1080", "1440x900", "1280x800", "390x844", "375x667"]),
        language: country === "DE" ? "de" : country === "FR" ? "fr" : "en",
        referrer: src.referrer,
        referrer_domain: src.referrer ? new URL(src.referrer).hostname : null,
        utm_source: src.utm_source,
        utm_medium: src.utm_medium,
        utm_campaign: src.utm_source === "newsletter" ? "may-digest" : null,
      });

      const firstPage = pick(PAGES);
      for (let p = 0; p < pageviewCount; p++) {
        const pvTime = addMinutes(startedAt, p * randInt(1, 5));
        pageviews.push({
          id: uuid(),
          website_id: websiteId,
          session_id: sessionId,
          path: p === 0 ? firstPage : pick(PAGES),
          title: null,
          referrer: p === 0 ? src.referrer : null,
          created_at: pvTime.toISOString(),
        });
      }

      // ~20% of sessions fire a custom event
      if (Math.random() < 0.2) {
        const evTime = addMinutes(startedAt, randInt(1, 10));
        const evName = pick(EVENTS);
        events.push({
          id: uuid(),
          website_id: websiteId,
          session_id: sessionId,
          name: evName,
          properties: evName === "signup" ? { plan: pick(["free", "pro"]) } : {},
          created_at: evTime.toISOString(),
        });
      }
    }
  }

  // Batch insert in chunks
  const chunkSize = 200;

  for (let i = 0; i < sessions.length; i += chunkSize) {
    const { error } = await supabase
      .from("sessions")
      .insert(sessions.slice(i, i + chunkSize));
    if (error) {
      console.error("[seed] sessions error", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  for (let i = 0; i < pageviews.length; i += chunkSize) {
    const { error } = await supabase
      .from("pageviews")
      .insert(pageviews.slice(i, i + chunkSize));
    if (error) {
      console.error("[seed] pageviews error", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  for (let i = 0; i < events.length; i += chunkSize) {
    const { error } = await supabase
      .from("events")
      .insert(events.slice(i, i + chunkSize));
    if (error) {
      console.error("[seed] events error", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    inserted: {
      sessions: sessions.length,
      pageviews: pageviews.length,
      events: events.length,
    },
  });
}

export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { websiteId } = await request.json() as { websiteId: string };
  if (!websiteId) {
    return NextResponse.json({ error: "websiteId required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Deleting sessions cascades to pageviews via FK
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("website_id", websiteId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("events").delete().eq("website_id", websiteId);

  return NextResponse.json({ ok: true, cleared: true });
}
