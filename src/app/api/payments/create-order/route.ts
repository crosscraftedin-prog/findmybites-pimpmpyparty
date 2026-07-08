import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order using plain fetch (no SDK import issues).
 *
 * Security: vendorId is resolved ONLY from the authenticated Supabase session.
 * The frontend cannot specify vendorId — if no authenticated vendor exists,
 * the route returns 401.
 *
 * Body: { planName: "vendor-pro" | "business", amount?, currency? }
 */
const PLANS: Record<string, { amount: number; name: string }> = {
  "vendor-pro": { amount: 29900, name: "Vendor Pro" },   // ₹299
  "business": { amount: 49900, name: "Business" },       // ₹499
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planName } = body as { planName: string };

    if (!planName || !PLANS[planName]) {
      return NextResponse.json({ error: `Invalid plan: '${planName}'. Choose 'vendor-pro' or 'business'.` }, { status: 400 });
    }

    // SECURITY: Always use the server-defined plan amount — NEVER trust client-supplied amount.
    // Previously: const amount = bodyAmount && bodyAmount >= 100 ? bodyAmount : PLANS[planName].amount;
    // This allowed vendors to pay ₹1 for a ₹499 plan.
    const amount = PLANS[planName].amount;
    if (amount < 100) return NextResponse.json({ error: "Amount too small" }, { status: 400 });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 });

    // ── Resolve vendor from authenticated session ONLY ──
    // Never trust vendorId from the request body.
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

    const vendor = await db.vendor.findFirst({
      where: { OR: [{ owner_user_id: userId }, ...(userEmail ? [{ userEmail }] : [])] },
      select: { id: true, name: true, slug: true },
    }).catch(() => null);
    if (!vendor) {
      return NextResponse.json({ error: "No vendor listing found for this account" }, { status: 404 });
    }

    const vendorName = vendor.name;
    const actualVendorId = vendor.id;
    const actualEmail = userEmail || "";

    logger.info("create-order", "Creating Razorpay order", { planName, amount, vendorId: actualVendorId });

    const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": authHeader },
      body: JSON.stringify({
        amount, currency: "INR",
        receipt: `V${Date.now().toString().slice(-8)}`,
        notes: { vendorId: actualVendorId, planName, userEmail: actualEmail, platform: "FindMyBites" },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      logger.error("create-order", "Razorpay order creation failed", { status: response.status, error });
      return NextResponse.json({ error: error?.error?.description || `Razorpay error: ${response.status}` }, { status: response.status });
    }

    const order = await response.json();
    logger.info("create-order", "Order created successfully", { orderId: order.id });

    return NextResponse.json({
      orderId: order.id, amount: order.amount, currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId,
      planName, vendorName,
    });
  } catch (error: any) {
    logger.error("create-order", "Unexpected error", { message: error.message });
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}
