import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/admin/categories/[id]/subcategories
 * Add a subcategory to a category.
 * Body: { label }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;
    const body = await req.json();
    const { label } = body;

    if (!label) {
      return NextResponse.json(
        { error: "label is required" },
        { status: 400 }
      );
    }

    const slug = `${categoryId}-${label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}`;

    const subcategory = await db.subcategory.create({
      data: { slug, label, categoryId },
    });

    return NextResponse.json({ subcategory });
  } catch (err) {
    console.error("[api/admin/categories/[id]/subcategories] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to add subcategory" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/categories/[id]/subcategories
 * List subcategories for a category.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;
    const subcategories = await db.subcategory.findMany({
      where: { categoryId },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ subcategories });
  } catch (err) {
    console.error("[api/admin/categories/[id]/subcategories] GET failed:", err);
    return NextResponse.json({ subcategories: [] });
  }
}
