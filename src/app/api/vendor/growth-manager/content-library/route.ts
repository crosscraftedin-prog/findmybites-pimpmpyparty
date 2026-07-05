/** GET /api/vendor/growth-manager/content-library — AI content library */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { getContentLibrary } from "@/lib/growth-manager/growth-manager-service";

export async function GET(_req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try { return NextResponse.json({ items: await getContentLibrary(vendor.id) }); }
  catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
