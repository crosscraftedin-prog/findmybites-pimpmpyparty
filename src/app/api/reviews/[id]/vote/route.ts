import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/reviews/[id]/vote
 * Customer votes a review as helpful (or removes their vote).
 * Body: { userId: string, helpful?: boolean }
 * Public (no auth — uses visitor hash for anonymous users).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { userId, helpful = true } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Check if already voted
    const existing = await db.reviewVote.findUnique({
      where: { reviewId_userId: { reviewId: id, userId } },
    });

    if (existing) {
      // Remove existing vote (toggle off)
      await db.reviewVote.delete({ where: { id: existing.id } });
      await db.review.update({
        where: { id },
        data: { helpfulCount: { decrement: 1 } },
      });
      return NextResponse.json({ voted: false, helpfulCount: (await db.review.findUnique({ where: { id }, select: { helpfulCount: true } }))?.helpfulCount ?? 0 });
    }

    // Create new vote
    await db.reviewVote.create({
      data: { reviewId: id, userId, helpful },
    });
    await db.review.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
    });

    const review = await db.review.findUnique({
      where: { id },
      select: { helpfulCount: true },
    });

    return NextResponse.json({ voted: true, helpfulCount: review?.helpfulCount ?? 0 });
  } catch (err) {
    console.error("[api/reviews/[id]/vote] POST failed:", err);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
