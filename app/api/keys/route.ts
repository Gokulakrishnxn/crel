import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/api-keys";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const websiteId = request.nextUrl.searchParams.get("websiteId");
  if (!websiteId) return NextResponse.json({ error: "Missing websiteId" }, { status: 400 });

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, last_used_at, created_at")
    .eq("website_id", websiteId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

const createSchema = z.object({
  websiteId: z.string().uuid(),
  name: z.string().trim().min(1).max(50),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { websiteId, name } = parsed.data;

  // Verify ownership — RLS also enforces this but be explicit
  const { data: website } = await supabase
    .from("websites")
    .select("id")
    .eq("id", websiteId)
    .eq("user_id", user.id)
    .single();
  if (!website) return NextResponse.json({ error: "Website not found" }, { status: 404 });

  const { key, hash, keyPrefix } = generateApiKey();

  const { data: created, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: user.id,
      website_id: websiteId,
      name,
      key_hash: hash,
      key_prefix: keyPrefix,
    })
    .select("id, name, key_prefix, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return the plaintext key ONCE — it is never stored
  return NextResponse.json({ ...created, key }, { status: 201 });
}
