/**
 * GET /api/vendor/marketing/qr?type=vendor|product|whatsapp|booking|review&productId=PID
 * Returns a PNG/SVG QR code data URL for the requested resource.
 */
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const type = sp.get("type") || "vendor";
  const format = sp.get("format") === "svg" ? "svg" : "png";

  // Resolve target URL
  let targetUrl = "";
  const fullVendor = await db.vendor.findUnique({
    where: { id: vendor.id },
    select: { slug: true, city: true, whatsapp: true },
  });
  switch (type) {
    case "vendor":
      targetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://findmybites.com"}/vendor/${fullVendor?.slug || ""}`;
      break;
    case "product": {
      const productId = sp.get("productId");
      if (!productId) return NextResponse.json({ error: "productId required for product QR" }, { status: 400 });
      const product = await db.product.findFirst({ where: { id: productId, vendorId: vendor.id }, select: { slug: true } });
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      targetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://findmybites.com"}/product/${product.slug}`;
      break;
    }
    case "whatsapp": {
      const phone = (fullVendor?.whatsapp || "").replace(/\D/g, "");
      targetUrl = phone ? `https://wa.me/${phone}` : `${process.env.NEXT_PUBLIC_SITE_URL || "https://findmybites.com"}/vendor/${fullVendor?.slug || ""}`;
      break;
    }
    case "booking":
      targetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://findmybites.com"}/vendor/${fullVendor?.slug || ""}#book`;
      break;
    case "review":
      targetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://findmybites.com"}/vendor/${fullVendor?.slug || ""}#review`;
      break;
    default:
      return NextResponse.json({ error: "Unknown QR type" }, { status: 400 });
  }

  try {
    if (format === "svg") {
      const svg = await QRCode.toString(targetUrl, { type: "svg", margin: 1, width: 240 });
      return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
    }
    const dataUrl = await QRCode.toDataURL(targetUrl, { margin: 1, width: 240 });
    return NextResponse.json({ dataUrl, targetUrl });
  } catch (err: any) {
    return NextResponse.json({ error: "QR generation failed" }, { status: 500 });
  }
}
