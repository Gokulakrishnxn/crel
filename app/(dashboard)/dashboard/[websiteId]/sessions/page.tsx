import {
  getOverviewStats,
  getSessionList,
} from "@/lib/analytics/queries";
import { createClient } from "@/lib/supabase/server";
import { DashboardPage, DashboardStack } from "@/components/dashboard/dashboard-page";
import { SessionSummary } from "@/components/dashboard/session-summary";
import { SessionsView } from "@/components/dashboard/sessions-view";
import { WebsiteHeader } from "@/components/dashboard/website-header";
import {
  getDateRangeFromSearch,
  getWebsiteOrNotFound,
} from "@/lib/dashboard/website";

const SESSION_LIST_LIMIT = 100;

export default async function WebsiteSessionsPage({
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

  const [stats, sessions] = await Promise.all([
    getOverviewStats(supabase, websiteId, range),
    getSessionList(supabase, websiteId, range, SESSION_LIST_LIMIT),
  ]);

  return (
    <DashboardPage>
      <WebsiteHeader
        website={website}
        range={range}
        title="Sessions"
        description="Browse individual visits with location, device, and traffic source details."
      />
      <DashboardStack>
        <SessionSummary stats={stats} />
        <SessionsView sessions={sessions} limit={SESSION_LIST_LIMIT} />
      </DashboardStack>
    </DashboardPage>
  );
}
