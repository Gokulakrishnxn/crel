import {
  getBrowsers,
  getDevices,
  getOs,
} from "@/lib/analytics/queries";
import { createClient } from "@/lib/supabase/server";
import { BreakdownTable } from "@/components/dashboard/breakdown-table";
import { DashboardGrid3, DashboardPage } from "@/components/dashboard/dashboard-page";
import { WebsiteHeader } from "@/components/dashboard/website-header";
import {
  getDateRangeFromSearch,
  getWebsiteOrNotFound,
} from "@/lib/dashboard/website";

export default async function WebsiteTechnologyPage({
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

  const [browsers, devices, os] = await Promise.all([
    getBrowsers(supabase, websiteId, range),
    getDevices(supabase, websiteId, range),
    getOs(supabase, websiteId, range),
  ]);

  return (
    <DashboardPage>
      <WebsiteHeader
        website={website}
        range={range}
        title="Technology"
        description="Browsers, devices, and operating systems used by your visitors."
      />
      <DashboardGrid3>
        <BreakdownTable title="Browsers" rows={browsers} />
        <BreakdownTable title="Devices" rows={devices} />
        <BreakdownTable title="Operating systems" rows={os} />
      </DashboardGrid3>
    </DashboardPage>
  );
}
