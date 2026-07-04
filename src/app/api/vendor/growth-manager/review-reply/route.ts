/** POST /api/vendor/growth-manager/review-reply — AI review reply generator */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { generateReviewReply } from "@/lib/growth-manager/growth-manager-service";

export async function POST(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const { reviewId, style } = await req.json();
    if (!reviewId) return NextResponse.json({ error: "reviewId required" }, { status: 400 });
    const reply = await generateReviewReply(reviewId, vendor.id, style || "professional");
    return NextResponse.json({ reply });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
