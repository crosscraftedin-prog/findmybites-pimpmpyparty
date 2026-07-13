import { NextRequest, NextResponse } from "next/server";
import { getJoshAIFields, getSEOFields, getSearchableFields } from "@/lib/products/template-engine-v3";

/**
 * GET /api/templates/v3/ai-fields?category=bakers-bakery
 *
 * Returns the list of field keys that should be visible to Josh AI,
 * indexed for SEO, and searchable — all driven by the DB template.
 *
 * Returns: { aiFields: string[], seoFields: string[], searchableFields: string[] }
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category") || undefined;
    if (!category) {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }

    const [aiFields, seoFields, searchableFields] = await Promise.all([
      getJoshAIFields(category),
      getSEOFields(category),
      getSearchableFields(category),
    ]);

    return NextResponse.json({
      aiFields: aiFields ?? [],
      seoFields: seoFields ?? [],
      searchableFields: searchableFields ?? [],
      source: aiFields ? "db" : "default",
    });
  } catch (error: any) {
    console.error("[templates/v3/ai-fields] failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
