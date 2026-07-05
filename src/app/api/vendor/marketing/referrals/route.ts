/**
 * GET  /api/vendor/marketing/referrals — list referrals + stats
 * POST /api/vendor/marketing/referrals — create a referral invite
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export async function GET(_req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const referrals = await db.referral.findMany({
    where: { referrerVendorId: vendor.id },
    orderBy: { sentAt: "desc" },
    take: 100,
  });
  const stats = {
    invited: referrals.length,
    activated: referrals.filter((r) => r.status === "activated").length,
    creditsEarned: referrals.reduce((s, r) => s + r.creditsEarned, 0),
    commissionEarned: referrals.reduce((s, r) => s + r.commissionEarned, 0),
  };
  return NextResponse.json({ referrals, stats });
}

export async function POST(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { inviteeEmail } = await req.json();
  if (!inviteeEmail?.trim()) return NextResponse.json({ error: "inviteeEmail required" }, { status: 400 });
  // Generate a unique code
  const code = `FMB-${randomBytes(4).toString("hex").toUpperCase()}`;
  const referral = await db.referral.create({
    data: {
      referrerVendorId: vendor.id,
      inviteeEmail: inviteeEmail.trim().toLowerCase(),
      code,
      status: "sent",
    },
  });
  return NextResponse.json({ referral }, { status: 201 });
}
