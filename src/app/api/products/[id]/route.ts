import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * DELETE /api/products/[id]
 * Delete a product. Only the vendor who owns it can delete.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const product = await db.product.findUnique({
      where: { id },
      include: { vendor: { select: { userEmail: true } } },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (product.vendor.userEmail !== session.user.email) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await db.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/products/[id]] DELETE failed:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}

/**
 * PATCH /api/products/[id]
 * Update a product (name, description, price, image).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const product = await db.product.findUnique({
      where: { id },
      include: { vendor: { select: { userEmail: true } } },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (product.vendor.userEmail !== session.user.email) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim().slice(0, 100);
    if (typeof body.description === "string")
      data.description = body.description.trim().slice(0, 500);
    if (body.price !== undefined) {
      const n = Number(body.price);
      if (Number.isFinite(n) && n >= 0) data.price = Math.round(n);
    }
    if (typeof body.image === "string") data.image = body.image;
    if (typeof body.videoUrl === "string") data.videoUrl = body.videoUrl.trim() || null;
    if (typeof body.productType === "string") data.productType = body.productType;
    if (typeof body.sizes === "string") data.sizes = body.sizes || null;
    if (typeof body.flavours === "string") data.flavours = body.flavours || null;
    if (typeof body.weight === "string") data.weight = body.weight || null;
    if (typeof body.prepTime === "string") data.prepTime = body.prepTime || null;
    if (typeof body.servings === "string") data.servings = body.servings || null;
    if (typeof body.shape === "string") data.shape = body.shape || null;
    if (typeof body.eggless === "boolean") data.eggless = body.eggless;
    if (typeof body.sameDay === "boolean") data.sameDay = body.sameDay;
    if (typeof body.customOrder === "boolean") data.customOrder = body.customOrder;
    if (typeof body.pickupAvailable === "boolean") data.pickupAvailable = body.pickupAvailable;
    if (typeof body.deliveryAvailable === "boolean") data.deliveryAvailable = body.deliveryAvailable;
    if (typeof body.featured === "boolean") data.featured = body.featured;
    if (typeof body.minGuests === "number") data.minGuests = body.minGuests;
    if (typeof body.pricePerHead === "number") data.pricePerHead = body.pricePerHead;
    if (Array.isArray(body.images)) {
      data.images = JSON.stringify(body.images.filter((u: unknown) => typeof u === "string").slice(0, 8));
    }

    const updated = await db.product.update({ where: { id }, data });
    return NextResponse.json({ product: updated });
  } catch (err) {
    console.error("[api/products/[id]] PATCH failed:", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
