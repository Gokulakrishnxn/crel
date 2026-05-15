export function getAuthRedirectUrl(path = "/auth/callback") {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

export function isEmailNotConfirmedError(message: string) {
  return /email not confirmed/i.test(message);
}

export function isEmailRateLimitError(message: string) {
  return /rate limit|too many requests|over_email_send_rate_limit/i.test(message);
}

/** User-friendly copy for Supabase Auth errors */
export function getAuthErrorMessage(message: string): string {
  if (isEmailRateLimitError(message)) {
    return "Supabase email limit reached. Wait about an hour, or confirm your account in the Supabase dashboard (see steps below).";
  }
  if (isEmailNotConfirmedError(message)) {
    return "Please confirm your email before signing in.";
  }
  return message;
}

export const SUPABASE_AUTH_USERS_URL =
  "https://supabase.com/dashboard/project/zdxjevgsdcidruaovkmt/auth/users";

export const SUPABASE_DISABLE_EMAIL_CONFIRM_URL =
  "https://supabase.com/dashboard/project/zdxjevgsdcidruaovkmt/auth/providers";
