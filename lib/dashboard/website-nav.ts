import type { LucideIcon } from "lucide-react";
import {
  BarChart2,
  Code2,
  FileText,
  Globe2,
  KeyRound,
  Monitor,
  Settings,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";

export type WebsiteNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const websiteNavLinks = (websiteId: string): WebsiteNavItem[] => [
  { href: `/dashboard/${websiteId}`, label: "Overview", icon: BarChart2, exact: true },
  { href: `/dashboard/${websiteId}/sessions`, label: "Sessions", icon: Users },
  { href: `/dashboard/${websiteId}/pages`, label: "Pages", icon: FileText },
  { href: `/dashboard/${websiteId}/sources`, label: "Sources", icon: Share2 },
  { href: `/dashboard/${websiteId}/geography`, label: "Geography", icon: Globe2 },
  { href: `/dashboard/${websiteId}/technology`, label: "Technology", icon: Monitor },
  { href: `/dashboard/${websiteId}/events`, label: "Events", icon: Sparkles },
  { href: `/dashboard/${websiteId}/tracking`, label: "Tracking", icon: Code2 },
  { href: `/dashboard/${websiteId}/api-keys`, label: "API Keys", icon: KeyRound },
  { href: `/dashboard/${websiteId}/settings`, label: "Settings", icon: Settings },
];

export function getActiveWebsiteId(pathname: string, websiteIds: string[]) {
  for (const id of websiteIds) {
    if (pathname === `/dashboard/${id}` || pathname.startsWith(`/dashboard/${id}/`)) {
      return id;
    }
  }
  return null;
}
