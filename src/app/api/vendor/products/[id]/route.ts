import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  getProduct, updateProduct, deleteProduct, duplicateProduct,
} from "@/lib/products/product-service";

/**
 * GET /api/vendor/products/[id] — get single product
 * PUT /api/vendor/products/[id] — update product
 * DELETE /api/vendor/products/[id] — delete product
 * POST /api/vendor/products/[id] — duplicate product (?action=duplicate)
 */
async function getVendorId(req: NextRequest): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return null;
  const vendor = await db.vendor.findFirst({
    where: { owner_user_id: session.user.id },
    select: { id: true },
  });
  return vendor?.id ?? null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const vendorId = await getVendorId(req);
    if (!vendorId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const product = await getProduct(id, vendorId);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const vendorId = await getVendorId(req);
    if (!vendorId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const product = await updateProduct(id, vendorId, body);
    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const vendorId = await getVendorId(req);
    if (!vendorId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    await deleteProduct(id, vendorId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const vendorId = await getVendorId(req);
    if (!vendorId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const sp = req.nextUrl.searchParams;
    if (sp.get("action") === "duplicate") {
      const product = await duplicateProduct(id, vendorId);
      return NextResponse.json({ success: true, product }, { status: 201 });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
