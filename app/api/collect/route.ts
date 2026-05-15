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

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ua = request.headers.get("user-agent");

  if (isLikelyBot(ua)) {
    return NextResponse.json({ ok: true, skipped: "bot" });
  }

  const limit = rateLimit(`collect:${ip}`, 120, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    const single = payloadSchema.safeParse(body);
    if (!single.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    return handlePayloads([single.data as CollectPayload]);
  }

  return handlePayloads(parsed.data.batch as CollectPayload[]);
}

async function handlePayloads(payloads: CollectPayload[]) {
  const supabase = createAdminClient();
  const trackingId = payloads[0]?.websiteId;

  if (!trackingId) {
    return NextResponse.json({ error: "Missing website" }, { status: 400 });
  }

  const website = await resolveWebsite(supabase, trackingId);
  if (!website) {
    return NextResponse.json({ error: "Unknown website" }, { status: 404 });
  }

  try {
    for (const payload of payloads) {
      if (payload.websiteId !== trackingId) continue;

      switch (payload.type) {
        case "pageview":
          await recordPageview(supabase, website.id, payload);
          break;
        case "event":
          await recordEvent(supabase, website.id, payload);
          break;
        case "heartbeat":
          if (payload.duration !== undefined) {
            await recordHeartbeat(
              supabase,
              payload.sessionId,
              payload.duration
            );
          }
          break;
      }
    }
  } catch (err) {
    console.error("[collect]", err);
    return NextResponse.json({ error: "Ingest failed" }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
