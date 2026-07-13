import { NextRequest, NextResponse } from "next/server";
import { getSEOFieldMetadata } from "@/lib/products/template-engine-v3";

/**
 * GET /api/templates/v3/seo?category=bakers-bakery
 *
 * Returns fields flagged `seoIndexed` for dynamic SEO schema generation.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category") || undefined;
    if (!category) {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }

    const fields = await getSEOFieldMetadata(category);
    return NextResponse.json({ fields: fields ?? [], source: fields ? "db" : "default" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
