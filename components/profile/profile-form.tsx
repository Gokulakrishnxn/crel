"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/profile/user-avatar";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/types";
import { getProfileDisplayName } from "@/lib/profile/utils";

const schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  avatarUrl: z.string().refine(
    (val) => val === "" || /^https?:\/\/.+/.test(val),
    "Enter a valid image URL"
  ),
});

type FormData = z.infer<typeof schema>;

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState(profile.avatar_url ?? "");
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: profile.full_name ?? "",
      avatarUrl: profile.avatar_url ?? "",
    },
  });

  const avatarWatch = watch("avatarUrl");

  async function onSubmit(data: FormData) {
    setSaved(false);
    const supabase = createClient();
    const avatar_url = data.avatarUrl?.trim() || null;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.fullName.trim(),
        avatar_url,
      })
      .eq("id", profile.id);

    if (error) {
      setError("root", { message: error.message });
      return;
    }

    await supabase.auth.updateUser({
      data: { full_name: data.fullName.trim(), avatar_url },
    });

    setPreviewUrl(avatar_url ?? "");
    setSaved(true);
    router.refresh();
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const displayAvatar = avatarWatch?.trim() || previewUrl;

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <Card className="rounded-2xl border-border/60 bg-card/90 lg:sticky lg:top-24 lg:self-start">
        <CardContent className="flex flex-col items-center px-6 py-10 text-center">
          <UserAvatar
            fullName={watch("fullName") || profile.full_name}
            email={profile.email}
            avatarUrl={displayAvatar || null}
            size="xl"
            showRing
          />
          <h2 className="mt-6 text-[20px] font-semibold tracking-[-0.02em]">
            {getProfileDisplayName({
              full_name: watch("fullName") || profile.full_name,
              email: profile.email,
            })}
          </h2>
          <p className="mt-1 text-[14px] text-muted-foreground">{profile.email}</p>
          <p className="mt-4 text-[12px] text-muted-foreground">
            Member since{" "}
            {new Date(profile.created_at).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="rounded-2xl border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="text-[19px] font-semibold tracking-[-0.02em]">
              Profile details
            </CardTitle>
            <CardDescription className="text-[14px]">
              Update how you appear across the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">Display name</Label>
                <Input
                  id="fullName"
                  className="h-10 rounded-lg"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile.email ?? ""}
                  disabled
                  className="h-10 rounded-lg bg-muted/50"
                />
                <p className="text-[12px] text-muted-foreground">
                  Email is managed through authentication and cannot be changed here.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar image URL</Label>
                <Input
                  id="avatarUrl"
                  placeholder="https://example.com/avatar.jpg"
                  className="h-10 rounded-lg"
                  {...register("avatarUrl")}
                />
                {errors.avatarUrl && (
                  <p className="text-xs text-destructive">{errors.avatarUrl.message}</p>
                )}
              </div>
              {errors.root && (
                <p className="text-sm text-destructive">{errors.root.message}</p>
              )}
              {saved && (
                <p className="text-[14px] text-primary">Profile saved successfully.</p>
              )}
              <Button
                type="submit"
                className="apple-pill h-10 px-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="text-[19px] font-semibold tracking-[-0.02em]">
              Account
            </CardTitle>
            <CardDescription className="text-[14px]">
              Sign out of Crel on this device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="apple-pill" onClick={signOut}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
