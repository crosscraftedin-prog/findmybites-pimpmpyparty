import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// PUT /api/products/[id] — update product (auth required, owner only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    
    let userId: string | null = null;
    if (!userErr && user) {
      userId = user.id;
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
    }
    
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify ownership
    const product = await db.product.findUnique({ where: { id }, select: { vendorId: true } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    const vendor = await db.vendor.findFirst({
      where: { id: product.vendorId, owner_user_id: userId },
      select: { id: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await req.json();
    const data: any = {};
    
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.price !== undefined) data.price = Number(body.price) || 0;
    if (body.packageType !== undefined) data.packageType = body.packageType;
    if (body.comparePrice !== undefined) data.comparePrice = body.comparePrice ? Number(body.comparePrice) : null;
    if (body.currency !== undefined) data.currency = body.currency;
    if (body.duration !== undefined) data.duration = body.duration || null;
    if (body.capacity !== undefined) data.capacity = body.capacity ? Number(body.capacity) : null;
    if (body.includes !== undefined) data.includes = body.includes ? JSON.stringify(body.includes) : null;
    if (body.dietaryTags !== undefined) data.dietaryTags = body.dietaryTags ? JSON.stringify(body.dietaryTags) : null;
    if (body.addOns !== undefined) data.addOns = body.addOns ? JSON.stringify(body.addOns) : null;
    if (body.leadTime !== undefined) data.leadTime = body.leadTime || null;
    if (body.isAvailable !== undefined) data.isAvailable = body.isAvailable;
    if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured;
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0;
    if (body.images !== undefined) {
      data.images = body.images ? JSON.stringify(body.images) : null;
      data.image = body.images?.[0] || null;
    }
    // Enhanced food fields
    if (body.allergens !== undefined) data.allergens = body.allergens || null;
    if (body.customAllergen !== undefined) data.customAllergen = body.customAllergen || null;
    if (body.cuisineType !== undefined) data.cuisineType = body.cuisineType || null;
    if (body.customisationAvailable !== undefined) data.customisationAvailable = body.customisationAvailable;
    if (body.customisationNotes !== undefined) data.customisationNotes = body.customisationNotes || null;
    if (body.shelfLife !== undefined) data.shelfLife = body.shelfLife || null;
    if (body.storageMethod !== undefined) data.storageMethod = body.storageMethod || null;
    if (body.storageInstructions !== undefined) data.storageInstructions = body.storageInstructions || null;
    if (body.recipePublic !== undefined) data.recipePublic = body.recipePublic;
    if (body.recipeText !== undefined) data.recipeText = body.recipeText || null;
    if (body.recipePdf !== undefined) data.recipePdf = body.recipePdf || null;

    const updated = await db.product.update({ where: { id }, data });
    return NextResponse.json({ product: updated });
  } catch (err) {
    console.error("[api/products/[id]] PUT failed:", err);
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to update product: ${errMsg}` }, { status: 500 });
  }
}

// DELETE /api/products/[id] — delete product (auth required, owner only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    
    let userId: string | null = null;
    if (!userErr && user) {
      userId = user.id;
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
    }
    
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const product = await db.product.findUnique({ where: { id }, select: { vendorId: true } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    const vendor = await db.vendor.findFirst({
      where: { id: product.vendorId, owner_user_id: userId },
      select: { id: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await db.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/products/[id]] DELETE failed:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
