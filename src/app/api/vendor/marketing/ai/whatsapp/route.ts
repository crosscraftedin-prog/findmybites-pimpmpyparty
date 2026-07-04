/** POST /api/vendor/marketing/ai/whatsapp — Generate WhatsApp marketing message */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { generateWhatsAppMessage } from "@/lib/marketing/marketing-ai-service";

export async function POST(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const { type, productName, offer, festival, customerName } = await req.json();
    if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });
    const msg = await generateWhatsAppMessage(vendor.id, type, { productName, offer, festival, customerName });
    return NextResponse.json(msg);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
