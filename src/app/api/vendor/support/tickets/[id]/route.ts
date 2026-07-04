/**
 * GET  /api/vendor/support/tickets/[id]  — get ticket detail (ownership-scoped)
 * POST /api/vendor/support/tickets/[id]  — send a message in the conversation
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { getTicket, sendMessage, markVendorRead } from "@/lib/support/support-service";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const ticket = await getTicket(id, vendor.id); // ownership-scoped
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    // Mark as read (vendor is viewing the conversation)
    await markVendorRead(id, vendor.id);
    return NextResponse.json({ ticket });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    // Verify ownership
    const ticket = await getTicket(id, vendor.id);
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    if (ticket.status === "closed") return NextResponse.json({ error: "This ticket is closed" }, { status: 400 });

    const body = await req.json();
    const { message, attachments } = body;
    if (!message?.trim() && !attachments?.length) {
      return NextResponse.json({ error: "Message or attachment required" }, { status: 400 });
    }

    const fullVendor = await db.vendor.findUnique({
      where: { id: vendor.id },
      select: { name: true, avatarImage: true },
    });

    const msg = await sendMessage(
      id, "vendor", vendor.id,
      fullVendor?.name || "Vendor",
      fullVendor?.avatarImage || null,
      message || "",
      attachments
    );

    return NextResponse.json({ message: msg }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
