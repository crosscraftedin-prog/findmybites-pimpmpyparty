import { sanitizePrompt } from "@/lib/ai/security";
/** POST /api/vendor/marketing/ai/social — Generate social media post */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { generateSocialPost } from "@/lib/marketing/marketing-ai-service";

export async function POST(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    // V12: Prompt injection protection
    const sanitizeResult = sanitizePrompt(JSON.stringify(await req.json().catch(() => ({}))));
    if (sanitizeResult.blocked) return NextResponse.json({ error: 'Input rejected by security filter' }, { status: 400 });
  try {
    const { platform, topic, productName, offer, festival } = await req.json();
    if (!platform || !topic) return NextResponse.json({ error: "platform and topic required" }, { status: 400 });
    const post = await generateSocialPost(vendor.id, platform, topic, { productName, offer, festival });
    return NextResponse.json(post);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
