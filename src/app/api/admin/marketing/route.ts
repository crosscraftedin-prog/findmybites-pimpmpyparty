/** GET /api/admin/marketing — admin marketing analytics dashboard */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getAdminMarketingStats } from "@/lib/marketing/growth-service";

export async function GET(_req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const stats = await getAdminMarketingStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
