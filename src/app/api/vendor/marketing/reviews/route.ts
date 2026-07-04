/**
 * GET  /api/vendor/marketing/reviews — list review requests + stats
 * POST /api/vendor/marketing/reviews — create a review request (whatsapp/email/qr)
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export async function GET(_req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const requests = await db.reviewRequest.findMany({
    where: { vendorId: vendor.id },
    orderBy: { sentAt: "desc" },
    take: 100,
  });
  const stats = {
    requested: requests.length,
    received: requests.filter((r) => r.status === "completed").length,
    conversionRate: requests.length ? Math.round((requests.filter((r) => r.status === "completed").length / requests.length) * 100) : 0,
  };
  return NextResponse.json({ requests, stats });
}

export async function POST(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { channel, customerName, customerContact } = await req.json();
  if (!channel) return NextResponse.json({ error: "channel required" }, { status: 400 });
  const token = randomBytes(8).toString("hex");
  const request = await db.reviewRequest.create({
    data: {
      vendorId: vendor.id,
      channel,
      customerName: customerName || null,
      customerContact: customerContact || null,
      token,
      status: "sent",
    },
  });
  return NextResponse.json({ request, reviewUrl: `/review/${token}` }, { status: 201 });
}
