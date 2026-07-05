/**
 * GET /api/business-types?category=bakers-bakery
 *   (or ?categoryId=bakers-bakery — both work)
 *
 * Returns DB-driven business types for a given category.
 * Returns empty array if no business types found (frontend shows
 * "No business types found." message — no silent fallback).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  // Support both "category" and "categoryId" params for flexibility
  const category = req.nextUrl.searchParams.get("category") || req.nextUrl.searchParams.get("categoryId");
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
    // Return 500 so the frontend can show error state (not silent empty)
    return NextResponse.json({ error: "Failed to load business types" }, { status: 500 });
  }
}
