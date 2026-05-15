"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Settings, User } from "lucide-react";
import { DashboardTopBarContext } from "@/components/dashboard/dashboard-top-bar-context";
import { UserAvatar } from "@/components/profile/user-avatar";
import { createClient } from "@/lib/supabase/client";
import { getProfileDisplayName } from "@/lib/profile/utils";
import type { Profile, Website } from "@/lib/types";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";

export function DashboardTopNav({
  profile,
  websites,
}: {
  profile: Profile;
  websites: Website[];
}) {
  const router = useRouter();
  const displayName = getProfileDisplayName(profile);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="dashboard-topbar sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/60 px-4 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <SidebarTrigger className="size-8 shrink-0 text-muted-foreground md:hidden" />
        <DashboardTopBarContext websites={websites} />
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-9 items-center gap-2 rounded-full pl-1 pr-2.5 outline-none transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Account menu"
          >
            <UserAvatar
              fullName={profile.full_name}
              email={profile.email}
              avatarUrl={profile.avatar_url}
              size="sm"
            />
            <span className="hidden max-w-[100px] truncate text-[13px] font-medium lg:inline">
              {displayName}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/dashboard/profile" />}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/dashboard" />}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Websites
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
              <Settings className="mr-2 h-4 w-4" />
              Add website
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
