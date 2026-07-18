/**
 * Billing Module — Feature Enforcement Middleware
 *
 * Higher-order functions for protecting API routes with feature access checks.
 *
 * Usage:
 *   export const POST = requireFeature("aiTools")(async (req) => { ... })
 *   export const POST = requirePlan("pro")(async (req) => { ... })
 *
 * Every protected API should use this middleware.
 * Never trust the frontend for feature access.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { getVendorPlan } from "./permissions";
import { canAccess } from "./features";
import type { PlanTier, FeatureLimit } from "./types";

/**
 * Resolve the vendor ID from the authenticated session.
 * Throws if not authenticated.
 */
async function resolveVendorId(): Promise<string | null> {
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

  if (!userId) return null;

  const vendor = await db.vendor.findFirst({
    where: { OR: [{ owner_user_id: userId }, ...(userEmail ? [{ userEmail }] : [])] },
    select: { id: true },
  }).catch(() => null);

  return vendor?.id || null;
}

/**
 * Require a specific feature to be accessible.
 * Returns 403 if the vendor's plan doesn't include the feature.
 *
 * Usage:
 *   export const POST = requireFeature("aiTools")(async (req) => { ... })
 */
export function requireFeature(feature: keyof FeatureLimit) {
  return function <T extends (req: NextRequest) => Promise<NextResponse>>(
    handler: T
  ): T {
    return (async (req: NextRequest) => {
      const vendorId = await resolveVendorId();
      if (!vendorId) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const plan = await getVendorPlan(vendorId);
      if (!canAccess(plan.tier, feature)) {
        return NextResponse.json(
          { error: `This feature requires a higher plan. Your current plan (${plan.tier}) does not include ${feature}.` },
          { status: 403 }
        );
      }

      return handler(req);
    }) as T;
  };
}

/**
 * Require a minimum plan tier.
 * Returns 403 if the vendor's plan is below the required tier.
 *
 * Usage:
 *   export const POST = requirePlan("pro")(async (req) => { ... })
 */
export function requirePlan(minTier: PlanTier) {
  const tierOrder: Record<PlanTier, number> = { free: 0, pro: 1, business: 2 };

  return function <T extends (req: NextRequest) => Promise<NextResponse>>(
    handler: T
  ): T {
    return (async (req: NextRequest) => {
      const vendorId = await resolveVendorId();
      if (!vendorId) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const plan = await getVendorPlan(vendorId);
      if (tierOrder[plan.tier] < tierOrder[minTier]) {
        return NextResponse.json(
          { error: `This action requires the ${minTier} plan or higher. Your current plan: ${plan.tier}.` },
          { status: 403 }
        );
      }

      return handler(req);
    }) as T;
  };
}

/**
 * Require analytics access.
 */
export function requireAnalytics() {
  return requireFeature("analytics");
}

/**
 * Require marketing tools access.
 */
export function requireMarketing() {
  return requireFeature("marketingTools");
}

/**
 * Require video upload access.
 */
export function requireVideoUpload() {
  return requireFeature("videoUpload");
}

/**
 * Require verified vendor badge.
 */
export function requireVerifiedVendor() {
  return requireFeature("verifiedBadge");
}

/**
 * Check if the vendor can perform an action, without blocking.
 * Returns the plan info for use in the handler.
 *
 * Usage:
 *   const { allowed, tier } = await checkAccess(req, "aiTools");
 *   if (!allowed) return NextResponse.json({ error: "..." }, { status: 403 });
 */
export async function checkAccess(
  _req: NextRequest,
  feature: keyof FeatureLimit
): Promise<{ allowed: boolean; vendorId: string | null; tier: PlanTier }> {
  const vendorId = await resolveVendorId();
  if (!vendorId) return { allowed: false, vendorId: null, tier: "free" };

  const plan = await getVendorPlan(vendorId);
  return {
    allowed: canAccess(plan.tier, feature),
    vendorId,
    tier: plan.tier,
  };
}
