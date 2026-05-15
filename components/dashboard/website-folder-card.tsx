"use client";

import Link from "next/link";
import { MacOSFolderIcon } from "@/components/dashboard/macos-folder-icon";
import { DeleteWebsiteButton } from "@/components/dashboard/delete-website-button";
import { cn } from "@/lib/utils";

export function WebsiteFolderCard({
  id,
  name,
  domain,
}: {
  id: string;
  name: string;
  domain: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex w-[140px] flex-col items-center",
        "rounded-xl p-3 transition-colors",
        "hover:bg-accent/60 focus-within:bg-accent/60"
      )}
    >
      <div
        className="absolute right-1 top-1 z-10 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        onClick={(e) => e.preventDefault()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DeleteWebsiteButton
          websiteId={id}
          websiteName={name}
          variant="icon"
        />
      </div>

      <Link
        href={`/dashboard/${id}`}
        className="flex w-full flex-col items-center gap-2 outline-none"
      >
        <div
          className={cn(
            "transition-transform duration-200 ease-out",
            "group-hover:scale-[1.04] group-active:scale-[0.98]"
          )}
        >
          <MacOSFolderIcon />
        </div>
        <div className="w-full text-center">
          <p className="truncate px-1 text-[13px] font-medium leading-tight text-foreground">
            {name}
          </p>
          <p className="mt-0.5 truncate px-1 text-[11px] leading-tight text-muted-foreground">
            {domain.replace(/^https?:\/\//, "")}
          </p>
        </div>
      </Link>
    </div>
  );
}

export function NewWebsiteFolderCard() {
  return (
    <Link
      href="/dashboard/settings"
      className={cn(
        "group flex w-[140px] flex-col items-center rounded-xl p-3",
        "transition-colors hover:bg-accent/60"
      )}
    >
      <div
        className={cn(
          "transition-transform duration-200 ease-out",
          "group-hover:scale-[1.04] group-active:scale-[0.98]"
        )}
      >
        <MacOSFolderIcon variant="new" />
      </div>
      <div className="mt-2 w-full text-center">
        <p className="truncate px-1 text-[13px] font-medium leading-tight text-foreground">
          New Website
        </p>
        <p className="mt-0.5 truncate px-1 text-[11px] leading-tight text-muted-foreground">
          Add project
        </p>
      </div>
    </Link>
  );
}
