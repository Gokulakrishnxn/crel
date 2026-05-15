"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfileInitials } from "@/lib/profile/utils";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "size-8 text-xs",
  default: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-24 text-2xl font-semibold",
};

export function UserAvatar({
  fullName,
  email,
  avatarUrl,
  size = "default",
  className,
  showRing,
}: {
  fullName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
  showRing?: boolean;
}) {
  const initials = getProfileInitials({
    full_name: fullName ?? null,
    email: email ?? null,
  });

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0",
        showRing && "rounded-full p-1 ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
        className
      )}
    >
      <Avatar
        className={cn(sizeClasses[size], "after:border-0")}
        size={size === "sm" ? "sm" : size === "lg" || size === "xl" ? "lg" : "default"}
      >
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={fullName ?? "Profile"} />
        ) : null}
        <AvatarFallback
          className={cn(
            "bg-gradient-to-br from-primary/90 to-primary font-medium text-primary-foreground",
            size === "xl" && "text-3xl"
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
