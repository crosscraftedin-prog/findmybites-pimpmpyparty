import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/vendor/products
 * Create a product for the authenticated vendor's business.
 * Uses Prisma (server-side, bypasses RLS) with ownership validation.
 *
 * Body: { name, price, description?, productType?, vendorId }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { name, price, description, productType, vendorId } = body;

    if (!name?.trim() || !vendorId) {
      return NextResponse.json({ error: "name and vendorId are required" }, { status: 400 });
    }

    // Verify ownership — vendor must own this business
    const vendor = await db.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, owner_user_id: true, userEmail: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Check if the current user owns this vendor (by owner_user_id OR userEmail)
    const isOwner =
      vendor.owner_user_id === session.user.id ||
      (vendor.userEmail && vendor.userEmail === session.user.email);

    if (!isOwner) {
      return NextResponse.json({ error: "Not authorized to add products to this vendor" }, { status: 403 });
    }

    // Create the product
    const product = await db.product.create({
      data: {
        vendorId,
        name: name.trim(),
        price: Number(price) || 0,
        description: description?.trim() || undefined,
        productType: productType || undefined,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error("[api/vendor/products] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to create product: " + (err instanceof Error ? err.message : "Unknown") },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vendor/products?vendorId=xxx
 * List products for a vendor (public read — only approved vendors).
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const vendorId = sp.get("vendorId");

    if (!vendorId) {
      return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
    }

    const products = await db.product.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ products: [] });
  }
}

/**
 * DELETE /api/vendor/products?id=xxx
 * Delete a product (owner-only).
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sp = req.nextUrl.searchParams;
    const productId = sp.get("id");

    if (!productId) {
      return NextResponse.json({ error: "Product id is required" }, { status: 400 });
    }

    // Find the product and verify ownership
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { vendor: { select: { owner_user_id: true, userEmail: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const isOwner =
      product.vendor.owner_user_id === session.user.id ||
      (product.vendor.userEmail && product.vendor.userEmail === session.user.email);

    if (!isOwner) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await db.product.delete({ where: { id: productId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/vendor/products] DELETE failed:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
