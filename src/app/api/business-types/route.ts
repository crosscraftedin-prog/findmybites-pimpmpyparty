/**
 * GET /api/business-types?category=bakers-bakery
 *
 * Returns DB-driven business types for a given category.
 * Falls back to default types if none found.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  if (!category) {
    return NextResponse.json({ businessTypes: [] });
  }
  try {
    const types = await db.businessType.findMany({
      where: { categoryId: category, active: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ businessTypes: types });
  } catch (err) {
    console.error("[business-types] failed:", err);
    return NextResponse.json({ businessTypes: [] });
  }
}
