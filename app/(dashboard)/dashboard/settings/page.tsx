"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  websiteName: z.string().min(2),
  domain: z.string().min(3),
});

type FormData = z.infer<typeof schema>;

export default function SettingsPage() {
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setMessage(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: siteError } = await supabase.from("websites").insert({
      user_id: user.id,
      name: data.websiteName,
      domain: data.domain,
    });

    if (siteError) {
      setError("root", { message: siteError.message });
      return;
    }

    setMessage("Website created. Open it from the sidebar.");
    window.location.href = "/dashboard";
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-[32px] font-semibold tracking-[-0.03em]">Settings</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Add a website to start collecting analytics.
        </p>
      </div>
      <Card className="rounded-2xl border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle>New website</CardTitle>
          <CardDescription>
            You will receive a tracking ID after creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="websiteName">Website name</Label>
              <Input id="websiteName" placeholder="Marketing site" {...register("websiteName")} />
              {errors.websiteName && (
                <p className="text-xs text-destructive">{errors.websiteName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input id="domain" placeholder="example.com" {...register("domain")} />
              {errors.domain && (
                <p className="text-xs text-destructive">{errors.domain.message}</p>
              )}
            </div>
            {errors.root && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
            <Button type="submit" className="apple-pill h-10 w-full text-[15px]" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Create website"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
