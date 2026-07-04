/** DELETE /api/vendor/marketing/campaigns/[id] — delete campaign (ownership-checked) */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { db } from "@/lib/db";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await db.marketingCampaign.deleteMany({ where: { id, vendorId: vendor.id } });
  return NextResponse.json({ success: true });
}
