import { WebsiteSettingsForm } from "@/components/dashboard/website-settings-form";
import { WebsiteDangerZone } from "@/components/dashboard/website-danger-zone";
import { PageSection } from "@/components/dashboard/page-section";
import { WebsiteHeader } from "@/components/dashboard/website-header";
import {
  getDateRangeFromSearch,
  getWebsiteOrNotFound,
} from "@/lib/dashboard/website";

export default async function WebsiteSettingsPage({
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

  return (
    <div className="space-y-8 pb-10">
      <WebsiteHeader
        website={website}
        range={range}
        title="Website settings"
        description="Update your website name and domain."
      />
      <PageSection>
        <WebsiteSettingsForm website={website} />
      </PageSection>
      <WebsiteDangerZone websiteId={website.id} websiteName={website.name} />
    </div>
  );
}
