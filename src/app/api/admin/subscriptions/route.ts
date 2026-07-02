import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getAdminSubscriptionReport,
  extendSubscription,
  cancelSubscription,
} from "@/lib/subscription/subscription-service";

/**
 * GET /api/admin/subscriptions
 * Returns the admin subscription report (Step 8).
 *
 * POST /api/admin/subscriptions
 * Body: { action: "extend" | "cancel", subscriptionId, days? }
 * Admin actions: manual extension or cancellation.
 */
export async function GET() {
  try {
    const report = await getAdminSubscriptionReport();

    // Also fetch the detailed list of expiring + expired subscriptions for the admin table
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [expiringSubs, expiredSubs] = await Promise.all([
      db.vendorSubscription.findMany({
        where: {
          status: "active",
          planExpiresAt: { gte: now, lte: sevenDaysFromNow },
        },
        include: { vendor: { select: { name: true, slug: true, city: true, userEmail: true } } },
        orderBy: { planExpiresAt: "asc" },
        take: 50,
      }),
      db.vendorSubscription.findMany({
        where: { status: "expired" },
        include: { vendor: { select: { name: true, slug: true, city: true, userEmail: true } } },
        orderBy: { planExpiresAt: "desc" },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      report,
      expiring: expiringSubs.map(s => ({
        subscriptionId: s.id,
        vendorId: s.vendorId,
        vendorName: s.vendor.name,
        vendorSlug: s.vendor.slug,
        vendorEmail: s.vendor.userEmail,
        vendorCity: s.vendor.city,
        planName: s.planName,
        planTier: s.planTier,
        billingCycle: s.billingCycle,
        planExpiresAt: s.planExpiresAt,
        daysRemaining: Math.ceil((s.planExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      })),
      expired: expiredSubs.map(s => ({
        subscriptionId: s.id,
        vendorId: s.vendorId,
        vendorName: s.vendor.name,
        vendorSlug: s.vendor.slug,
        vendorEmail: s.vendor.userEmail,
        planName: s.planName,
        planExpiresAt: s.planExpiresAt,
      })),
    });
  } catch (error: any) {
    console.error("[admin/subscriptions] GET failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, subscriptionId, days } = body as {
      action: "extend" | "cancel";
      subscriptionId: string;
      days?: number;
    };

    if (!action || !subscriptionId) {
      return NextResponse.json({ error: "action and subscriptionId required" }, { status: 400 });
    }

    if (action === "extend") {
      if (!days || days <= 0) {
        return NextResponse.json({ error: "days must be a positive number" }, { status: 400 });
      }
      const updated = await extendSubscription(subscriptionId, days);
      if (!updated) {
        return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: `Subscription extended by ${days} days`,
        subscription: updated,
      });
    }

    if (action === "cancel") {
      await cancelSubscription(subscriptionId);
      return NextResponse.json({ success: true, message: "Subscription cancelled" });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[admin/subscriptions] POST failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
