import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * PATCH /api/notifications/read
 * Marks notifications as read.
 * Body: { id?: string (single), all?: true (mark all as read) }
 * Query: ?role=vendor|customer|admin
 */
export async function PATCH(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const role = sp.get("role") || "vendor";

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

    let recipientId = userId;
    if (role === "vendor") {
      const vendor = await db.vendor.findFirst({
        where: { owner_user_id: userId },
        select: { id: true },
      });
      if (!vendor) {
        return NextResponse.json({ success: false });
      }
      recipientId = vendor.id;
    }

    const body = await req.json();
    const { id, all } = body;

    const now = new Date();

    if (all) {
      // Mark all as read
      await db.notification.updateMany({
        where: {
          recipientType: role,
          recipientId,
          read: false,
        },
        data: { read: true, readAt: now },
      });
    } else if (id) {
      // Mark single as read — scoped to the authenticated recipient (BOLA fix)
      await db.notification.updateMany({
        where: { id, recipientType: role, recipientId },
        data: { read: true, readAt: now },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/notifications/read] PATCH failed:", err);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
