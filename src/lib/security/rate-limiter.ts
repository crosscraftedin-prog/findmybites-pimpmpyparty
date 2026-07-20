/**
 * In-memory API rate limiter.
 *
 * Provides per-IP rate limiting for public API endpoints. Uses an in-memory
 * Map with sliding window. On Vercel serverless, each instance has its own
 * Map — this is not a distributed rate limiter, but it provides protection
 * against abuse from a single client hitting the same instance repeatedly.
 *
 * For production-grade distributed rate limiting, use Upstash Ratelimit
 * (@upstash/ratelimit + @upstash/redis). This implementation is a fallback
 * when Redis is not configured.
 *
 * Usage in API routes:
 *   import { checkRateLimit } from "@/lib/security/rate-limiter";
 *
 *   const rateLimit = checkRateLimit(req, { windowMs: 60_000, max: 30 });
 *   if (!rateLimit.allowed) {
 *     return NextResponse.json({ error: "Too many requests" }, {
 *       status: 429,
 *       headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) }
 *     });
 *   }
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitMap) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Check rate limit for a request.
 *
 * @param identifier - Unique key (IP address or user ID)
 * @param windowMs - Time window in milliseconds (default: 60s)
 * @param max - Max requests per window (default: 30)
 */
export function checkRateLimit(
  identifier: string,
  windowMs: number = 60_000,
  max: number = 30
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const key = identifier;

  const existing = rateLimitMap.get(key);

  if (!existing || existing.resetAt < now) {
    // New window
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, retryAfterMs: 0 };
  }

  if (existing.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: existing.resetAt - now,
    };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: max - existing.count,
    retryAfterMs: 0,
  };
}

/**
 * Get client IP from request headers.
 * Handles Vercel's x-forwarded-for and x-real-ip headers.
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

/**
 * Rate limit presets for different endpoint types.
 */
export const RATE_LIMITS = {
  // Public read APIs: 60 requests per minute (1 per second)
  publicRead: { windowMs: 60_000, max: 60 },

  // Public write APIs (enquiries, bookings): 10 per minute
  publicWrite: { windowMs: 60_000, max: 10 },

  // AI routes: 5 per minute (expensive)
  ai: { windowMs: 60_000, max: 5 },

  // Upload routes: 10 per minute
  upload: { windowMs: 60_000, max: 10 },

  // Auth routes: 5 per minute (prevent brute force)
  auth: { windowMs: 60_000, max: 5 },
} as const;
