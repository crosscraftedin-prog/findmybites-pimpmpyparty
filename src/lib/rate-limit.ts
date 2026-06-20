import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory rate limiter for API routes.
 * Uses a Map of IP → request timestamps.
 *
 * Usage:
 *   const limited = rateLimit(req, { windowMs: 60000, max: 10 });
 *   if (limited) return limited;
 *
 * For production with multiple server instances, replace with Redis or
 * Upstash Ratelimit. This in-memory implementation works for single-instance
 * Vercel serverless functions.
 */

interface RateLimitOptions {
  windowMs?: number; // time window in milliseconds (default: 60s)
  max?: number; // max requests per window (default: 30)
  message?: string; // error message
}

const DEFAULT_WINDOW = 60_000; // 1 minute
const DEFAULT_MAX = 30; // 30 requests per minute

// Store: Map<key, timestamps[]>
const store = new Map<string, number[]>();

// Clean up old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of store.entries()) {
    const recent = timestamps.filter((t) => now - t < DEFAULT_WINDOW);
    if (recent.length === 0) {
      store.delete(key);
    } else {
      store.set(key, recent);
    }
  }
}, 300_000);

/**
 * Rate limit a request. Returns a 429 NextResponse if rate limit exceeded,
 * or null if the request is allowed.
 */
export function rateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): NextResponse | null {
  const windowMs = options.windowMs ?? DEFAULT_WINDOW;
  const max = options.max ?? DEFAULT_MAX;
  const message = options.message ?? "Too many requests. Please try again later.";

  // Get client IP (from x-forwarded-for header, or fallback to a default)
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

  const now = Date.now();
  const key = `${ip}:${req.nextUrl.pathname}`;

  const timestamps = store.get(key) ?? [];
  const recent = timestamps.filter((t) => now - t < windowMs);

  if (recent.length >= max) {
    return NextResponse.json(
      { error: message },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(windowMs / 1000)),
        },
      }
    );
  }

  recent.push(now);
  store.set(key, recent);

  return null; // allowed
}
