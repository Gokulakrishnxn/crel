import { notFound } from "next/navigation";
import { parseDateRange } from "@/lib/analytics/queries";
import { createClient } from "@/lib/supabase/server";
import type { Website } from "@/lib/types";

export async function getWebsiteOrNotFound(websiteId: string): Promise<Website> {
  const supabase = await createClient();
  const { data: website, error } = await supabase
    .from("websites")
    .select("id, user_id, name, domain, tracking_id, share_id, settings, created_at")
    .eq("id", websiteId)
    .single();

  if (error || !website) notFound();
  return website as Website;
}

export function getDateRangeFromSearch(searchParams: {
  from?: string;
  to?: string;
}) {
  return parseDateRange(searchParams.from, searchParams.to);
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
