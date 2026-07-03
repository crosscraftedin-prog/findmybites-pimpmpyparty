import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  searchProducts, getProductStats, createProduct,
} from "@/lib/products/product-service";

/**
 * GET /api/vendor/products?search=...&category=...&status=...&sortBy=...&limit=...&offset=...
 * POST /api/vendor/products
 * All operations require vendor authentication.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: session.user.id },
      select: { id: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }

    const sp = req.nextUrl.searchParams;
    const [products, stats] = await Promise.all([
      searchProducts({
        vendorId: vendor.id,
        search: sp.get("search") || undefined,
        category: sp.get("category") || undefined,
        status: (sp.get("status") as any) || undefined,
        sortBy: (sp.get("sortBy") as any) || undefined,
        limit: sp.get("limit") ? parseInt(sp.get("limit")!) : 50,
        offset: sp.get("offset") ? parseInt(sp.get("offset")!) : 0,
      }),
      getProductStats(vendor.id),
    ]);

    return NextResponse.json({ ...products, stats });
  } catch (error: any) {
    console.error("[vendor/products] GET failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: session.user.id },
      select: { id: true, currency: true, ecosystem: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });
    }

    const body = await req.json();
    // Auto-set currency from vendor's country
    if (!body.currency) body.currency = vendor.currency || "INR";
    if (!body.ecosystem) body.ecosystem = vendor.ecosystem;

    const product = await createProduct(vendor.id, body);
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    console.error("[vendor/products] POST failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
