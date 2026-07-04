/**
 * GET  /api/admin/support/tickets/[id]  — get ticket detail (all tickets)
 * POST /api/admin/support/tickets/[id]  — admin reply OR update status/priority/assign
 * DELETE /api/admin/support/tickets/[id] — delete spam ticket
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getTicket, sendMessage, adminUpdateTicket, markAdminRead, addInternalNote, deleteTicket,
} from "@/lib/support/support-service";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await ctx.params;
  try {
    const ticket = await getTicket(id);
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    await markAdminRead(id);
    return NextResponse.json({ ticket });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const { action } = body;

    // Resolve admin identity
    const supabase = await createSupabaseServerClient();
    let adminId = "admin";
    let adminEmail = "admin";
    let adminName = "Support Admin";
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { adminId = user.id; adminEmail = user.email ?? "admin"; adminName = user.email?.split("@")[0] ?? "Admin"; }
    } catch {}

    if (action === "reply") {
      const ticket = await getTicket(id);
      if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      if (ticket.status === "closed") return NextResponse.json({ error: "Ticket is closed" }, { status: 400 });
      const { message, attachments } = body;
      if (!message?.trim() && !attachments?.length) return NextResponse.json({ error: "Message required" }, { status: 400 });
      const msg = await sendMessage(id, "admin", adminId, adminName, null, message || "", attachments);
      return NextResponse.json({ message: msg }, { status: 201 });
    }

    if (action === "update") {
      const { status, priority, assignedTo, assignedToEmail } = body;
      const ticket = await adminUpdateTicket(id, { status, priority, assignedTo, assignedToEmail });
      return NextResponse.json({ ticket });
    }

    if (action === "internal_note") {
      const { note } = body;
      if (!note?.trim()) return NextResponse.json({ error: "Note required" }, { status: 400 });
      await addInternalNote(id, note.trim(), adminEmail);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await ctx.params;
  try {
    await deleteTicket(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
