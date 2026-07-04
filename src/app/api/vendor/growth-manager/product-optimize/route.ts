/** POST /api/vendor/growth-manager/product-optimize — AI product optimizer */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { optimizeProduct } from "@/lib/growth-manager/growth-manager-service";

export async function POST(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
    const result = await optimizeProduct(productId, vendor.id);
    return NextResponse.json(result);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
