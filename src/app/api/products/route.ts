import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product as ApiProduct } from "@/lib/types";

function transformProduct(p: typeof db.product): ApiProduct {
  return {
    id: p.id,
    vendorId: p.vendorId,
    name: p.name,
    description: p.description,
    price: p.price,
    image: p.image,
    createdAt: p.createdAt.toISOString(),
  };
}

/**
 * GET /api/products?vendorId=
 * Returns all products for a vendor (public — shown on the vendor modal).
 */
export async function GET(req: NextRequest) {
  try {
    const vendorId = req.nextUrl.searchParams.get("vendorId");
    if (!vendorId) {
      return NextResponse.json(
        { error: "vendorId is required" },
        { status: 400 }
      );
    }
    const products = await db.product.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ products: products.map(transformProduct) });
  } catch (err) {
    console.error("[api/products] GET failed:", err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

/**
 * POST /api/products
 * Create a new product. Only the vendor who owns the listing can add products.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const body = await req.json();
    const { vendorId, name, description, price, image } = body;

    if (!vendorId || !name || typeof name !== "string") {
      return NextResponse.json({ error: "vendorId and name are required" }, { status: 400 });
    }

    // verify the vendor belongs to the signed-in user
    const vendor = await db.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    if (vendor.userEmail !== session.user.email) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const priceNum = Number(price);
    const created = await db.product.create({
      data: {
        vendorId,
        name: String(name).trim().slice(0, 100),
        description: typeof description === "string" ? description.trim().slice(0, 500) : null,
        price: Number.isFinite(priceNum) && priceNum >= 0 ? Math.round(priceNum) : 0,
        image: typeof image === "string" && image.startsWith("/uploads/") ? image : null,
      },
    });

    return NextResponse.json({ product: transformProduct(created) }, { status: 201 });
  } catch (err) {
    console.error("[api/products] POST failed:", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
