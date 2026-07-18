/**
 * Billing Module — AI Feature Guard
 *
 * Centralized server-side enforcement for all AI API routes.
 * Checks: authentication → vendor resolution → subscription tier → AI feature access → rate limit.
 *
 * Usage in an AI route:
 *   const guard = await guardAiRoute(req);
 *   if (guard.error) return guard.error;
 *   const { vendorId, tier, remaining } = guard;
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { getActiveSubscription } from "@/lib/subscription/subscription-service";
import { checkAiRateLimit, incrementAiCount } from "@/lib/ai/rate-limiter";
import { canAccess, getLimit } from "./features";
import type { PlanTier } from "./types";

export interface AiGuardResult {
  vendorId: string | null;
  tier: PlanTier;
  allowed: boolean;
  remaining: number;
  limit: number;
  error: NextResponse | null;
}

/**
 * Guard an AI API route.
 * Returns { allowed: true, vendorId, tier, remaining } on success,
 * or { allowed: false, error: NextResponse } on failure.
 *
 * Automatically increments the AI usage count on success.
 */
export async function guardAiRoute(_req: NextRequest): Promise<AiGuardResult> {
  // ── 1. Authenticate ──
  const supabase = await createSupabaseServerClient();
  let userId: string | null = null;
  let userEmail: string | null = null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) { userId = user.id; userEmail = user.email ?? null; }
  } catch {}

  if (!userId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) { userId = session.user.id; userEmail = session.user.email ?? null; }
    } catch {}
  }

  if (!userId) {
    return {
      vendorId: null, tier: "free", allowed: false, remaining: 0, limit: 0,
      error: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }

  // ── 2. Resolve vendor ──
  const vendor = await db.vendor.findFirst({
    where: { OR: [{ owner_user_id: userId }, ...(userEmail ? [{ userEmail }] : [])] },
    select: { id: true },
  }).catch(() => null);

  if (!vendor) {
    return {
      vendorId: null, tier: "free", allowed: false, remaining: 0, limit: 0,
      error: NextResponse.json({ error: "No vendor listing found" }, { status: 404 }),
    };
  }

  // ── 3. Check subscription tier ──
  const sub = await getActiveSubscription(vendor.id);
  const tier: PlanTier = (sub && !sub.isExpired && sub.status === "active")
    ? (sub.planTier as PlanTier)
    : "free";

  // ── 4. Check AI feature access ──
  if (!canAccess(tier, "aiTools")) {
    return {
      vendorId: vendor.id, tier, allowed: false, remaining: 0, limit: 0,
      error: NextResponse.json({
        error: "AI tools require a Pro or Business plan. Upgrade to access AI-powered features.",
        upgradeRequired: true,
        currentTier: tier,
      }, { status: 403 }),
    };
  }

  // ── 5. Check rate limit ──
  const limit = getLimit(tier, "maxAiRequestsPerDay");
  const rateCheck = await checkAiRateLimit(vendor.id);

  if (!rateCheck.allowed) {
    return {
      vendorId: vendor.id, tier, allowed: false, remaining: 0, limit,
      error: NextResponse.json({
        error: `Daily AI request limit reached (${limit} requests/day on the ${tier} plan). Try again tomorrow or upgrade for more requests.`,
        limitReached: true,
        limit,
        remaining: 0,
      }, { status: 429 }),
    };
  }

  // ── 6. Increment usage ──
  await incrementAiCount(vendor.id);

  return {
    vendorId: vendor.id,
    tier,
    allowed: true,
    remaining: rateCheck.remaining - 1, // subtract the one we just used
    limit,
    error: null,
  };
}

/**
 * Guard a premium (non-AI) API route.
 * Checks: authentication → vendor resolution → subscription tier → feature access.
 *
 * Usage:
 *   const guard = await guardPremiumRoute(req, "analytics");
 *   if (guard.error) return guard.error;
 */
export async function guardPremiumRoute(
  _req: NextRequest,
  feature: "analytics" | "marketingTools" | "videoUpload" | "prioritySearch" | "verifiedBadge" | "homepagePromotion" | "leads"
): Promise<{
  vendorId: string | null;
  tier: PlanTier;
  allowed: boolean;
  error: NextResponse | null;
}> {
  // ── 1. Authenticate ──
  const supabase = await createSupabaseServerClient();
  let userId: string | null = null;
  let userEmail: string | null = null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) { userId = user.id; userEmail = user.email ?? null; }
  } catch {}

  if (!userId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) { userId = session.user.id; userEmail = session.user.email ?? null; }
    } catch {}
  }

  if (!userId) {
    return {
      vendorId: null, tier: "free", allowed: false,
      error: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }

  // ── 2. Resolve vendor ──
  const vendor = await db.vendor.findFirst({
    where: { OR: [{ owner_user_id: userId }, ...(userEmail ? [{ userEmail }] : [])] },
    select: { id: true },
  }).catch(() => null);

  if (!vendor) {
    return {
      vendorId: null, tier: "free", allowed: false,
      error: NextResponse.json({ error: "No vendor listing found" }, { status: 404 }),
    };
  }

  // ── 3. Check subscription tier ──
  const sub = await getActiveSubscription(vendor.id);
  const tier: PlanTier = (sub && !sub.isExpired && sub.status === "active")
    ? (sub.planTier as PlanTier)
    : "free";

  // ── 4. Check feature access ──
  if (!canAccess(tier, feature)) {
    return {
      vendorId: vendor.id, tier, allowed: false,
      error: NextResponse.json({
        error: `This feature requires a higher plan. Your current plan (${tier}) does not include ${feature}.`,
        upgradeRequired: true,
        currentTier: tier,
        requiredFeature: feature,
      }, { status: 403 }),
    };
  }

  return { vendorId: vendor.id, tier, allowed: true, error: null };
}
