"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CrelLogo } from "@/components/brand/crel-logo";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) {
      setError("root", { message: error.message });
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="apple-hero-gradient flex min-h-full items-center justify-center p-6">
      <Card className="w-full max-w-[400px] rounded-2xl border-border/60 bg-card/90 shadow-lg backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex items-center justify-center gap-2 text-[17px] font-semibold tracking-[-0.02em]">
            <CrelLogo height={32} className="max-w-[9rem]" />
          </div>
          <CardTitle className="text-[24px] font-semibold tracking-[-0.02em]">
            Set new password
          </CardTitle>
          <CardDescription className="text-[15px]">
            Choose a strong password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                className="h-10 rounded-lg"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                className="h-10 rounded-lg"
                {...register("confirm")}
              />
              {errors.confirm && (
                <p className="text-xs text-destructive">{errors.confirm.message}</p>
              )}
            </div>
            {errors.root && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}
            <Button
              type="submit"
              className="apple-pill h-10 w-full text-[15px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
