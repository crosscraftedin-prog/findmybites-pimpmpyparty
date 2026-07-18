import { NextResponse } from "next/server";
import { getBillingAnalytics } from "@/lib/billing";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * GET /api/admin/billing/analytics
 * Returns billing analytics for the admin dashboard.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const analytics = await getBillingAnalytics();
  return NextResponse.json(analytics);
}
