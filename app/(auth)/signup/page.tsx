"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CrelLogo } from "@/components/brand/crel-logo";
import { EmailConfirmationBanner } from "@/components/auth/email-confirmation-banner";
import { createClient } from "@/lib/supabase/client";
import {
  getAuthErrorMessage,
  getAuthRedirectUrl,
  isEmailRateLimitError,
} from "@/lib/auth/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

const authCardClass =
  "w-full max-w-[400px] rounded-2xl border-border/60 bg-card/90 shadow-lg backdrop-blur-xl";

export default function SignupPage() {
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setRegisteredEmail(null);
    const supabase = createClient();
    const { data: result, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName },
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });

    if (error) {
      setError("root", { message: getAuthErrorMessage(error.message) });
      if (!isEmailRateLimitError(error.message)) return;
      setRegisteredEmail(data.email);
      return;
    }

    if (!result.session) {
      setRegisteredEmail(data.email);
      return;
    }

    window.location.href = "/dashboard";
  }

  if (registeredEmail) {
    return (
      <div className="apple-hero-gradient flex min-h-full items-center justify-center p-6">
        <Card className={authCardClass}>
          <CardHeader className="text-center">
            <CardTitle className="text-[24px] font-semibold tracking-[-0.02em]">
              Check your email
            </CardTitle>
            <CardDescription className="text-[15px]">
              One more step to activate your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailConfirmationBanner email={registeredEmail} />
            <p className="mt-4 text-center text-[14px] text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="apple-hero-gradient flex min-h-full items-center justify-center p-6">
      <Card className={authCardClass}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex items-center justify-center gap-2 text-[17px] font-semibold tracking-[-0.02em]">
            <CrelLogo height={32} className="max-w-[9rem]" />
          </div>
          <CardTitle className="text-[24px] font-semibold tracking-[-0.02em]">
            Create account
          </CardTitle>
          <CardDescription className="text-[15px]">
            Start tracking in under a minute
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Name</Label>
              <Input id="fullName" className="h-10 rounded-lg" {...register("fullName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" className="h-10 rounded-lg" {...register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" className="h-10 rounded-lg" {...register("password")} />
            </div>
            {errors.root && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}
            <Button type="submit" className="apple-pill h-10 w-full text-[15px]" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-[14px] text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
