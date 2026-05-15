"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getAuthErrorMessage,
  getAuthRedirectUrl,
  isEmailRateLimitError,
  SUPABASE_AUTH_USERS_URL,
  SUPABASE_DISABLE_EMAIL_CONFIRM_URL,
} from "@/lib/auth/config";
import { Button } from "@/components/ui/button";

export function EmailConfirmationBanner({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  async function resend() {
    setStatus("sending");
    setMessage(null);
    setRateLimited(false);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: getAuthRedirectUrl() },
    });
    if (error) {
      setStatus("error");
      const limited = isEmailRateLimitError(error.message);
      setRateLimited(limited);
      setMessage(getAuthErrorMessage(error.message));
      return;
    }
    setStatus("sent");
    setMessage("Confirmation email sent. Check your inbox (and spam).");
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
        <p className="font-medium text-foreground">Confirm your email</p>
        <p className="mt-1 text-muted-foreground">
          We sent a link to <span className="font-medium text-foreground">{email}</span>.
          Click it, then sign in again.
        </p>
        {message && (
          <p
            className={`mt-2 ${rateLimited ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}
          >
            {message}
          </p>
        )}
        {!rateLimited && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={status === "sending" || status === "sent"}
            onClick={resend}
          >
            {status === "sending"
              ? "Sending…"
              : status === "sent"
                ? "Email sent"
                : "Resend confirmation email"}
          </Button>
        )}
      </div>

      {(rateLimited || status === "error") && (
        <div className="rounded-lg border bg-muted/50 p-4 text-sm">
          <p className="font-medium">Bypass for local development</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
            <li>
              <a
                href={SUPABASE_AUTH_USERS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline"
              >
                Open Supabase → Users
              </a>
              , select your account, and confirm the email manually.
            </li>
            <li>
              Or disable &quot;Confirm email&quot; under{" "}
              <a
                href={SUPABASE_DISABLE_EMAIL_CONFIRM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline"
              >
                Auth → Providers → Email
              </a>{" "}
              (then sign in without waiting for email).
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
