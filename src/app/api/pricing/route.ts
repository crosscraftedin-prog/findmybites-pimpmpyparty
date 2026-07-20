import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * GET /api/pricing — fetch all active pricing (public, used by SubscriptionModal)
 * POST /api/pricing — admin create new pricing
 */

export async function GET() {
  try {
    const pricing = await db.pricing.findMany({
      where: { active: true },
      orderBy: { countryCode: "asc" },
    });
    const res = NextResponse.json(pricing);
    // Pricing changes rarely — cache for 10 minutes at CDN
    res.headers.set("Cache-Control", "public, s-maxage=600, stale-while-revalidate=3600");
    return res;
  } catch {
    // DB unavailable — return empty array (modal falls back to hardcoded)
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const data = await req.json();
    const { countryCode, countryLabel, symbol, proMonthly, proYearlyTotal, businessMonthly, businessYearlyTotal, note } = data;

    if (!countryCode || !countryLabel || !symbol) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pricing = await db.pricing.create({
      data: {
        countryCode: countryCode.toUpperCase(),
        countryLabel,
        symbol,
        proMonthly: Number(proMonthly) || 0,
        proYearlyTotal: Number(proYearlyTotal) || 0,
        businessMonthly: Number(businessMonthly) || 0,
        businessYearlyTotal: Number(businessYearlyTotal) || 0,
        note: note || "",
        active: true,
      },
    });

    return NextResponse.json(pricing);
  } catch (error: any) {
    console.error("[api/pricing] POST failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
