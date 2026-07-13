import { NextRequest, NextResponse } from "next/server";
import { getFilterFacets } from "@/lib/products/template-engine-v3";

/**
 * GET /api/templates/v3/filters?category=bakers-bakery
 *
 * Returns filter facets from the template.
 * Any field with `filterable=true` becomes a marketplace filter facet.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category") || undefined;
    if (!category) {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }

    const facets = await getFilterFacets(category);
    return NextResponse.json({ facets: facets ?? [], source: facets ? "db" : "default" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
