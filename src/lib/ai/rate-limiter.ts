/**
 * AI Rate Limiter — simple daily quota enforcement.
 * ───────────────────────────────────────────────────────────────────────────
 * Limits AI requests per vendor per day based on subscription tier.
 * Uses in-memory counter (resets on serverless cold start — acceptable
 * for soft limits; upgrade to Redis for hard limits at scale).
 *
 * Limits:
 *   free: 5 requests/day
 *   pro: 50 requests/day
 *   business: 200 requests/day
 */
import { db } from "@/lib/db";

const AI_LIMITS: Record<string, number> = {
  free: 5,
  pro: 50,
  business: 200,
};

// In-memory counter: Map<vendorId, { date: 'YYYY-MM-DD', count: number }>
const dailyCounts = new Map<string, { date: string; count: number }>();

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function checkAiRateLimit(vendorId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  // Get vendor's subscription tier
  const sub = await db.vendorSubscription.findFirst({
    where: { vendorId, status: "active" },
    orderBy: { createdAt: "desc" },
    select: { planTier: true },
  }).catch(() => null);
  const tier = sub?.planTier || "free";
  const limit = AI_LIMITS[tier] ?? AI_LIMITS.free;

  // Check daily count
  const today = todayKey();
  const entry = dailyCounts.get(vendorId);
  if (!entry || entry.date !== today) {
    dailyCounts.set(vendorId, { date: today, count: 0 });
    return { allowed: true, remaining: limit, limit };
  }
  const remaining = Math.max(0, limit - entry.count);
  return { allowed: entry.count < limit, remaining, limit };
}

export function incrementAiCount(vendorId: string): void {
  const today = todayKey();
  const entry = dailyCounts.get(vendorId);
  if (!entry || entry.date !== today) {
    dailyCounts.set(vendorId, { date: today, count: 1 });
  } else {
    entry.count++;
  }
}
