import { sanitizePrompt } from "@/lib/ai/security";
/** POST /api/vendor/marketing/ai/advisor — AI growth recommendations */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { getGrowthAdvice } from "@/lib/marketing/marketing-ai-service";

export async function POST(_req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  // Note: This route doesn't accept user input (only vendorId from session),
  // so prompt injection protection is not needed here.
  try {
    const recs = await getGrowthAdvice(vendor.id);
    return NextResponse.json({ recommendations: recs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
