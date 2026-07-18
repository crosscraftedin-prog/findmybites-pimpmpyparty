import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  createSubscription,
  isAutoPayAvailable,
  getPricing,
  type PlanName,
  type BillingCycle,
} from "@/lib/billing";

/**
 * POST /api/payments/create-subscription
 *
 * Creates a Razorpay Subscription (auto-renewal) for the vendor.
 * Uses DB-driven pricing from the PricingPlan table.
 *
 * Security:
 *   - vendorId is resolved ONLY from the authenticated Supabase session
 *   - The plan amount is determined server-side from the DB
 *
 * Body: { planName: "vendor-pro" | "business", billingCycle: "monthly" | "yearly" }
 *
 * Response: { subscriptionId, razorpaySubscriptionId, shortUrl, amount, currency, keyId, planName }
 * Or: { fallbackToOrders: true } if AutoPay not configured for the vendor's country
 */
export async function POST(req: NextRequest) {
  try {
    // ── 0. Authenticate ──
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
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // ── 1. Resolve vendor from session ──
    const vendor = await db.vendor.findFirst({
      where: { OR: [{ owner_user_id: userId }, ...(userEmail ? [{ userEmail }] : [])] },
      select: { id: true, name: true, slug: true, countryCode: true, whatsapp: true },
    }).catch(() => null);

    if (!vendor) {
      return NextResponse.json({ error: "No vendor listing found for this account" }, { status: 404 });
    }

    // ── 2. Parse request body ──
    const body = await req.json();
    const { planName, billingCycle = "monthly" } = body as {
      planName: string;
      billingCycle?: string;
    };

    if (planName !== "vendor-pro" && planName !== "business") {
      return NextResponse.json(
        { error: `Invalid plan: '${planName}'. Choose 'vendor-pro' or 'business'.` },
        { status: 400 }
      );
    }

    const cycle: BillingCycle = billingCycle === "yearly" ? "yearly" : "monthly";
    const countryCode = vendor.countryCode || "US";

    // ── 3. Check if AutoPay is available for this country ──
    if (!await isAutoPayAvailable(countryCode, planName as PlanName, cycle)) {
      // AutoPay not configured — tell the frontend to use the Orders flow
      return NextResponse.json({
        fallbackToOrders: true,
      }, { status: 200 });
    }

    // ── 4. Create the Razorpay Subscription ──
    logger.info("create-subscription", "Creating Razorpay subscription", {
      vendorId: vendor.id,
      planName,
      billingCycle: cycle,
      countryCode,
    });

    const result = await createSubscription({
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorEmail: userEmail || "",
      vendorPhone: vendor.whatsapp || undefined,
      countryCode,
      planName: planName as PlanName,
      billingCycle: cycle,
    });

    if ("error" in result) {
      if (result.fallbackToOrders) {
        return NextResponse.json({ fallbackToOrders: true }, { status: 200 });
      }
      logger.error("create-subscription", "Subscription creation failed", { error: result.error });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // At this point, result is CreateSubscriptionResult
    const subResult = result;

    // ── 5. Get display price for the response ──
    const plan = planName === "business" ? "business" : "pro";
    const pricing = await getPricing(countryCode, plan, cycle);

    logger.info("create-subscription", "Subscription created", {
      vendorId: vendor.id,
      subscriptionId: subResult.razorpaySubscriptionId,
    });

    return NextResponse.json({
      subscriptionId: subResult.razorpaySubscriptionId,
      razorpaySubscriptionId: subResult.razorpaySubscriptionId,
      shortUrl: subResult.shortUrl,
      planId: subResult.planId,
      status: subResult.status,
      amount: subResult.amount,
      currency: subResult.currency,
      displayAmount: pricing.displayPrice,
      displaySymbol: pricing.currencySymbol,
      displayCurrency: pricing.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      planName,
      billingCycle: cycle,
      vendorName: vendor.name,
    });
  } catch (error: any) {
    logger.error("create-subscription", "Unexpected error", { message: error.message });
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
