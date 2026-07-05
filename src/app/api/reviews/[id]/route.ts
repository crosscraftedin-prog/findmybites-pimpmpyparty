import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * DELETE /api/reviews/[id]
 * Remove a review (admin moderation only). Also decrements the vendor's reviewCount
 * and recomputes the weighted rating so public numbers stay consistent.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Admin authorization required ──
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;
    const review = await db.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const vendor = await db.vendor.findUnique({
      where: { id: review.vendorId },
      select: { rating: true, reviewCount: true },
    });
    const oldCount = vendor?.reviewCount ?? 1;
    const oldRating = vendor?.rating ?? 0;
    const newCount = Math.max(0, oldCount - 1);
    // reverse the weighted average: remove this review's contribution
    const newRating =
      newCount > 0
        ? Math.round(
            ((oldRating * oldCount - review.rating) / newCount) * 10
          ) / 10
        : 0;

    await db.$transaction([
      db.review.delete({ where: { id } }),
      db.vendor.update({
        where: { id: review.vendorId },
        data: { reviewCount: newCount, rating: newRating },
      }),
    ]);

    return NextResponse.json({ ok: true, rating: newRating, reviewCount: newCount });
  } catch (err) {
    console.error("[api/reviews/[id]] DELETE failed:", err);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
