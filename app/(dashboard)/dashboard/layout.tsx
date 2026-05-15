import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getWebsitesForUser } from "@/lib/analytics/queries";
import { getProfileOrFallback } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";
import type { Website } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let websites: Website[] = [];
  try {
    websites = (await getWebsitesForUser(supabase)) as Website[];
  } catch {
    websites = [];
  }

  const profile = await getProfileOrFallback(supabase);
  if (!profile) {
    redirect("/login");
  }

  return (
    <DashboardShell websites={websites} profile={profile}>
      {children}
    </DashboardShell>
  );
}
