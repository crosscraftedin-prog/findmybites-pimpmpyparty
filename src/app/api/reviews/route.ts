import { NextRequest, NextResponse } from "next/server";
import { type Review as DbReview } from "@prisma/client";
import { db } from "@/lib/db";
import type { Review as ApiReview } from "@/lib/types";

function transformReview(r: DbReview): ApiReview {
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

export async function GET(req: NextRequest) {
  try {
    const vendorId = req.nextUrl.searchParams.get("vendorId");
    if (!vendorId) {
      return NextResponse.json(
        { error: "vendorId query parameter is required" },
        { status: 400 }
      );
    }

    const reviews = await db.review.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews: reviews.map(transformReview) });
  } catch (err) {
    console.error("[api/reviews] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

interface CreateReviewBody {
  vendorId?: unknown;
  author?: unknown;
  avatar?: unknown;
  rating?: unknown;
  comment?: unknown;
  eventDate?: unknown;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateReviewBody;
    const { vendorId, author, avatar, rating, comment, eventDate } = body ?? {};

    if (
      typeof vendorId !== "string" ||
      !vendorId ||
      typeof author !== "string" ||
      !author ||
      typeof comment !== "string" ||
      !comment
    ) {
      return NextResponse.json(
        { error: "vendorId, author, and comment are required" },
        { status: 400 }
      );
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: "rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    const created = await db.review.create({
      data: {
        vendorId,
        author,
        avatar: typeof avatar === "string" ? avatar : "",
        rating: ratingNum,
        comment,
        eventDate: typeof eventDate === "string" ? eventDate : null,
      },
    });

    // Update vendor rating & reviewCount incrementally (weighted average).
    // The stored reviewCount is the public, marketing-facing total (which may
    // include historical reviews not stored as rows); we increment it by one
    // and fold the new rating into a running weighted average so the numbers
    // stay believable instead of resetting to the small sample of stored rows.
    const vendor = await db.vendor.findUnique({
      where: { id: vendorId },
      select: { rating: true, reviewCount: true },
    });
    const oldCount = vendor?.reviewCount ?? 0;
    const oldRating = vendor?.rating ?? 0;
    const newCount = oldCount + 1;
    const newRating =
      Math.round(((oldRating * oldCount + ratingNum) / newCount) * 10) / 10;

    await db.vendor.update({
      where: { id: vendorId },
      data: { rating: newRating, reviewCount: newCount },
    });

    return NextResponse.json(
      {
        review: transformReview(created),
        rating: newRating,
        reviewCount: newCount,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/reviews] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
