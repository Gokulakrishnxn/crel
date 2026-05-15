import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  recordEvent,
  recordHeartbeat,
  recordPageview,
  resolveWebsite,
} from "@/lib/analytics/ingest";
import { isApiKey, resolveWebsiteFromApiKey } from "@/lib/api-keys";
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
  websiteId: z.string().min(8).optional(), // optional when apiKey is used
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
  apiKey: z.string().optional(), // API key in body for sendBeacon / crel.js
  batch: z.array(payloadSchema).min(1).max(50),
});

function extractGeo(request: NextRequest) {
  return {
    country:
      request.headers.get("x-vercel-ip-country") ??
      request.headers.get("cf-ipcountry") ??
      null,
    city: request.headers.get("x-vercel-ip-city") ?? null,
  };
}

/** Extract API key from Authorization header or request body. */
function extractApiKey(
  request: NextRequest,
  body: unknown
): string | null {
  const auth = request.headers.get("authorization") ?? "";
  if (auth.startsWith("Bearer ")) {
    const candidate = auth.slice("Bearer ".length).trim();
    if (isApiKey(candidate)) return candidate;
  }
  if (body && typeof body === "object" && "apiKey" in body) {
    const k = (body as Record<string, unknown>).apiKey;
    if (typeof k === "string" && isApiKey(k)) return k;
  }
  return null;
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
  const apiKey = extractApiKey(request, body);

  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    const single = payloadSchema.safeParse(body);
    if (!single.success) {
      return corsJson({ error: "Invalid payload" }, { status: 400 });
    }
    return handlePayloads([single.data as CollectPayload], geo, apiKey);
  }

  return handlePayloads(
    parsed.data.batch as CollectPayload[],
    geo,
    apiKey ?? parsed.data.apiKey ?? null
  );
}

async function handlePayloads(
  payloads: CollectPayload[],
  geo: { country: string | null; city: string | null },
  apiKey: string | null
) {
  const supabase = createAdminClient();

  // Resolve website — API key takes precedence over tracking_id in payload
  let website: { id: string; domain: string } | null = null;
  if (apiKey) {
    website = await resolveWebsiteFromApiKey(supabase, apiKey);
    if (!website) return corsJson({ error: "Invalid API key" }, { status: 401 });
  } else {
    const trackingId = payloads[0]?.websiteId;
    if (!trackingId) return corsJson({ error: "Missing websiteId or API key" }, { status: 400 });
    website = await resolveWebsite(supabase, trackingId);
    if (!website) return corsJson({ error: "Unknown website" }, { status: 404 });
  }

  try {
    for (const payload of payloads) {
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
