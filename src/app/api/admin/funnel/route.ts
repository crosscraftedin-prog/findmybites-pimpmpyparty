import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

/**
 * GET /api/admin/funnel
 * Vendor onboarding funnel: imported → invited → activated → profile → products → subscribed.
 * Returns counts + conversion rates for each stage.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const [
      totalImported,       // invite_type='admin', approved=true
      totalOrganic,        // invite_type='organic'
      activated,           // owner_user_id is not null
      withLogo,            // avatarImage is not empty
      withCover,           // heroImage is not empty
      withDescription,     // description length > 30
      withProducts,        // has at least 1 product
      withFiveProductsRaw, // has at least 5 products (raw query)
      withSubscription,    // active subscription
      withWhatsApp,        // whatsapp is not empty
    ] = await Promise.all([
      db.vendor.count({ where: { invite_type: "admin", approved: true } }),
      db.vendor.count({ where: { invite_type: "organic" } }),
      db.vendor.count({ where: { owner_user_id: { not: null } } }),
      db.vendor.count({ where: { approved: true, avatarImage: { not: "" } } }),
      db.vendor.count({ where: { approved: true, heroImage: { not: "" } } }),
      db.vendor.count({ where: { approved: true, description: { not: "" } } }),
      db.vendor.count({ where: { approved: true, products: { some: {} } } }),
      db.$queryRaw`SELECT COUNT(*)::int as cnt FROM (SELECT vendor_id FROM "Product" WHERE status != 'archived' GROUP BY vendor_id HAVING COUNT(*) >= 5) t`,
      db.vendorSubscription.count({ where: { status: "active" } }),
      db.vendor.count({ where: { approved: true, whatsapp: { not: "" } } }),
    ]);

    const withFiveProducts = Array.isArray(withFiveProductsRaw)
      ? Number((withFiveProductsRaw[0] as any)?.cnt ?? 0)
      : Number(withFiveProductsRaw ?? 0);

    const stages = [
      { name: "Imported", count: totalImported, color: "#3b82f6" },
      { name: "Activated (Google Login)", count: activated, color: "#8b5cf6" },
      { name: "Logo Uploaded", count: withLogo, color: "#ec4899" },
      { name: "Cover Uploaded", count: withCover, color: "#f59e0b" },
      { name: "Description Added", count: withDescription, color: "#10b981" },
      { name: "First Product", count: withProducts, color: "#06b6d4" },
      { name: "5 Products", count: withFiveProducts, color: "#6366f1" },
      { name: "Subscription", count: withSubscription, color: "#f43f5e" },
    ];

    // Calculate conversion rates between stages
    const funnel = stages.map((stage, i) => {
      const prev = i > 0 ? stages[i - 1].count : stage.count;
      const rate = prev > 0 ? Math.round((stage.count / prev) * 100) : 0;
      const overallRate = totalImported > 0 ? Math.round((stage.count / totalImported) * 100) : 0;
      return { ...stage, conversionFromPrev: rate, conversionFromStart: overallRate };
    });

    return NextResponse.json({
      funnel,
      summary: {
        totalImported,
        totalOrganic,
        activated,
        withLogo,
        withCover,
        withDescription,
        withProducts,
        withFiveProducts,
        withSubscription,
        withWhatsApp,
        overallConversion: totalImported > 0 ? Math.round((withSubscription / totalImported) * 100) : 0,
      },
    });
  } catch (error: any) {
    console.error("[admin/funnel] GET failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
