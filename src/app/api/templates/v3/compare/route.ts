import { NextRequest, NextResponse } from "next/server";
import { compareProducts } from "@/lib/products/template-engine-v3";

/**
 * GET /api/templates/v3/compare?productIdA=xxx&productIdB=yyy
 *
 * Compares two products by their template fields.
 * Automatically compares every field defined in the template.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const productIdA = sp.get("productIdA");
    const productIdB = sp.get("productIdB");

    if (!productIdA || !productIdB) {
      return NextResponse.json({ error: "productIdA and productIdB are required" }, { status: 400 });
    }

    const results = await compareProducts(productIdA, productIdB);
    if (!results) {
      return NextResponse.json({ error: "Could not compare products" }, { status: 404 });
    }

    return NextResponse.json({ comparisons: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
