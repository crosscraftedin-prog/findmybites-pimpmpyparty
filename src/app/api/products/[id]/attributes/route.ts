import { NextRequest, NextResponse } from "next/server";
import { getProductAttributes, setProductAttributes } from "@/lib/attributes/attribute-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/constants";
import { db } from "@/lib/db";

/**
 * GET /api/products/[id]/attributes — public, returns a product's attributes.
 * Cached 1 hour.
 *
 * POST /api/products/[id]/attributes — auth-required (vendor owner or admin).
 *   Body: { attributeIds: string[] }
 *   Replaces the product's full attribute set.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Verify product exists (id may be the DB id or slug)
    const product = await db.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const attributes = await getProductAttributes(product.id);
    const res = NextResponse.json({ attributes });
    res.headers.set("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res;
  } catch (error: any) {
    console.error("[api/products/[id]/attributes] GET failed:", error);
    return NextResponse.json({ error: "Failed to fetch product attributes" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // ── Auth ──
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const product = await db.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, vendorId: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Authorization: product's vendor owner or admin
    const vendor = await db.vendor.findUnique({
      where: { id: product.vendorId },
      select: { owner_user_id: true },
    });
    const isAdmin = isAdminEmail(user.email);
    if (!vendor || (vendor.owner_user_id !== user.id && !isAdmin)) {
      return NextResponse.json({ error: "Not authorized to edit this product" }, { status: 403 });
    }

    const body = await req.json().catch(() => null) as { attributeIds?: string[] } | null;
    if (!body || !Array.isArray(body.attributeIds)) {
      return NextResponse.json({ error: "attributeIds array required" }, { status: 400 });
    }

    await setProductAttributes(product.id, body.attributeIds);
    const attributes = await getProductAttributes(product.id);
    return NextResponse.json({ attributes });
  } catch (error: any) {
    console.error("[api/products/[id]/attributes] POST failed:", error);
    return NextResponse.json({ error: "Failed to save product attributes" }, { status: 500 });
  }
}
