import type { Profile } from "@/lib/types";

export function getProfileInitials(profile: Pick<Profile, "full_name" | "email">) {
  const name = profile.full_name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const email = profile.email?.trim();
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

export function getProfileDisplayName(profile: Pick<Profile, "full_name" | "email">) {
  if (profile.full_name?.trim()) return profile.full_name.trim();
  if (profile.email) return profile.email.split("@")[0];
  return "User";
}
