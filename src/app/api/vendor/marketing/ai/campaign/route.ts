/** POST /api/vendor/marketing/ai/campaign — Generate campaign copy + optionally create campaign */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { generateCampaignCopy } from "@/lib/marketing/marketing-ai-service";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const { type, name, discount, festival, save } = await req.json();
    if (!type || !name) return NextResponse.json({ error: "type and name required" }, { status: 400 });
    const copy = await generateCampaignCopy(vendor.id, type, name, { discount, festival });
    if (save) {
      const campaign = await db.marketingCampaign.create({
        data: {
          vendorId: vendor.id, type, name,
          discountPercent: discount ? Number(discount) : null,
          headline: copy.headline, description: copy.description, terms: copy.terms,
          status: "draft",
        },
      });
      return NextResponse.json({ copy, campaign });
    }
    return NextResponse.json({ copy });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
