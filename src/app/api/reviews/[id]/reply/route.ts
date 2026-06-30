import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/reviews/[id]/reply
 * Vendor replies to a review.
 * Body: { reply: string }
 * Vendor auth required (vendor must own the review's vendor).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    let userId: string | null = user?.id ?? null;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
    }
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { reply } = body;

    if (!reply || !reply.trim()) {
      return NextResponse.json({ error: "reply required" }, { status: 400 });
    }

    // Find the review + verify vendor ownership
    const review = await db.review.findUnique({
      where: { id },
      select: { vendorId: true },
    });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const vendor = await db.vendor.findFirst({
      where: { id: review.vendorId, owner_user_id: userId },
      select: { id: true, name: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const updated = await db.review.update({
      where: { id },
      data: {
        vendorReply: reply.trim(),
        vendorRepliedAt: new Date(),
      },
    });

    return NextResponse.json({ review: updated });
  } catch (err) {
    console.error("[api/reviews/[id]/reply] POST failed:", err);
    return NextResponse.json({ error: "Failed to reply" }, { status: 500 });
  }
}
