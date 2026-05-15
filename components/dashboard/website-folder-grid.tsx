import {
  NewWebsiteFolderCard,
  WebsiteFolderCard,
} from "@/components/dashboard/website-folder-card";
import type { Website } from "@/lib/types";

export function WebsiteFolderGrid({ websites }: { websites: Website[] }) {
  return (
    <div
      className="flex flex-wrap gap-2 sm:gap-4"
      role="list"
      aria-label="Your websites"
    >
      {websites.map((site) => (
        <div key={site.id} role="listitem">
          <WebsiteFolderCard id={site.id} name={site.name} domain={site.domain} />
        </div>
      ))}
      <div role="listitem">
        <NewWebsiteFolderCard />
      </div>
    </div>
  );
}
