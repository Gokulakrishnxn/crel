import {
  getOverviewStats,
  getTimeSeries,
  getTopPages,
  getTrafficSources,
} from "@/lib/analytics/queries";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { BreakdownTable } from "@/components/dashboard/breakdown-table";
import {
  DashboardGrid2,
  DashboardPage,
  DashboardStack,
} from "@/components/dashboard/dashboard-page";
import { RealtimeIndicator } from "@/components/dashboard/realtime-indicator";
import { SeedButton } from "@/components/dashboard/seed-button";
import { StatCards } from "@/components/dashboard/stat-cards";
import { WebsiteHeader } from "@/components/dashboard/website-header";
import {
  getDateRangeFromSearch,
  getWebsiteOrNotFound,
} from "@/lib/dashboard/website";

export default async function WebsiteOverviewPage({
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

  const [overview, timeSeries, topPages, sources] = await Promise.all([
    getOverviewStats(supabase, websiteId, range),
    getTimeSeries(supabase, websiteId, range),
    getTopPages(supabase, websiteId, range),
    getTrafficSources(supabase, websiteId, range),
  ]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <DashboardPage>
      <WebsiteHeader website={website} range={range}>
        <RealtimeIndicator websiteId={websiteId} />
      </WebsiteHeader>

      {isDev && overview.pageviews === 0 && (
        <div className="dashboard-card rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-4 sm:px-6 sm:py-5">
          <p className="mb-2 text-[14px] font-medium sm:mb-3">No data yet</p>
          <p className="mb-4 text-[13px] leading-relaxed text-muted-foreground">
            Install the tracking snippet, or load 30 days of demo data to explore the dashboard.
          </p>
          <SeedButton websiteId={websiteId} />
        </div>
      )}

      <DashboardStack>
        <StatCards stats={overview} />
        <AnalyticsChart data={timeSeries} />
        <DashboardGrid2>
          <BreakdownTable title="Top pages" rows={topPages} />
          <BreakdownTable title="Traffic sources" rows={sources} />
        </DashboardGrid2>
      </DashboardStack>
    </DashboardPage>
  );
}
