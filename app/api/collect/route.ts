import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  recordEvent,
  recordHeartbeat,
  recordPageview,
  resolveWebsite,
} from "@/lib/analytics/ingest";
import type { CollectPayload } from "@/lib/types";
import { isLikelyBot, rateLimit } from "@/lib/security/rate-limit";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function corsJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...CORS, ...(init?.headers ?? {}) },
  });
}

const payloadSchema = z.object({
  type: z.enum(["pageview", "event", "heartbeat"]),
  websiteId: z.string().min(8),
  sessionId: z.string().uuid(),
  visitorId: z.string().min(8),
  url: z.string().optional(),
  path: z.string().optional(),
  title: z.string().optional(),
  referrer: z.string().optional(),
  eventName: z.string().optional(),
  eventProperties: z.record(z.string(), z.unknown()).optional(),
  screen: z.string().optional(),
  language: z.string().optional(),
  country: z.string().optional(),
  device: z.enum(["desktop", "mobile", "tablet", "unknown"]).optional(),
  browser: z.string().optional(),
  browserVersion: z.string().optional(),
  os: z.string().optional(),
  osVersion: z.string().optional(),
  duration: z.number().optional(),
  utm: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      term: z.string().optional(),
      content: z.string().optional(),
    })
    .optional(),
});

const batchSchema = z.object({
  batch: z.array(payloadSchema).min(1).max(50),
});

function extractGeo(request: NextRequest) {
  // Vercel sets these automatically on every request
  return {
    country:
      request.headers.get("x-vercel-ip-country") ??
      request.headers.get("cf-ipcountry") ??
      null,
    city:
      request.headers.get("x-vercel-ip-city") ?? null,
  };
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = request.headers.get("user-agent");

  if (isLikelyBot(ua)) {
    return corsJson({ ok: true, skipped: "bot" });
  }

  const limit = rateLimit(`collect:${ip}`, 120, 60_000);
  if (!limit.success) {
    return corsJson({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return corsJson({ error: "Invalid JSON" }, { status: 400 });
  }

  const geo = extractGeo(request);

  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    const single = payloadSchema.safeParse(body);
    if (!single.success) {
      return corsJson({ error: "Invalid payload" }, { status: 400 });
    }
    return handlePayloads([single.data as CollectPayload], geo);
  }

  return handlePayloads(parsed.data.batch as CollectPayload[], geo);
}

async function handlePayloads(
  payloads: CollectPayload[],
  geo: { country: string | null; city: string | null }
) {
  const supabase = createAdminClient();
  const trackingId = payloads[0]?.websiteId;

  if (!trackingId) {
    return corsJson({ error: "Missing website" }, { status: 400 });
  }

  const website = await resolveWebsite(supabase, trackingId);
  if (!website) {
    return corsJson({ error: "Unknown website" }, { status: 404 });
  }

  try {
    for (const payload of payloads) {
      if (payload.websiteId !== trackingId) continue;

      // Server-side geo enrichment: override whatever the client sent
      const enriched: CollectPayload = {
        ...payload,
        country: geo.country ?? payload.country,
      };

      switch (enriched.type) {
        case "pageview":
          await recordPageview(supabase, website.id, enriched, geo.city);
          break;
        case "event":
          await recordEvent(supabase, website.id, enriched);
          break;
        case "heartbeat":
          if (enriched.duration !== undefined) {
            await recordHeartbeat(supabase, enriched.sessionId, enriched.duration);
          }
          break;
      }
    }
  } catch (err) {
    console.error("[collect]", err);
    return corsJson({ error: "Ingest failed" }, { status: 500 });
  }

  return corsJson({ ok: true });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
