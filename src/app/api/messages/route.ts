import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/constants";

/**
 * Messages API
 *
 * GET /api/messages — list conversations for the current user
 *   Query: ?role=vendor|customer|admin
 *   Returns conversations with last message + unread counts
 *
 * POST /api/messages — start or continue a conversation
 *   Body: { recipientType, recipientId, content, vendorId?, productId?, bookingId? }
 *   Creates a conversation if it doesn't exist, adds a message, returns conversation
 */

function getParticipantOrder(type1: string, id1: string, type2: string, id2: string) {
  // Ensure consistent ordering so the same conversation isn't duplicated
  const a = `${type1}:${id1}`;
  const b = `${type2}:${id2}`;
  if (a <= b) {
    return { p1Type: type1, p1Id: id1, p2Type: type2, p2Id: id2 };
  }
  return { p1Type: type2, p1Id: id2, p2Type: type1, p2Id: id1 };
}

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
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // For vendor role, get the vendor ID from the user
    let participantId = userId;
    let participantType = role;
    if (role === "vendor") {
      const vendor = await db.vendor.findFirst({
        where: { owner_user_id: userId },
        select: { id: true },
      });
      if (!vendor) {
        return NextResponse.json({ conversations: [] });
      }
      participantId = vendor.id;
    }

    // Find conversations where this user is either participant
    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { participant1Type: participantType, participant1Id: participantId },
          { participant2Type: participantType, participant2Id: participantId },
        ],
      },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
    });

    // Format for the frontend — determine which side the current user is on
    const formatted = conversations.map((c) => {
      const isP1 = c.participant1Type === participantType && c.participant1Id === participantId;
      return {
        id: c.id,
        vendorId: c.vendorId,
        productId: c.productId,
        bookingId: c.bookingId,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt?.toISOString() ?? c.createdAt.toISOString(),
        unreadCount: isP1 ? c.unreadCount1 : c.unreadCount2,
        otherParticipant: {
          type: isP1 ? c.participant2Type : c.participant1Type,
          id: isP1 ? c.participant2Id : c.participant1Id,
        },
      };
    });

    return NextResponse.json({ conversations: formatted });
  } catch (err) {
    console.error("[api/messages] GET failed:", err);
    return NextResponse.json({ conversations: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
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
    const { recipientType, recipientId, content, vendorId, productId, bookingId, senderName, senderAvatar, attachments } = body;

    if (!recipientType || !recipientId || !content) {
      return NextResponse.json({ error: "recipientType, recipientId, and content required" }, { status: 400 });
    }

    // Determine sender type — if the user owns a vendor, they're a vendor
    let senderType = "customer";
    let senderId = userId;
    let name = senderName || user?.email || "Customer";
    let avatar = senderAvatar || null;

    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: userId },
      select: { id: true, name: true, avatarImage: true },
    });
    if (vendor && recipientType !== "vendor") {
      senderType = "vendor";
      senderId = vendor.id;
      name = vendor.name;
      avatar = vendor.avatarImage;
    }

    // Check if admin
    const isAdmin = isAdminEmail(user?.email);
    if (isAdmin) {
      senderType = "admin";
      senderId = userId;
    }

    // Get participant order
    const { p1Type, p1Id, p2Type, p2Id } = getParticipantOrder(senderType, senderId, recipientType, recipientId);

    // Find or create conversation
    let conversation = await db.conversation.findUnique({
      where: {
        participant1Type_participant1Id_participant2Type_participant2Id: {
          participant1Type: p1Type,
          participant1Id: p1Id,
          participant2Type: p2Type,
          participant2Id: p2Id,
        },
      },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          participant1Type: p1Type,
          participant1Id: p1Id,
          participant2Type: p2Type,
          participant2Id: p2Id,
          vendorId: vendorId || null,
          productId: productId || null,
          bookingId: bookingId || null,
        },
      });
    }

    // Add message
    const message = await db.message.create({
      data: {
        conversationId: conversation.id,
        senderType,
        senderId,
        senderName: name,
        senderAvatar: avatar,
        content,
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
    });

    // Update conversation last message + unread count
    const isSenderP1 = p1Type === senderType && p1Id === senderId;
    await db.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: content.slice(0, 100),
        lastMessageAt: new Date(),
        unreadCount1: isSenderP1 ? conversation.unreadCount1 : { increment: 1 },
        unreadCount2: isSenderP1 ? { increment: 1 } : conversation.unreadCount2,
      },
    });

    // Create notification for the recipient
    const notifRecipientType = recipientType === "vendor" ? "vendor" : recipientType === "admin" ? "admin" : "customer";
    const notifRecipientId = recipientId;
    await db.notification.create({
      data: {
        recipientType: notifRecipientType,
        recipientId: notifRecipientId,
        type: "new_message",
        title: `New message from ${name}`,
        message: content.slice(0, 80),
        vendorId: vendorId || undefined,
        conversationId: conversation.id,
        actionUrl: "/dashboard?tab=messages",
      },
    }).catch(() => {});

    return NextResponse.json({ conversation: { id: conversation.id }, message }, { status: 201 });
  } catch (err) {
    console.error("[api/messages] POST failed:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
