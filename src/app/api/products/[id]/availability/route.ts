/**
 * Public availability check for a product.
 * GET /api/products/[id]/availability?date=ISO&qty=1
 *
 * Returns availability verdict + next available date. No auth required.
 */
import { NextRequest, NextResponse } from "next/server";
import { checkAvailability, findNextAvailableDate } from "@/lib/inventory/inventory-service";
import { trackEvent } from "@/lib/inventory/inventory-service";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const dateStr = req.nextUrl.searchParams.get("date");
  const qty = Math.max(1, Number(req.nextUrl.searchParams.get("qty")) || 1);
  const track = req.nextUrl.searchParams.get("track") === "1";

  const date = dateStr ? new Date(dateStr) : new Date();

  // Public visibility: hide drafts, archived, force-hidden entirely.
  const product = await db.product.findUnique({
    where: { id },
    select: { status: true, forceHidden: true, name: true },
  });
  if (!product || product.forceHidden || product.status === "draft" || product.status === "archived") {
    return NextResponse.json({ available: false, reason: "force_hidden", message: "This listing is currently unavailable." });
  }

  const result = await checkAvailability(id, date, qty);

  let nextAvailableDate: string | null = null;
  if (!result.available) {
    nextAvailableDate = await findNextAvailableDate(id, new Date(), 60);
  }

  // Fire-and-forget view tracking when explicitly requested (avoids double-counting).
  if (track) {
    trackEvent(id, "views").catch(() => {});
  }

  return NextResponse.json({
    ...result,
    productName: product.name,
    nextAvailableDate,
  });
}
