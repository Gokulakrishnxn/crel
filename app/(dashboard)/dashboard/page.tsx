import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { WebsiteFolderGrid } from "@/components/dashboard/website-folder-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getWebsitesForUser } from "@/lib/analytics/queries";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const websites = await getWebsitesForUser(supabase).catch(() => []);

  return (
    <DashboardPage>
      <header>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-[28px] lg:text-[32px]">
          Websites
        </h1>
        <p className="mt-1 text-[14px] text-muted-foreground sm:text-[15px]">
          Open a project folder to view analytics, or create a new one.
        </p>
      </header>
      {websites.length === 0 ? (
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>No websites yet</CardTitle>
            <CardDescription>
              Create your first website to get a tracking snippet and dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings">
              <Button className="apple-pill">
                <Plus className="mr-2 h-4 w-4" />
                Add website
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="finder-desktop rounded-2xl border border-border/40 bg-muted/20 p-4 sm:p-6 md:p-8">
          <WebsiteFolderGrid websites={websites} />
        </div>
      )}
    </DashboardPage>
  );
}
