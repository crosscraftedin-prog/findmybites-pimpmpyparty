import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/reviews/enhanced
 *
 * Creates an enhanced review with photos, video, and verified purchase check.
 * Body: { vendorId, author, avatar, rating, comment, eventDate?, photos?, videoUrl?, reviewerEmail?, productId? }
 *
 * If reviewerEmail matches a booking email, marks as verified.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      vendorId, author, avatar, rating, comment, eventDate,
      photos, videoUrl, reviewerEmail, productId,
    } = body;

    if (!vendorId || !author || !comment || rating === undefined) {
      return NextResponse.json(
        { error: "vendorId, author, comment, and rating are required" },
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

    // Check if reviewer has a booking with this vendor (verified purchase)
    let verified = false;
    if (reviewerEmail) {
      try {
        const booking = await db.booking.findFirst({
          where: { vendorId, email: reviewerEmail },
          select: { id: true },
        });
        verified = !!booking;
      } catch {}
    }

    const created = await db.review.create({
      data: {
        vendorId,
        author,
        avatar: typeof avatar === "string" ? avatar : "",
        rating: ratingNum,
        comment,
        eventDate: typeof eventDate === "string" ? eventDate : null,
        reviewerEmail: reviewerEmail || null,
        photos: photos ? JSON.stringify(photos) : null,
        videoUrl: videoUrl || null,
        verified,
        productId: productId || null,
      },
    });

    // Update vendor rating & reviewCount
    const vendor = await db.vendor.findUnique({
      where: { id: vendorId },
      select: { rating: true, reviewCount: true },
    });
    if (vendor) {
      const oldCount = vendor.reviewCount;
      const oldRating = vendor.rating;
      const newCount = oldCount + 1;
      const newRating = Math.round(((oldRating * oldCount + ratingNum) / newCount) * 10) / 10;

      await db.vendor.update({
        where: { id: vendorId },
        data: { rating: newRating, reviewCount: newCount },
      });
    }

    // Create notification for the vendor
    await db.notification.create({
      data: {
        recipientType: "vendor",
        recipientId: vendorId,
        type: "new_message",
        title: `New ${ratingNum}-star review from ${author}`,
        message: comment.slice(0, 80),
        vendorId,
        actionUrl: "/dashboard?tab=reviews",
      },
    }).catch(() => {});

    return NextResponse.json(
      { review: created, verified },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/reviews/enhanced] POST failed:", err);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
