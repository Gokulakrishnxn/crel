"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardTopNav } from "@/components/dashboard/dashboard-top-nav";
import type { Profile, Website } from "@/lib/types";

export function DashboardShell({
  websites,
  profile,
  children,
}: {
  websites: Website[];
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar websites={websites} profile={profile} />
      <SidebarInset className="bg-background">
        <DashboardTopNav profile={profile} websites={websites} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-10">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
