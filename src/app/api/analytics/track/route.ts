import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/analytics/track
 *
 * Tracks a customer interaction with a vendor storefront.
 * Public endpoint (no auth required — customers are anonymous).
 *
 * Body: {
 *   vendorId: string,
 *   eventType: "page_view" | "product_view" | "service_view" |
 *              "contact_click" | "whatsapp_click" | "phone_click" |
 *              "website_click" | "share_click",
 *   productId?: string,
 *   referrer?: string
 * }
 *
 * A visitor hash (IP + user agent) is computed for unique visitor counting.
 * No PII is stored.
 */
const VALID_EVENTS = new Set([
  "page_view",
  "product_view",
  "service_view",
  "contact_click",
  "whatsapp_click",
  "phone_click",
  "website_click",
  "share_click",
]);

// Simple hash for deduplication (not for security)
function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return String(h);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vendorId, eventType, productId, referrer } = body as {
      vendorId?: string;
      eventType?: string;
      productId?: string;
      referrer?: string;
    };

    if (!vendorId || !eventType || !VALID_EVENTS.has(eventType)) {
      return NextResponse.json(
        { error: "vendorId and valid eventType required" },
        { status: 400 }
      );
    }

    // Compute visitor hash from IP + user agent for unique counting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    const visitorHash = simpleHash(`${ip}:${ua}`);

    await db.vendorAnalytics.create({
      data: {
        vendorId,
        eventType,
        productId: productId || null,
        visitorHash,
        referrer: referrer || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    // Analytics failures should never break the customer experience
    console.error("[api/analytics/track] failed:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

/**
 * GET /api/analytics/vendor?vendorId=xxx&days=30
 *
 * Returns analytics summary for a vendor (for the vendor dashboard).
 * Requires auth + ownership (vendor must belong to the authenticated user).
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const vendorId = sp.get("vendorId");
    const daysRaw = Number(sp.get("days"));
    const days = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.min(365, daysRaw) : 30;

    if (!vendorId) {
      return NextResponse.json({ error: "vendorId required" }, { status: 400 });
    }

    // Auth: must be the vendor owner
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    let userId: string | null = user?.id ?? null;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
    }
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const vendor = await db.vendor.findFirst({
      where: { id: vendorId, owner_user_id: userId },
      select: { id: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await db.vendorAnalytics.findMany({
      where: { vendorId, createdAt: { gte: since } },
      select: { eventType: true, visitorHash: true, createdAt: true, productId: true },
    });

    // Aggregate
    const byType: Record<string, number> = {};
    const uniqueVisitors = new Set<string>();
    const productViews: Record<string, number> = {};
    const dailyViews: Record<string, number> = {};

    for (const e of events) {
      byType[e.eventType] = (byType[e.eventType] || 0) + 1;
      if (e.eventType === "page_view") {
        uniqueVisitors.add(e.visitorHash || "anon");
        const day = e.createdAt.toISOString().slice(0, 10);
        dailyViews[day] = (dailyViews[day] || 0) + 1;
      }
      if ((e.eventType === "product_view" || e.eventType === "service_view") && e.productId) {
        productViews[e.productId] = (productViews[e.productId] || 0) + 1;
      }
    }

    return NextResponse.json({
      totalEvents: events.length,
      uniqueVisitors: uniqueVisitors.size,
      byType,
      productViews,
      dailyViews,
      days,
    });
  } catch (err) {
    console.error("[api/analytics/vendor] GET failed:", err);
    return NextResponse.json({
      totalEvents: 0,
      uniqueVisitors: 0,
      byType: {},
      productViews: {},
      dailyViews: {},
      days: 30,
    });
  }
}
