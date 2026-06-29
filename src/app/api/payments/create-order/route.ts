import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order using plain fetch (no SDK import issues).
 * Body: { planName: "vendor-pro" | "business", vendorId?, userEmail? }
 */
const PLANS: Record<string, { amount: number; name: string }> = {
  "vendor-pro": { amount: 99900, name: "Vendor Pro" },   // ₹999
  "business": { amount: 299900, name: "Business" },      // ₹2999
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planName, vendorId, userEmail } = body as {
      planName: string; vendorId?: string; userEmail?: string;
    };

    if (!planName || !PLANS[planName]) {
      return NextResponse.json({ error: `Invalid plan: '${planName}'. Choose 'vendor-pro' or 'business'.` }, { status: 400 });
    }

    const amount = PLANS[planName].amount;
    if (amount < 100) return NextResponse.json({ error: "Amount too small" }, { status: 400 });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 });

    // Get vendor info from auth (optional — falls back to body params)
    let vendorName = "Vendor";
    let actualVendorId = vendorId || "unknown";
    let actualEmail = userEmail || "";
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        actualEmail = actualEmail || user.email || "";
        const vendor = await db.vendor.findFirst({
          where: { OR: [{ owner_user_id: user.id }, { userEmail: user.email ?? "" }] },
          select: { id: true, name: true, slug: true },
        }).catch(() => null);
        if (vendor) { vendorName = vendor.name; actualVendorId = vendor.id; }
      }
    } catch (e) { /* auth failed — proceed with body params */ }

    if (!actualVendorId || actualVendorId === "unknown") {
      return NextResponse.json({ error: "Vendor ID required. Sign in or provide vendorId." }, { status: 400 });
    }

    console.log("[create-order] Creating order:", { planName, amount, vendorId: actualVendorId });

    const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": authHeader },
      body: JSON.stringify({
        amount, currency: "INR",
        receipt: `vendor-${actualVendorId}-${Date.now()}`,
        notes: { vendorId: actualVendorId, planName, userEmail: actualEmail, platform: "FindMyBites" },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("[create-order] Razorpay API error:", response.status, error);
      return NextResponse.json({ error: error?.error?.description || `Razorpay error: ${response.status}` }, { status: response.status });
    }

    const order = await response.json();
    console.log("[create-order] Order created:", order.id);

    return NextResponse.json({
      orderId: order.id, amount: order.amount, currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId,
      planName, vendorName,
    });
  } catch (error: any) {
    console.error("[create-order] Error:", error.message);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}
