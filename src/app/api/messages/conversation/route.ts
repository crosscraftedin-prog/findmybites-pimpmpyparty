import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/messages/conversation?id=xxx
 * Returns all messages in a conversation.
 *
 * POST /api/messages/conversation?id=xxx
 * Sends a message in an existing conversation.
 * Body: { content, attachments? }
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const conversationId = sp.get("id");

    if (!conversationId) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

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

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // ── Participant verification (BOLA fix) ──
    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: userId },
      select: { id: true },
    });
    const isAdmin = user?.email && ["bookingjosh@gmail.com"].includes(user.email.toLowerCase());

    let isP1 = false;
    let isP2 = false;
    if (isAdmin) {
      isP1 = conversation.participant1Type === "admin" && conversation.participant1Id === userId;
      isP2 = conversation.participant2Type === "admin" && conversation.participant2Id === userId;
    }
    if (!isP1 && vendor && conversation.participant1Type === "vendor" && conversation.participant1Id === vendor.id) {
      isP1 = true;
    }
    if (!isP2 && vendor && conversation.participant2Type === "vendor" && conversation.participant2Id === vendor.id) {
      isP2 = true;
    }
    if (!isP1 && conversation.participant1Type === "customer" && conversation.participant1Id === userId) {
      isP1 = true;
    }
    if (!isP2 && conversation.participant2Type === "customer" && conversation.participant2Id === userId) {
      isP2 = true;
    }

    if (!isP1 && !isP2) {
      return NextResponse.json({ error: "Not authorized to view this conversation" }, { status: 403 });
    }

    const messages = await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    // Mark messages from the other participant as read
    if (conversation) {
      // Reset unread count for the current user
      await db.conversation.update({
        where: { id: conversationId },
        data: isP1 ? { unreadCount1: 0 } : { unreadCount2: 0 },
      }).catch(() => {});
    }

    return NextResponse.json({ messages });
  } catch (err) {
    console.error("[api/messages/conversation] GET failed:", err);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const conversationId = sp.get("id");

    if (!conversationId) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

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
    const { content, attachments } = body;

    if (!content) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Determine sender info
    let senderType = "customer";
    let senderId = userId;
    let senderName = user?.email || "Customer";
    let senderAvatar: string | null = null;

    const vendor = await db.vendor.findFirst({
      where: { owner_user_id: userId },
      select: { id: true, name: true, avatarImage: true },
    });
    if (vendor) {
      senderType = "vendor";
      senderId = vendor.id;
      senderName = vendor.name;
      senderAvatar = vendor.avatarImage;
    }

    const isAdmin = user?.email && ["bookingjosh@gmail.com"].includes(user.email.toLowerCase());
    if (isAdmin) {
      senderType = "admin";
      senderId = userId;
      senderName = "Admin";
    }

    // ── Participant verification (BOLA fix) ──
    // Verify the sender is participant1 or participant2 of this conversation.
    const isSenderP1 = conversation.participant1Type === senderType && conversation.participant1Id === senderId;
    const isSenderP2 = conversation.participant2Type === senderType && conversation.participant2Id === senderId;
    if (!isSenderP1 && !isSenderP2) {
      return NextResponse.json({ error: "Not authorized to post in this conversation" }, { status: 403 });
    }

    const message = await db.message.create({
      data: {
        conversationId,
        senderType,
        senderId,
        senderName,
        senderAvatar,
        content,
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
    });

    // Update conversation — isSenderP1 already computed above for BOLA check
    await db.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content.slice(0, 100),
        lastMessageAt: new Date(),
        unreadCount1: isSenderP1 ? conversation.unreadCount1 : { increment: 1 },
        unreadCount2: isSenderP1 ? { increment: 1 } : conversation.unreadCount2,
      },
    });

    // Create notification for the other participant
    const otherType = isSenderP1 ? conversation.participant2Type : conversation.participant1Type;
    const otherId = isSenderP1 ? conversation.participant2Id : conversation.participant1Id;
    await db.notification.create({
      data: {
        recipientType: otherType === "vendor" ? "vendor" : otherType === "admin" ? "admin" : "customer",
        recipientId: otherId,
        type: "new_message",
        title: `New message from ${senderName}`,
        message: content.slice(0, 80),
        vendorId: conversation.vendorId || undefined,
        conversationId,
        actionUrl: "/dashboard?tab=messages",
      },
    }).catch(() => {});

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error("[api/messages/conversation] POST failed:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
