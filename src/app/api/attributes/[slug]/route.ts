import { NextRequest, NextResponse } from "next/server";
import { getAttributeBySlug } from "@/lib/attributes/attribute-service";

/**
 * GET /api/attributes/[slug] — fetch a single attribute by slug.
 * Public, cached.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const attr = await getAttributeBySlug(slug);
    if (!attr) {
      return NextResponse.json({ error: "Attribute not found" }, { status: 404 });
    }
    const res = NextResponse.json({ attribute: attr });
    res.headers.set("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res;
  } catch (error: any) {
    console.error("[api/attributes/[slug]] GET failed:", error);
    return NextResponse.json({ error: "Failed to fetch attribute" }, { status: 500 });
  }
}
