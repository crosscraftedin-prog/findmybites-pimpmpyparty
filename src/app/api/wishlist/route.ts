import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Phase 2.5 — Customer Wishlist API
 *
 * POST   /api/wishlist                       → add to wishlist
 * DELETE /api/wishlist                       → remove from wishlist
 * GET    /api/wishlist?entityType&entityId   → check if wishlisted
 *
 * Auth: supabase user ID when logged in, or a visitor hash (IP + UA) for
 * anonymous wishlists — same pattern as /api/analytics/track.
 *
 * (The list-all endpoint lives at /api/wishlist/list — see ../list/route.ts)
 */

type EntityType = "product" | "service" | "vendor";

const VALID_ENTITY_TYPES = new Set<EntityType>(["product", "service", "vendor"]);

interface WishlistBody {
  entityType?: string;
  entityId?: string;
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

function coerceEntityType(raw: unknown): EntityType | null {
  if (typeof raw !== "string") return null;
  if (VALID_ENTITY_TYPES.has(raw as EntityType)) return raw as EntityType;
  return null;
}

// ── POST: add to wishlist ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as WishlistBody;
    const entityType = coerceEntityType(body.entityType);
    const entityId = body.entityId;
    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType (product|service|vendor) and entityId required" },
        { status: 400 }
      );
    }

    const { userId, userEmail } = await resolveUserId(req);

    try {
      await db.wishlist.upsert({
        where: {
          userId_entityType_entityId: { userId, entityType, entityId },
        },
        update: {
          // refresh vendorId/userEmail if changed
          vendorId: body.vendorId ?? null,
          userEmail,
        },
        create: {
          userId,
          userEmail,
          entityType,
          entityId,
          vendorId: body.vendorId ?? null,
        },
      });
    } catch (e) {
      // Compound unique shortcut may not be inferred by some Prisma versions.
      // Fall back to findFirst + create.
      console.error("[api/wishlist] upsert failed, trying fallback:", (e as Error)?.message?.slice(0, 120));
      try {
        let existing: { id: string } | null = null;
        try {
          existing = await db.wishlist.findFirst({
            where: { userId, entityType, entityId },
            select: { id: true },
          });
        } catch {
          // ignore
        }
        if (!existing) {
          await db.wishlist.create({
            data: {
              userId,
              userEmail,
              entityType,
              entityId,
              vendorId: body.vendorId ?? null,
            },
          });
        }
      } catch (e2) {
        console.error("[api/wishlist] fallback create failed:", (e2 as Error)?.message?.slice(0, 120));
      }
    }

    return NextResponse.json({ success: true, wishlisted: true });
  } catch (err) {
    console.error("[api/wishlist] POST failed:", err);
    return NextResponse.json(
      { success: false, wishlisted: false, error: "Failed to add to wishlist" },
      { status: 500 }
    );
  }
}

// ── DELETE: remove from wishlist ───────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as WishlistBody;
    const entityType = coerceEntityType(body.entityType);
    const entityId = body.entityId;
    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType (product|service|vendor) and entityId required" },
        { status: 400 }
      );
    }

    const { userId } = await resolveUserId(req);

    try {
      await db.wishlist.deleteMany({
        where: { userId, entityType, entityId },
      });
    } catch (e) {
      console.error("[api/wishlist] deleteMany failed:", (e as Error)?.message?.slice(0, 120));
    }

    return NextResponse.json({ success: true, wishlisted: false });
  } catch (err) {
    console.error("[api/wishlist] DELETE failed:", err);
    return NextResponse.json(
      { success: false, wishlisted: false, error: "Failed to remove from wishlist" },
      { status: 500 }
    );
  }
}

// ── GET: check if wishlisted ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const entityType = coerceEntityType(sp.get("entityType"));
    const entityId = sp.get("entityId") || undefined;
    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType (product|service|vendor) and entityId required" },
        { status: 400 }
      );
    }

    const { userId } = await resolveUserId(req);

    let wishlisted = false;
    try {
      const existing = await db.wishlist.findFirst({
        where: { userId, entityType, entityId },
        select: { id: true },
      });
      wishlisted = !!existing;
    } catch (e) {
      console.error("[api/wishlist] findFirst failed:", (e as Error)?.message?.slice(0, 120));
    }

    return NextResponse.json({ wishlisted });
  } catch (err) {
    console.error("[api/wishlist] GET failed:", err);
    return NextResponse.json({ wishlisted: false });
  }
}
