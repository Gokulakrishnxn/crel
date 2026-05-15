"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getAuthRedirectUrl } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({ email: z.string().email() });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: getAuthRedirectUrl("/auth/callback?next=/reset-password"),
    });
    if (error) {
      setError("root", { message: error.message });
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="apple-hero-gradient flex min-h-full items-center justify-center p-6">
        <Card className="w-full max-w-[400px] rounded-2xl border-border/60 bg-card/90 shadow-lg backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-[24px] font-semibold tracking-[-0.02em]">
              Check your email
            </CardTitle>
            <CardDescription className="text-[15px]">
              We sent a password reset link to your inbox.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-foreground underline">
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
      <Card className="w-full max-w-[400px] rounded-2xl border-border/60 bg-card/90 shadow-lg backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex items-center justify-center gap-2 text-[17px] font-semibold tracking-[-0.02em]">
            <BarChart3 className="h-[22px] w-[22px] text-primary" strokeWidth={2} />
            Crel
          </div>
          <CardTitle className="text-[24px] font-semibold tracking-[-0.02em]">
            Reset password
          </CardTitle>
          <CardDescription className="text-[15px]">
            Enter your email and we&apos;ll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" className="h-10 rounded-lg" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
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
              {isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link href="/login" className="text-foreground underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
