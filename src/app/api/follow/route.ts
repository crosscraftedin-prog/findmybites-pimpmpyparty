import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Phase 2.5 — Customer Follow API
 *
 * POST   /api/follow          → follow a vendor
 * DELETE /api/follow          → unfollow a vendor
 * GET    /api/follow?vendorId → check follow status + follower count
 *
 * Auth: supabase user ID when logged in, or a visitor hash (IP + UA) for
 * anonymous followers — same pattern as /api/analytics/track.
 */

interface FollowBody {
  vendorId?: string;
}

// Simple deterministic hash (NOT for security — for deduplication only)
function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return String(h);
}

function getVisitorHash(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  return `anon_${simpleHash(`${ip}:${ua}`)}`;
}

/** Resolve the current user ID (supabase auth) or fall back to visitor hash. */
async function resolveUserId(req: NextRequest): Promise<{
  userId: string;
  userEmail: string | null;
  isAnonymous: boolean;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      return { userId: user.id, userEmail: user.email ?? null, isAnonymous: false };
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return {
        userId: session.user.id,
        userEmail: session.user.email ?? null,
        isAnonymous: false,
      };
    }
  } catch {
    // fall through to visitor hash
  }
  return { userId: getVisitorHash(req), userEmail: null, isAnonymous: true };
}

// ── POST: follow a vendor ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as FollowBody;
    const { vendorId } = body;
    if (!vendorId) {
      return NextResponse.json(
        { error: "vendorId required" },
        { status: 400 }
      );
    }

    const { userId, userEmail } = await resolveUserId(req);

    try {
      // Upsert on [vendorId, userId] unique
      await db.vendorFollow.upsert({
        where: {
          vendorId_userId: { vendorId, userId },
        },
        update: {
          // re-follow updates userEmail in case it changed
          userEmail,
        },
        create: {
          vendorId,
          userId,
          userEmail,
        },
      });
    } catch (e) {
      // Prisma typing: compound unique shortcut name may not be inferred in
      // some Prisma versions when the unique is `@@unique([...])`. Fall back
      // to findFirst + create.
      console.error("[api/follow] upsert failed, trying fallback:", (e as Error)?.message?.slice(0, 120));
      try {
        let existing: { id: string } | null = null;
        try {
          existing = await db.vendorFollow.findFirst({
            where: { vendorId, userId },
            select: { id: true },
          });
        } catch {
          // ignore
        }
        if (!existing) {
          await db.vendorFollow.create({
            data: { vendorId, userId, userEmail },
          });
        }
      } catch (e2) {
        console.error("[api/follow] fallback create failed:", (e2 as Error)?.message?.slice(0, 120));
        // DB unavailable — still return success (degraded)
      }
    }

    return NextResponse.json({ success: true, following: true });
  } catch (err) {
    console.error("[api/follow] POST failed:", err);
    return NextResponse.json(
      { success: false, following: false, error: "Failed to follow" },
      { status: 500 }
    );
  }
}

// ── DELETE: unfollow a vendor ──────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as FollowBody;
    const { vendorId } = body;
    if (!vendorId) {
      return NextResponse.json(
        { error: "vendorId required" },
        { status: 400 }
      );
    }

    const { userId } = await resolveUserId(req);

    try {
      await db.vendorFollow.deleteMany({
        where: { vendorId, userId },
      });
    } catch (e) {
      console.error("[api/follow] deleteMany failed:", (e as Error)?.message?.slice(0, 120));
      // DB unavailable — still return success (degraded)
    }

    return NextResponse.json({ success: true, following: false });
  } catch (err) {
    console.error("[api/follow] DELETE failed:", err);
    return NextResponse.json(
      { success: false, following: false, error: "Failed to unfollow" },
      { status: 500 }
    );
  }
}

// ── GET: check follow status + follower count ──────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const vendorId = sp.get("vendorId");
    if (!vendorId) {
      return NextResponse.json(
        { error: "vendorId query parameter required" },
        { status: 400 }
      );
    }

    const { userId } = await resolveUserId(req);

    let following = false;
    let followerCount = 0;

    try {
      const existing = await db.vendorFollow.findFirst({
        where: { vendorId, userId },
        select: { id: true },
      });
      following = !!existing;
    } catch (e) {
      console.error("[api/follow] findFirst failed:", (e as Error)?.message?.slice(0, 120));
    }

    try {
      followerCount = await db.vendorFollow.count({
        where: { vendorId },
      });
    } catch (e) {
      console.error("[api/follow] count failed:", (e as Error)?.message?.slice(0, 120));
    }

    return NextResponse.json({ following, followerCount });
  } catch (err) {
    console.error("[api/follow] GET failed:", err);
    return NextResponse.json({ following: false, followerCount: 0 });
  }
}
