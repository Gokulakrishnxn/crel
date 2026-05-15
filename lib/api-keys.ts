import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const PREFIX = "crel_live_";

export function generateApiKey() {
  const rand = randomBytes(24).toString("hex"); // 48 hex chars
  const key = PREFIX + rand;
  const hash = createHash("sha256").update(key).digest("hex");
  const keyPrefix = PREFIX + rand.slice(0, 8) + "…";
  return { key, hash, keyPrefix };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function isApiKey(value: string): boolean {
  return value.startsWith(PREFIX) && value.length >= PREFIX.length + 48;
}

/** Resolve a raw API key to its linked website. Updates last_used_at as a side effect. */
export async function resolveWebsiteFromApiKey(
  supabase: SupabaseClient,
  rawKey: string
): Promise<{ id: string; domain: string } | null> {
  if (!isApiKey(rawKey)) return null;

  const hash = hashApiKey(rawKey);

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, website_id, revoked_at, websites(id, domain)")
    .eq("key_hash", hash)
    .is("revoked_at", null)
    .single();

  if (error || !data) return null;

  // Fire-and-forget last_used_at update — don't await to keep ingest fast
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {});

  const w = data.websites as unknown as { id: string; domain: string } | null;
  if (!w) return null;
  return { id: w.id, domain: w.domain };
}
