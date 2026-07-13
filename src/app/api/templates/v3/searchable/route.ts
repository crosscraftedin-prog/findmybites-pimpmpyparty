import { NextRequest, NextResponse } from "next/server";
import { getSearchableFieldMetadata } from "@/lib/products/template-engine-v3";

/**
 * GET /api/templates/v3/searchable?category=bakers-bakery
 *
 * Returns fields that should be indexed for marketplace search.
 * Search automatically indexes any field with `searchable=true`.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category") || undefined;
    if (!category) {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }

    const fields = await getSearchableFieldMetadata(category);
    return NextResponse.json({ fields: fields ?? [], source: fields ? "db" : "default" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
