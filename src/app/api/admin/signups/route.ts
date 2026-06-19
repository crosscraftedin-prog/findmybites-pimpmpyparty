import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/admin/signups
 * Returns last 6 months of vendor signups grouped by month + ecosystem.
 */
export async function GET(_req: NextRequest) {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const vendors = await db.vendor.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, ecosystem: true },
      orderBy: { createdAt: "asc" },
    });

    // Build 6-month buckets
    const months: { key: string; label: string; food: number; party: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      months.push({
        key,
        label: d.toLocaleDateString("en-US", { month: "short" }),
        food: 0,
        party: 0,
      });
    }

    for (const v of vendors) {
      const d = new Date(v.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = months.find((m) => m.key === key);
      if (bucket) {
        if (v.ecosystem === "FINDMYBITES") bucket.food++;
        else bucket.party++;
      }
    }

    return NextResponse.json({
      data: months.map((m) => ({ month: m.label, food: m.food, party: m.party })),
    });
  } catch (err) {
    console.error("[api/admin/signups] GET failed:", err);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
