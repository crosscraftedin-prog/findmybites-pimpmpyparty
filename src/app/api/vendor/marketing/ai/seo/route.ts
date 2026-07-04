/** POST /api/vendor/marketing/ai/seo — Generate SEO meta + keywords, optionally save */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { generateSeoCopy } from "@/lib/marketing/marketing-ai-service";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const { save } = await req.json();
    const seo = await generateSeoCopy(vendor.id);
    if (save) {
      await db.vendor.update({
        where: { id: vendor.id },
        data: {
          metaTitle: seo.metaTitle,
          metaDescription: seo.metaDescription,
          tags: JSON.stringify(seo.keywords),
        },
      });
    }
    return NextResponse.json({ seo, saved: !!save });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
