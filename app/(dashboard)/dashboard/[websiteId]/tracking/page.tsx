import { TrackingSnippet } from "@/components/dashboard/tracking-snippet";
import { ShareLink } from "@/components/dashboard/share-link";
import { PageSection } from "@/components/dashboard/page-section";
import { WebsiteHeader } from "@/components/dashboard/website-header";
import {
  getAppUrl,
  getDateRangeFromSearch,
  getWebsiteOrNotFound,
} from "@/lib/dashboard/website";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function WebsiteTrackingPage({
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

  return (
    <div className="space-y-8 pb-10">
      <WebsiteHeader
        website={website}
        range={range}
        title="Tracking"
        description="Install the script on your site to start collecting analytics."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <TrackingSnippet trackingId={website.tracking_id} appUrl={appUrl} />
        <Card className="rounded-2xl border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="text-[17px] font-semibold tracking-[-0.02em]">
              Tracking ID
            </CardTitle>
            <CardDescription className="text-[14px]">
              Use this ID if you integrate via API or a tag manager.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <code className="block rounded-lg bg-muted px-4 py-3 text-[13px]">
              {website.tracking_id}
            </code>
            <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
              Events are sent to <span className="text-foreground">{appUrl}/api/collect</span>.
              The script batches requests and works with single-page apps.
            </p>
          </CardContent>
        </Card>
      </div>
      <PageSection
        title="Custom events"
        description="Track conversions and product actions from your app."
      >
        <Card className="rounded-2xl border-border/60 bg-card/90">
          <CardContent className="pt-6">
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-[13px] leading-relaxed">
              <code>{`// After the script loads
window.crel.track('signup', { plan: 'pro' });
window.crel.track('purchase', { value: 49 });`}</code>
            </pre>
          </CardContent>
        </Card>
      </PageSection>
      <PageSection
        title="Sharing"
        description="Share a public read-only view of this website's analytics."
      >
        <ShareLink websiteId={website.id} shareId={website.share_id ?? null} appUrl={appUrl} />
      </PageSection>
    </div>
  );
}
