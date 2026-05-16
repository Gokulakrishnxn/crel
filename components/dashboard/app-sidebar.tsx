"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe,
  LayoutDashboard,
  Plus,
  User,
} from "lucide-react";
import { CrelLogo } from "@/components/brand/crel-logo";
import { SidebarLineNav } from "@/components/dashboard/sidebar-line-nav";
import { UserAvatar } from "@/components/profile/user-avatar";
import {
  getActiveWebsiteId,
  websiteNavLinks,
} from "@/lib/dashboard/website-nav";
import { getProfileDisplayName } from "@/lib/profile/utils";
import type { Profile, Website } from "@/lib/types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

const workspaceNav = [
  { href: "/dashboard", label: "All websites", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/settings", label: "Add website", icon: Plus },
];

export function AppSidebar({
  websites,
  profile,
}: {
  websites: Website[];
  profile: Profile;
}) {
  const pathname = usePathname();
  const activeWebsiteId = getActiveWebsiteId(
    pathname,
    websites.map((w) => w.id)
  );
  const activeWebsite = websites.find((w) => w.id === activeWebsiteId);

  const websiteListItems = websites.map((site) => ({
    href: `/dashboard/${site.id}`,
    label: site.name,
    icon: Globe,
    exact: false as const,
  }));

  return (
    <Sidebar className="border-r border-border/60">
      <SidebarHeader className="dashboard-topbar flex h-14 shrink-0 flex-row items-center border-b border-border/60 px-4 py-0">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center py-0.5"
          aria-label="Crel home"
        >
          <CrelLogo height={26} className="max-w-[min(100%,7.5rem)]" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 py-4">
        <SidebarLineNav
          label="Workspace"
          items={workspaceNav}
          pathname={pathname}
        />

        {activeWebsite ? (
          <>
            <div className="mx-5 my-5 h-px bg-border/70" role="separator" />
            <SidebarLineNav
              label={activeWebsite.name}
              items={websiteNavLinks(activeWebsite.id)}
              pathname={pathname}
            />
          </>
        ) : (
          websiteListItems.length > 0 && (
            <>
              <div className="mx-5 my-5 h-px bg-border/70" role="separator" />
              <SidebarLineNav
                label="Websites"
                items={websiteListItems}
                pathname={pathname}
              />
            </>
          )
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 p-3">
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-sidebar-accent"
        >
          <UserAvatar
            fullName={profile.full_name}
            email={profile.email}
            avatarUrl={profile.avatar_url}
            size="default"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">
              {getProfileDisplayName(profile)}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">View profile</p>
          </div>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
