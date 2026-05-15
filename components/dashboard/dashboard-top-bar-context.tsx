"use client";

import { usePathname } from "next/navigation";
import {
  getActiveWebsiteId,
  websiteNavLinks,
} from "@/lib/dashboard/website-nav";
import type { Website } from "@/lib/types";

const workspaceTitles: Record<string, string> = {
  "/dashboard": "Websites",
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Settings",
};

export function DashboardTopBarContext({ websites }: { websites: Website[] }) {
  const pathname = usePathname();
  const activeId = getActiveWebsiteId(
    pathname,
    websites.map((w) => w.id)
  );
  const website = websites.find((w) => w.id === activeId);

  if (website) {
    const navItem = websiteNavLinks(website.id).find((item) =>
      item.exact ? pathname === item.href : pathname.startsWith(item.href)
    );
    const section = navItem?.label ?? "Overview";

    return (
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold leading-tight tracking-[-0.02em]">
          {website.name}
        </p>
        <p className="truncate text-[12px] leading-tight text-muted-foreground">
          {section}
        </p>
      </div>
    );
  }

  const title =
    workspaceTitles[pathname] ??
    (pathname.startsWith("/dashboard") ? "Dashboard" : "Crel");

  return (
    <p className="truncate text-[15px] font-semibold leading-tight tracking-[-0.02em]">
      {title}
    </p>
  );
}
