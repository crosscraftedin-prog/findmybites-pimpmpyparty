import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseJsonArray } from "@/lib/format";
import type { Product as ApiProduct } from "@/lib/types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function transformProduct(p: typeof db.product): ApiProduct {
  return {
    id: p.id,
    vendorId: p.vendorId,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    image: p.image,
    productType: p.productType,
    sizes: p.sizes,
    flavours: p.flavours,
    weight: p.weight,
    prepTime: p.prepTime,
    deliveryAvailable: p.deliveryAvailable,
    minGuests: p.minGuests,
    pricePerHead: p.pricePerHead,
    images: p.images ? parseJsonArray<string>(p.images) : null,
    // enhanced fields
    videoUrl: p.videoUrl,
    pricingTiers: p.pricingTiers ? (JSON.parse(p.pricingTiers) as { label: string; price: number }[]) : null,
    servings: p.servings,
    shape: p.shape,
    eggless: p.eggless,
    sameDay: p.sameDay,
    customOrder: p.customOrder,
    pickupAvailable: p.pickupAvailable,
    featured: p.featured,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    availableCountries: p.availableCountries,
    availableStates: p.availableStates,
    availableCities: p.availableCities,
    inStock: p.inStock,
    stockCount: p.stockCount,
    extraFields: p.extraFields ? (JSON.parse(p.extraFields) as Record<string, string>) : null,
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
 * Create a new product with all the enhanced fields.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const body = await req.json();
    const {
      vendorId, name, description, price, image,
      productType, sizes, flavours, weight, prepTime,
      deliveryAvailable, minGuests, pricePerHead, images,
      // new enhanced fields
      videoUrl, servings, shape, eggless, sameDay, customOrder,
      pickupAvailable, featured, metaTitle, metaDescription,
      availableCountries, availableStates, availableCities,
      inStock, stockCount, extraFields, pricingTiers,
    } = body;

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

    // generate a unique slug
    const baseSlug = slugify(`${name}-${vendor.city}`);
    let slug = baseSlug;
    let suffix = 1;
    while (await db.product.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const priceNum = Number(price);
    const created = await db.product.create({
      data: {
        vendorId,
        name: String(name).trim().slice(0, 100),
        slug,
        description: typeof description === "string" ? description.trim().slice(0, 1000) : null,
        price: Number.isFinite(priceNum) && priceNum >= 0 ? Math.round(priceNum) : 0,
        image: typeof image === "string" ? (image.startsWith("/uploads/") || image.includes("supabase.co/storage") ? image : null) : null,
        productType: typeof productType === "string" ? productType.trim().slice(0, 50) : null,
        sizes: typeof sizes === "string" ? sizes.trim().slice(0, 200) : null,
        flavours: typeof flavours === "string" ? flavours.trim().slice(0, 200) : null,
        weight: typeof weight === "string" ? weight.trim().slice(0, 50) : null,
        prepTime: typeof prepTime === "string" ? prepTime.trim().slice(0, 100) : null,
        deliveryAvailable: typeof deliveryAvailable === "boolean" ? deliveryAvailable : false,
        minGuests: minGuests != null && Number.isFinite(Number(minGuests)) ? Math.round(Number(minGuests)) : null,
        pricePerHead: pricePerHead != null && Number.isFinite(Number(pricePerHead)) ? Math.round(Number(pricePerHead)) : null,
        images: Array.isArray(images) ? JSON.stringify(images.filter((u: unknown) => typeof u === "string").slice(0, 8)) : null,
        // enhanced fields
        videoUrl: typeof videoUrl === "string" ? videoUrl.trim().slice(0, 500) : null,
        pricingTiers: typeof pricingTiers === "string" ? pricingTiers.slice(0, 2000) : null,
        servings: typeof servings === "string" ? servings.trim().slice(0, 100) : null,
        shape: typeof shape === "string" ? shape.trim().slice(0, 50) : null,
        eggless: typeof eggless === "boolean" ? eggless : false,
        sameDay: typeof sameDay === "boolean" ? sameDay : false,
        customOrder: typeof customOrder === "boolean" ? customOrder : false,
        pickupAvailable: typeof pickupAvailable === "boolean" ? pickupAvailable : false,
        featured: typeof featured === "boolean" ? featured : false,
        metaTitle: typeof metaTitle === "string" ? metaTitle.trim().slice(0, 200) : null,
        metaDescription: typeof metaDescription === "string" ? metaDescription.trim().slice(0, 500) : null,
        availableCountries: typeof availableCountries === "string" ? availableCountries.trim().slice(0, 500) : null,
        availableStates: typeof availableStates === "string" ? availableStates.trim().slice(0, 500) : null,
        availableCities: typeof availableCities === "string" ? availableCities.trim().slice(0, 500) : null,
        inStock: typeof inStock === "boolean" ? inStock : true,
        stockCount: stockCount != null && Number.isFinite(Number(stockCount)) ? Math.round(Number(stockCount)) : null,
        extraFields: typeof extraFields === "string" ? extraFields.slice(0, 5000) : null,
      },
    });

    return NextResponse.json({ product: transformProduct(created) }, { status: 201 });
  } catch (err) {
    console.error("[api/products] POST failed:", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
