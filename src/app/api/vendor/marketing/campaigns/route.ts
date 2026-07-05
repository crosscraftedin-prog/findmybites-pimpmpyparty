/**
 * GET  /api/vendor/marketing/campaigns          — list campaigns
 * POST /api/vendor/marketing/campaigns          — create campaign
 * PUT  /api/vendor/marketing/campaigns?id=PID   — update campaign
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const campaigns = await db.marketingCampaign.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await req.json();
  const campaign = await db.marketingCampaign.create({
    data: {
      vendorId: vendor.id,
      type: body.type || "coupon",
      name: body.name || "Untitled campaign",
      code: body.code || null,
      discountPercent: body.discountPercent ?? null,
      discountAmount: body.discountAmount ?? null,
      headline: body.headline || null,
      description: body.description || null,
      terms: body.terms || null,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      status: body.status || "draft",
    },
  });
  return NextResponse.json({ campaign }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const body = await req.json();
  const update: any = {};
  for (const f of ["name","code","discountPercent","discountAmount","headline","description","terms","status"]) {
    if (body[f] !== undefined) update[f] = body[f];
  }
  if (body.startsAt !== undefined) update.startsAt = body.startsAt ? new Date(body.startsAt) : null;
  if (body.endsAt !== undefined) update.endsAt = body.endsAt ? new Date(body.endsAt) : null;
  const campaign = await db.marketingCampaign.updateMany({ where: { id, vendorId: vendor.id }, data: update });
  if (campaign.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
