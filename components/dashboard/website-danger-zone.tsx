import { DeleteWebsiteButton } from "@/components/dashboard/delete-website-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function WebsiteDangerZone({
  websiteId,
  websiteName,
}: {
  websiteId: string;
  websiteName: string;
}) {
  return (
    <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
      <CardHeader>
        <CardTitle className="text-[17px] font-semibold tracking-[-0.02em] text-destructive">
          Danger zone
        </CardTitle>
        <CardDescription className="text-[14px]">
          Permanently delete this website and all of its analytics data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DeleteWebsiteButton websiteId={websiteId} websiteName={websiteName} />
      </CardContent>
    </Card>
  );
}
