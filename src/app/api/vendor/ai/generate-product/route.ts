import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { callZAI } from "@/lib/zai-server";

/**
 * POST /api/vendor/ai/generate-product
 * ─────────────────────────────────────────────────────────────────────────
 * Generates a first product for a vendor using their business info.
 * The vendor clicks "Create Product with AI" on the success screen and
 * gets a complete product they can publish in one click.
 *
 * Body: { vendorId: string }
 * Returns: { product: { name, description, price, category, tags, ... } }
 *
 * Requires authentication (the vendor owner).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }

    const body = await req.json();
    const { vendorId } = body;
    if (!vendorId) {
      return NextResponse.json({ error: "vendorId required" }, { status: 400 });
    }

    // Get the vendor
    const vendor = await db.vendor.findUnique({
      where: { id: vendorId },
      select: {
        id: true, name: true, category: true, city: true, country: true,
        ecosystem: true, description: true, tagline: true, owner_user_id: true,
        currency: true, avatarImage: true, heroImage: true,
      },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    if (vendor.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // ── Generate product with AI ──
    const isFood = vendor.ecosystem === "FINDMYBITES";
    const prompt = `You are a product expert for a ${isFood ? "food" : "party"} marketplace.
Generate ONE flagship product for this business:

Business: ${vendor.name}
Category: ${vendor.category}
City: ${vendor.city}, ${vendor.country || ""}
Description: ${vendor.description || vendor.tagline || ""}

${isFood
  ? "Examples for food: Chocolate Cake, Birthday Cake, Wedding Cake, Cupcakes, Biryani, Pizza"
  : "Examples for party: Birthday Package, Wedding Package, Balloon Decoration, DJ Package"}

Return JSON with these exact fields:
{
  "name": "Product name (e.g. 'Chocolate Birthday Cake')",
  "description": "A mouth-watering 2-3 sentence product description",
  "price": <suggested price as a number, e.g. 500>,
  "tags": ["relevant", "product", "tags"],
  "category": "${vendor.category}"
}

Only return valid JSON, no markdown.`;

    let productData: any = null;
    try {
      const aiResponse = await callZAI(prompt);
      if (!aiResponse) throw new Error("AI returned null");
      const cleaned = aiResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
      productData = JSON.parse(cleaned);
    } catch (aiErr) {
      console.error("[generate-product] AI failed:", aiErr);
      // Fallback product
      productData = {
        name: `${vendor.name} Signature ${isFood ? "Cake" : "Package"}`,
        description: vendor.description || vendor.tagline || `A signature offering from ${vendor.name}.`,
        price: isFood ? 500 : 1000,
        tags: [vendor.category, vendor.city.toLowerCase()],
        category: vendor.category,
      };
    }

    // ── Create the product in the DB ──
    const slug = `${productData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
    const product = await db.product.create({
      data: {
        vendorId: vendor.id,
        name: productData.name,
        slug,
        description: productData.description,
        price: Number(productData.price) || 0,
        image: vendor.avatarImage || vendor.heroImage || null,
        category: vendor.category,
        ecosystem: vendor.ecosystem,
        images: JSON.stringify([vendor.avatarImage, vendor.heroImage].filter(Boolean)),
        dietaryTags: JSON.stringify(Array.isArray(productData.tags) ? productData.tags : [vendor.category]),
        status: "active",
        isAvailable: true,
        metaTitle: `${productData.name} — ${vendor.name} | ${vendor.city}`,
        metaDescription: productData.description?.slice(0, 160) || "",
      },
    });

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        price: product.price,
      },
    });
  } catch (error: any) {
    console.error("[generate-product] failed:", error);
    return NextResponse.json({ error: error.message || "Failed to generate product" }, { status: 500 });
  }
}
