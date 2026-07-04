/** GET /api/vendor/success-center — aggregated success center data */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { getSuccessCenterData } from "@/lib/success/success-service";

export async function GET(_req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const data = await getSuccessCenterData(vendor.id);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[success-center] failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
