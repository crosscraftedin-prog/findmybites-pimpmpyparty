import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/activity
 * Returns recent activity (recent bookings + reviews + vendor signups).
 * Falls back gracefully — never crashes.
 */
export async function GET(_req: NextRequest) {
  try {
    // Build activity from recent bookings, reviews, and vendor signups
    const [recentBookings, recentReviews, recentVendors] = await Promise.all([
      db.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { vendor: { select: { name: true, ecosystem: true } } },
      }),
      db.review.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { vendor: { select: { name: true, ecosystem: true } } },
      }),
      db.vendor.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, ecosystem: true, createdAt: true },
      }),
    ]);

    type Item = { id: string; type: string; description: string; createdAt: string };
    const items: Item[] = [];

    for (const b of recentBookings) {
      items.push({
        id: `booking-${b.id}`,
        type: b.vendor?.ecosystem === "FINDMYBITES" ? "food" : "party",
        description: `New booking enquiry from ${b.name} for ${b.vendor?.name ?? "a vendor"}`,
        createdAt: b.createdAt.toISOString(),
      });
    }
    for (const r of recentReviews) {
      items.push({
        id: `review-${r.id}`,
        type: r.vendor?.ecosystem === "FINDMYBITES" ? "food" : "party",
        description: `${r.author} left a ${r.rating}★ review on ${r.vendor?.name ?? "a vendor"}`,
        createdAt: r.createdAt.toISOString(),
      });
    }
    for (const v of recentVendors) {
      items.push({
        id: `vendor-${v.id}`,
        type: v.ecosystem === "FINDMYBITES" ? "food" : "party",
        description: `${v.name} joined the marketplace`,
        createdAt: v.createdAt.toISOString(),
      });
    }

    // Sort by date desc
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ items: items.slice(0, 20) });
  } catch (err) {
    console.error("[api/admin/activity] GET failed:", err);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
