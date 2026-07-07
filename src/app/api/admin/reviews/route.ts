import { requireAdmin } from "@/lib/admin-guard";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Review as DbReview } from "@prisma/client";
import type { Review } from "@/lib/types";

function transformReview(r: DbReview): Review {
  return {
    id: r.id,
    vendorId: r.vendorId,
    author: r.author,
    avatar: r.avatar,
    rating: r.rating,
    comment: r.comment,
    eventDate: r.eventDate,
    createdAt: r.createdAt.toISOString(),
  };
}

/**
 * GET /api/admin/reviews?rating=&page=&pageSize=
 * Returns all reviews with the vendor name joined, newest first. Paginated.
 * Optional rating filter (e.g. ?rating=1 for low ratings to moderate).
 */
export async function GET(req: NextRequest) {
  try {
  const guard = await requireAdmin();
  if (guard) return guard;
    const sp = req.nextUrl.searchParams;
    const ratingRaw = sp.get("rating");
    const pageRaw = Number(sp.get("page"));
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.round(pageRaw) : 1;
    const pageSizeRaw = Number(sp.get("pageSize"));
    const pageSize =
      Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
        ? Math.min(100, Math.round(pageSizeRaw))
        : 25;

    const where =
      ratingRaw && ratingRaw !== "all"
        ? { rating: Number(ratingRaw) }
        : {};
    const [total, rows] = await Promise.all([
      db.review.count({ where }),
      db.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { vendor: { select: { name: true } } },
      }),
    ]);

    const reviews = rows.map((r) => ({
      ...transformReview(r),
      vendorName: r.vendor?.name ?? "—",
    }));

    return NextResponse.json({
      reviews,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    console.error("[api/admin/reviews] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
