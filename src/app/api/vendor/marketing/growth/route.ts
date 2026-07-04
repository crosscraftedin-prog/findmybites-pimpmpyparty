/**
 * GET /api/vendor/marketing/growth
 * Returns the vendor's growth score (computes fresh if none exists).
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { computeGrowthScore, getLatestGrowthScore } from "@/lib/marketing/growth-service";

export async function GET(_req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    let score = await getLatestGrowthScore(vendor.id);
    if (!score) score = await computeGrowthScore(vendor.id);
    return NextResponse.json(score);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** POST to force recompute. */
export async function POST(_req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const score = await computeGrowthScore(vendor.id);
    return NextResponse.json(score);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
