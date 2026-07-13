import { NextRequest, NextResponse } from "next/server";
import { getJoshAIFieldMetadata } from "@/lib/products/template-engine-v3";

/**
 * GET /api/templates/v3/josh-metadata?category=bakers-bakery
 *
 * Returns full field metadata for Josh AI: labels, descriptions, AI prompts,
 * priority, visibility. Josh understands templates automatically.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category") || undefined;
    if (!category) {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }

    const metadata = await getJoshAIFieldMetadata(category);
    return NextResponse.json({ fields: metadata ?? [], source: metadata ? "db" : "default" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
