import { getTrafficSources } from "@/lib/analytics/queries";
import { createClient } from "@/lib/supabase/server";
import { BreakdownTable } from "@/components/dashboard/breakdown-table";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { WebsiteHeader } from "@/components/dashboard/website-header";
import {
  getDateRangeFromSearch,
  getWebsiteOrNotFound,
} from "@/lib/dashboard/website";

export default async function WebsiteSourcesPage({
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
  const supabase = await createClient();
  const sources = await getTrafficSources(supabase, websiteId, range);

  return (
    <DashboardPage>
      <WebsiteHeader
        website={website}
        range={range}
        title="Traffic sources"
        description="Where visitors come from — direct, referral, and UTM campaigns."
      />
      <BreakdownTable title="Sources" rows={sources} />
    </DashboardPage>
  );
}
