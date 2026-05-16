"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CrelLogo } from "@/components/brand/crel-logo";
import { EmailConfirmationBanner } from "@/components/auth/email-confirmation-banner";
import { createClient } from "@/lib/supabase/client";
import {
  getAuthErrorMessage,
  isEmailNotConfirmedError,
  isEmailRateLimitError,
} from "@/lib/auth/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const emailValue = watch("email");

  async function onSubmit(data: FormData) {
    setPendingEmail(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) {
      if (isEmailNotConfirmedError(error.message)) {
        setPendingEmail(data.email);
        return;
      }
      setError("root", { message: getAuthErrorMessage(error.message) });
      if (isEmailRateLimitError(error.message)) {
        setPendingEmail(data.email);
      }
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="apple-hero-gradient flex min-h-full items-center justify-center p-6">
      <Card className="w-full max-w-[400px] rounded-2xl border-border/60 bg-card/90 shadow-lg backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <CrelLogo height={26} className="max-w-[7.5rem]" />
          </div>
          <CardTitle className="text-[24px] font-semibold tracking-[-0.02em]">Welcome back</CardTitle>
          <CardDescription className="text-[15px]">Sign in to your analytics dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingEmail && <EmailConfirmationBanner email={pendingEmail} />}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Forgot password?
                </Link>
              </div>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            {errors.root && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}
            <Button type="submit" className="apple-pill h-10 w-full text-[15px]" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          {!pendingEmail && emailValue && (
            <p className="text-center text-xs text-muted-foreground">
              Didn&apos;t get the confirmation email?{" "}
              <button
                type="button"
                className="underline"
                onClick={() => setPendingEmail(emailValue)}
              >
                Resend it
              </button>
            </p>
          )}
          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/signup" className="text-foreground underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
