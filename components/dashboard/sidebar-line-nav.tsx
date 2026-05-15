"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarLineNavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  exact?: boolean;
};

function isNavActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export function SidebarLineNav({
  label,
  items,
  pathname,
  className,
}: {
  label?: string;
  items: SidebarLineNavItem[];
  pathname: string;
  className?: string;
}) {
  return (
    <nav className={cn("px-3", className)} aria-label={label}>
      {label && (
        <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </p>
      )}
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = isNavActive(pathname, item.href, item.exact);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-2 py-2 text-[14px] leading-tight transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-foreground"
                    : "font-normal text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "size-[17px] shrink-0 transition-colors",
                      active
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                    strokeWidth={1.75}
                  />
                )}
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
