import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Notifications API
 *
 * GET /api/notifications?role=vendor|customer|admin
 *   Returns notifications for the current user, newest first.
 *
 * POST /api/notifications (internal — called by other APIs)
 *   Body: { recipientType, recipientId, type, title, message, vendorId?, actionUrl? }
 *   Creates a notification.
 */

export async function GET(req: NextRequest) {
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
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    // For vendor role, get the vendor ID
    let recipientId = userId;
    let recipientType = role;
    if (role === "vendor") {
      const vendor = await db.vendor.findFirst({
        where: { owner_user_id: userId },
        select: { id: true },
      });
      if (!vendor) {
        return NextResponse.json({ notifications: [], unreadCount: 0 });
      }
      recipientId = vendor.id;
    }

    // For admin role, also get admin notifications
    const isAdmin = user?.email && ["bookingjosh@gmail.com"].includes(user.email.toLowerCase());

    const where = isAdmin && role === "admin"
      ? { recipientType: "admin" }
      : {
          OR: [
            { recipientType, recipientId },
            ...(isAdmin ? [{ recipientType: "admin" as const }] : []),
          ],
        };

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("[api/notifications] GET failed:", err);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Internal endpoint — no auth required (called by other API routes)
    const body = await req.json();
    const { recipientType, recipientId, type, title, message, vendorId, productId, bookingId, quoteId, conversationId, actionUrl } = body;

    if (!recipientType || !recipientId || !type || !title) {
      return NextResponse.json({ error: "recipientType, recipientId, type, title required" }, { status: 400 });
    }

    const notification = await db.notification.create({
      data: {
        recipientType,
        recipientId,
        type,
        title,
        message: message || "",
        vendorId: vendorId || null,
        productId: productId || null,
        bookingId: bookingId || null,
        quoteId: quoteId || null,
        conversationId: conversationId || null,
        actionUrl: actionUrl || null,
      },
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (err) {
    console.error("[api/notifications] POST failed:", err);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}
