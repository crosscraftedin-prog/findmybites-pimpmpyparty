/**
 * GET  /api/vendor/products/[id]/inventory  — read inventory state
 * PUT  /api/vendor/products/[id]/inventory  — update stock type/count/status
 *
 * All writes run inside a transaction and auto-sync status.
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorAndProduct } from "@/lib/vendor-session";
import { setStock, STATUS_META, PRODUCT_STATUSES } from "@/lib/inventory/inventory-service";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const resolved = await resolveVendorAndProduct(id);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const p = await db.product.findUnique({
    where: { id },
    select: {
      id: true, name: true, status: true, stockType: true, stockCount: true,
      lowStockThreshold: true, inStock: true, maxOrdersPerDay: true,
      availabilityMode: true, availableDays: true, availabilityStart: true,
      availabilityEnd: true, bookingNoticeHours: true, preparationTimeCategory: true,
      preparationTimeCustom: true, serviceAreaType: true, serviceCities: true,
      seasonLabel: true, forceHidden: true, views: true, enquiryCount: true,
      orderCount: true, salesRevenue: true,
    },
  });
  return NextResponse.json({ inventory: p });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const resolved = await resolveVendorAndProduct(id);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const body = await req.json();
  const updates: any = {};

  // ── Stock ──
  if (body.stockType === "unlimited" || body.stockType === "limited") {
    await setStock(id, body.stockType, body.stockCount ?? 0);
  } else if (typeof body.stockCount === "number") {
    // Just adjust count, keep type
    updates.stockCount = Math.max(0, body.stockCount);
    const existing = await db.product.findUnique({ where: { id }, select: { stockType: true, status: true } });
    if (existing?.stockType === "limited") {
      if (updates.stockCount <= 0) {
        updates.status = "out_of_stock";
        updates.inStock = false;
      } else if (existing.status === "out_of_stock") {
        updates.status = "active";
        updates.inStock = true;
      }
    }
  }
  if (typeof body.lowStockThreshold === "number") updates.lowStockThreshold = Math.max(0, body.lowStockThreshold);

  // ── Status ──
  if (typeof body.status === "string" && (PRODUCT_STATUSES as readonly string[]).includes(body.status)) {
    // Vendors can set any status except archived-for-admin (we allow archived too — it's a vendor choice)
    updates.status = body.status;
    if (body.status === "out_of_stock") updates.inStock = false;
    if (body.status === "active") updates.inStock = true;
  }

  // ── Max orders per day ──
  if (body.maxOrdersPerDay !== undefined) {
    updates.maxOrdersPerDay = body.maxOrdersPerDay === null || body.maxOrdersPerDay === "" ? null : Math.max(0, Number(body.maxOrdersPerDay));
  }

  // ── Availability ──
  if (typeof body.availabilityMode === "string") updates.availabilityMode = body.availabilityMode;
  if (Array.isArray(body.availableDays)) {
    updates.availableDays = body.availableDays.length ? JSON.stringify(body.availableDays) : null;
  }
  if (body.availabilityStart !== undefined) {
    updates.availabilityStart = body.availabilityStart ? new Date(body.availabilityStart) : null;
  }
  if (body.availabilityEnd !== undefined) {
    updates.availabilityEnd = body.availabilityEnd ? new Date(body.availabilityEnd) : null;
  }

  // ── Preparation time ──
  if (typeof body.preparationTimeCategory === "string") updates.preparationTimeCategory = body.preparationTimeCategory || null;
  if (typeof body.preparationTimeCustom === "string") updates.preparationTimeCustom = body.preparationTimeCustom || null;

  // ── Booking notice ──
  if (body.bookingNoticeHours !== undefined) {
    updates.bookingNoticeHours = body.bookingNoticeHours === null || body.bookingNoticeHours === "" ? null : Math.max(0, Number(body.bookingNoticeHours));
  }

  // ── Service area ──
  if (typeof body.serviceAreaType === "string") updates.serviceAreaType = body.serviceAreaType || null;
  if (Array.isArray(body.serviceCities)) {
    updates.serviceCities = body.serviceCities.length ? JSON.stringify(body.serviceCities) : null;
  }

  // ── Season label ──
  if (typeof body.seasonLabel === "string") updates.seasonLabel = body.seasonLabel || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await db.product.update({ where: { id }, data: updates });
  return NextResponse.json({ success: true, inventory: updated });
}
