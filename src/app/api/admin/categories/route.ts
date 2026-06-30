import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/categories
 * Returns all categories with their subcategories.
 * Optional ?ecosystem=FINDMYBITES|PIMPMYPARTY filter.
 */
export async function GET(req: NextRequest) {
  try {
  const guard = await requireAdmin();
  if (guard) return guard;
    const sp = req.nextUrl.searchParams;
    const ecosystem = sp.get("ecosystem");

    const where = ecosystem ? { ecosystem } : {};

    const categories = await db.category.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      include: {
        subcategories: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("[api/admin/categories] GET failed:", err);
    // Return empty array — admin should seed categories via the Admin Panel
    // rather than seeing legacy hardcoded categories.
    return NextResponse.json({ categories: [] });
  }
}

/**
 * POST /api/admin/categories
 * Create a new category.
 * Body: { label, ecosystem, description?, icon?, image?, accent? }
 */
export async function POST(req: NextRequest) {
  try {
  const guard = await requireAdmin();
  if (guard) return guard;
    const body = await req.json();
    const { label, ecosystem, description, icon, image, accent } = body;

    if (!label || !ecosystem) {
      return NextResponse.json(
        { error: "label and ecosystem are required" },
        { status: 400 }
      );
    }

    const slug = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const category = await db.category.create({
      data: {
        slug,
        label,
        ecosystem,
        description: description ?? null,
        icon: icon ?? null,
        image: image ?? null,
        accent: accent ?? null,
      },
    });

    return NextResponse.json({ category });
  } catch (err) {
    console.error("[api/admin/categories] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
