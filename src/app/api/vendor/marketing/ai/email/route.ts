/** POST /api/vendor/marketing/ai/email — Generate email campaign content */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { generateEmailCampaign } from "@/lib/marketing/marketing-ai-service";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const { template, productName, festival, offer, save } = await req.json();
    if (!template) return NextResponse.json({ error: "template required" }, { status: 400 });
    const email = await generateEmailCampaign(vendor.id, template, { productName, festival, offer });
    if (save) {
      const row = await db.emailCampaign.create({
        data: {
          vendorId: vendor.id, template,
          subject: email.subject, preheader: email.preheader, body: email.body,
          status: "draft",
        },
      });
      return NextResponse.json({ email, campaign: row });
    }
    return NextResponse.json({ email });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
