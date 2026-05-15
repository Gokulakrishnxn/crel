import { ProfileForm } from "@/components/profile/profile-form";
import { getProfileOrFallback } from "@/lib/profile/queries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createClient();
  const profile = await getProfileOrFallback(supabase);

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
          Account
        </p>
        <h1 className="mt-1 text-[32px] font-semibold tracking-[-0.03em]">Profile</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Manage your personal information and how you appear in Crel.
        </p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}
