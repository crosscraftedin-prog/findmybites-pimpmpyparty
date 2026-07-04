/** POST /api/vendor/growth-manager/chat — AI chat coach */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { chatWithCoach } from "@/lib/growth-manager/growth-manager-service";

export async function POST(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const { message } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });
    const reply = await chatWithCoach(vendor.id, message.trim());
    return NextResponse.json({ reply });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
