"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Website } from "@/lib/types";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  domain: z.string().min(3, "Domain is required"),
});

type FormData = z.infer<typeof schema>;

export function WebsiteSettingsForm({ website }: { website: Website }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: website.name,
      domain: website.domain,
    },
  });

  async function onSubmit(data: FormData) {
    setSaved(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("websites")
      .update({ name: data.name, domain: data.domain })
      .eq("id", website.id);

    if (error) {
      setError("root", { message: error.message });
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <Card className="rounded-2xl border-border/60 bg-card/90">
      <CardHeader>
        <CardTitle className="text-[17px] font-semibold tracking-[-0.02em]">
          General
        </CardTitle>
        <CardDescription className="text-[14px]">
          Update your website name and domain.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Website name</Label>
            <Input id="name" className="h-10 rounded-lg" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              placeholder="example.com"
              className="h-10 rounded-lg"
              {...register("domain")}
            />
            {errors.domain && (
              <p className="text-xs text-destructive">{errors.domain.message}</p>
            )}
          </div>
          {errors.root && (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          )}
          {saved && (
            <p className="text-[14px] text-primary">Settings saved.</p>
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
  );
}
