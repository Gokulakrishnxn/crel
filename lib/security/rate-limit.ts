/** Simple in-memory rate limiter for serverless (per-instance). Use Upstash Redis in production. */

const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return {
    success: true,
    remaining: limit - bucket.count,
    resetAt: bucket.resetAt,
  };
}

/** Basic bot detection heuristics */
export function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent) return true;
  const botPatterns = [
    /bot/i,
    /crawl/i,
    /spider/i,
    /slurp/i,
    /headless/i,
    /phantom/i,
    /preview/i,
    /lighthouse/i,
  ];
  return botPatterns.some((p) => p.test(userAgent));
}
