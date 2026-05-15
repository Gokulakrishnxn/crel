import { createClient } from "@/lib/supabase/server";
import { ApiKeysList } from "@/components/dashboard/api-keys-list";
import { WebsiteHeader } from "@/components/dashboard/website-header";
import {
  getAppUrl,
  getDateRangeFromSearch,
  getWebsiteOrNotFound,
} from "@/lib/dashboard/website";
import type { ApiKey } from "@/components/dashboard/api-keys-list";

export default async function ApiKeysPage({
  params,
  searchParams,
}: {
  params: Promise<{ websiteId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { websiteId } = await params;
  const sp = await searchParams;
  const website = await getWebsiteOrNotFound(websiteId);
  const range = getDateRangeFromSearch(sp);
  const appUrl = getAppUrl();

  const supabase = await createClient();
  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, last_used_at, created_at")
    .eq("website_id", websiteId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8 pb-10">
      <WebsiteHeader
        website={website}
        range={range}
        title="API Keys"
        description="Authenticate event collection from any site, server, or pipeline."
      />
      <ApiKeysList
        websiteId={websiteId}
        appUrl={appUrl}
        initialKeys={(keys ?? []) as ApiKey[]}
      />
    </div>
  );
}
