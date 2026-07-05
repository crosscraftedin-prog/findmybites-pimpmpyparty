/**
 * Rate Limiter — adapter pattern with in-memory + Redis scaffold.
 * ───────────────────────────────────────────────────────────────────────────
 * Current: In-memory (Map) — works on Vercel serverless but resets on
 * cold start. Acceptable for soft limits.
 *
 * Future: Set RATE_LIMIT_REDIS_URL env var to switch to Redis adapter
 * (hard limits, survives cold starts, works across instances).
 *
 * Limits per subscription tier:
 *   free: 5 AI requests/day
 *   pro: 50 AI requests/day
 *   business: 200 AI requests/day
 */
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const AI_LIMITS: Record<string, number> = {
  free: 5,
  pro: 50,
  business: 200,
};

// ── Adapter Interface ────────────────────────────────────────────────────────
export interface RateLimiterAdapter {
  check(vendorId: string, limit: number): Promise<{ allowed: boolean; remaining: number }>;
  increment(vendorId: string): Promise<void>;
}

// ── In-Memory Adapter ────────────────────────────────────────────────────────
class MemoryAdapter implements RateLimiterAdapter {
  private counts = new Map<string, { date: string; count: number }>();

  private todayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  async check(vendorId: string, limit: number): Promise<{ allowed: boolean; remaining: number }> {
    const today = this.todayKey();
    const entry = this.counts.get(vendorId);
    if (!entry || entry.date !== today) {
      this.counts.set(vendorId, { date: today, count: 0 });
      return { allowed: true, remaining: limit };
    }
    const remaining = Math.max(0, limit - entry.count);
    return { allowed: entry.count < limit, remaining };
  }

  async increment(vendorId: string): Promise<void> {
    const today = this.todayKey();
    const entry = this.counts.get(vendorId);
    if (!entry || entry.date !== today) {
      this.counts.set(vendorId, { date: today, count: 1 });
    } else {
      entry.count++;
    }
  }
}

// ── Redis Adapter (scaffold — disabled by default) ───────────────────────────
class RedisAdapter implements RateLimiterAdapter {
  // When Redis is available, implement using INCR + EXPIRE:
  //   key = `ai:${vendorId}:${todayKey}`
  //   count = await redis.incr(key)
  //   if count === 1: await redis.expire(key, 86400)
  //   allowed = count <= limit
  //   remaining = max(0, limit - count)

  async check(_vendorId: string, _limit: number): Promise<{ allowed: boolean; remaining: number }> {
    // Not implemented — falls through to memory adapter
    throw new Error("Redis adapter not configured");
  }

  async increment(_vendorId: string): Promise<void> {
    throw new Error("Redis adapter not configured");
  }
}

// ── Adapter Selection ────────────────────────────────────────────────────────
let adapter: RateLimiterAdapter;

if (process.env.RATE_LIMIT_REDIS_URL) {
  // Future: initialize Redis client here
  // adapter = new RedisAdapter();
  logger.warn("rate-limiter", "RATE_LIMIT_REDIS_URL set but Redis adapter not yet implemented — using in-memory");
  adapter = new MemoryAdapter();
} else {
  adapter = new MemoryAdapter();
}

// ── Public API ───────────────────────────────────────────────────────────────
export async function checkAiRateLimit(vendorId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const sub = await db.vendorSubscription.findFirst({
    where: { vendorId, status: "active" },
    orderBy: { createdAt: "desc" },
    select: { planTier: true },
  }).catch(() => null);
  const tier = sub?.planTier || "free";
  const limit = AI_LIMITS[tier] ?? AI_LIMITS.free;

  const { allowed, remaining } = await adapter.check(vendorId, limit);
  return { allowed, remaining, limit };
}

export async function incrementAiCount(vendorId: string): Promise<void> {
  await adapter.increment(vendorId);
}
