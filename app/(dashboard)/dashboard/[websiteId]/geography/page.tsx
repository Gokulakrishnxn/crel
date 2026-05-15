import { getCountries } from "@/lib/analytics/queries";
import { createClient } from "@/lib/supabase/server";
import { GeographyCountryList } from "@/components/dashboard/geography-country-list";
import { GeographyMap } from "@/components/dashboard/geography-map";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { WebsiteHeader } from "@/components/dashboard/website-header";
import {
  getDateRangeFromSearch,
  getWebsiteOrNotFound,
} from "@/lib/dashboard/website";

export default async function WebsiteGeographyPage({
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
  const countries = await getCountries(supabase, websiteId, range, 250);

  return (
    <DashboardPage>
      <WebsiteHeader
        website={website}
        range={range}
        title="Geography"
        description="See where your visitors come from on an interactive world map."
      />
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-5 lg:gap-6">
        <div className="min-w-0 lg:col-span-3">
          <GeographyMap countries={countries} />
        </div>
        <div className="min-w-0 lg:col-span-2">
          <GeographyCountryList countries={countries} />
        </div>
      </div>
    </DashboardPage>
  );
}
