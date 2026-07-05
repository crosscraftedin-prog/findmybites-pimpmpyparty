/**
 * Product calendar (blocked dates) management.
 * GET    /api/vendor/products/[id]/calendar          — list blocks
 * POST   /api/vendor/products/[id]/calendar          — create a block
 * DELETE /api/vendor/products/[id]/calendar?blockId= — remove a block
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorAndProduct } from "@/lib/vendor-session";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const resolved = await resolveVendorAndProduct(id);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const blocks = await db.productBlockedDate.findMany({
    where: { productId: id },
    orderBy: { startDate: "asc" },
    take: 365,
  });
  return NextResponse.json({ blocks });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const resolved = await resolveVendorAndProduct(id);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const body = await req.json();
  const { startDate, endDate, blockType, note } = body;
  if (!startDate) {
    return NextResponse.json({ error: "startDate is required" }, { status: 400 });
  }
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : start;
  if (end < start) {
    return NextResponse.json({ error: "endDate must be on or after startDate" }, { status: 400 });
  }

  const block = await db.productBlockedDate.create({
    data: {
      productId: id,
      blockType: blockType || "manual",
      startDate: start,
      endDate: end,
      note: note || null,
    },
  });
  return NextResponse.json({ block }, { status: 201 });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const resolved = await resolveVendorAndProduct(id);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const blockId = req.nextUrl.searchParams.get("blockId");
  if (!blockId) {
    return NextResponse.json({ error: "blockId query param required" }, { status: 400 });
  }
  await db.productBlockedDate.deleteMany({ where: { id: blockId, productId: id } });
  return NextResponse.json({ success: true });
}
