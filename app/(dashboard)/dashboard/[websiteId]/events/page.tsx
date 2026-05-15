import { getTopEvents } from "@/lib/analytics/queries";
import { createClient } from "@/lib/supabase/server";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { WebsiteHeader } from "@/components/dashboard/website-header";
import { EventsTable } from "@/components/dashboard/events-table";
import {
  getDateRangeFromSearch,
  getWebsiteOrNotFound,
} from "@/lib/dashboard/website";

export default async function WebsiteEventsPage({
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
  const events = await getTopEvents(supabase, websiteId, range);

  return (
    <DashboardPage>
      <WebsiteHeader
        website={website}
        range={range}
        title="Events"
        description="Custom events tracked via window.crel.track()."
      />
      <EventsTable events={events} />
    </DashboardPage>
  );
}
