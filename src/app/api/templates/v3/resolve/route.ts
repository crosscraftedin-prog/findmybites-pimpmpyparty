import { NextRequest, NextResponse } from "next/server";
import { resolveProductInfoSectionsFromDB } from "@/lib/products/template-engine-v3";
import { getLegacySectionsForCategory } from "@/lib/products/product-info";

/**
 * GET /api/templates/v3/resolve?category=bakers-bakery&subcategory=Wedding+Cakes
 *
 * Resolves Product Information sections for a category from the DB template.
 * Falls back to code-defined sections if no DB template exists.
 *
 * Returns: { sections: InfoSection[], source: "db" | "code" | "default" }
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const category = sp.get("category") || undefined;
    const subcategory = sp.get("subcategory") || undefined;

    if (!category) {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }

    // Try DB first
    const dbSections = await resolveProductInfoSectionsFromDB(category, subcategory);
    if (dbSections && dbSections.length > 0) {
      return NextResponse.json({ sections: dbSections, source: "db" });
    }

    // Fall back to code (legacy category lookup returns defaults in V3)
    const codeSections = getLegacySectionsForCategory(category);
    return NextResponse.json({ sections: codeSections, source: "default" });
  } catch (error: any) {
    console.error("[templates/v3/resolve] failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
