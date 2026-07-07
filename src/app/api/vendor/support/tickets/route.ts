/**
 * GET  /api/vendor/support/tickets          — list vendor's tickets (with search/filters)
 * POST /api/vendor/support/tickets          — create a new support ticket
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveVendorFromSession } from "@/lib/vendor-session";
import { createTicket, searchTickets } from "@/lib/support/support-service";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const sp = req.nextUrl.searchParams;
    const { tickets, total } = await searchTickets({
      vendorId: vendor.id,
      status: sp.get("status") || undefined,
      category: sp.get("category") || undefined,
      priority: sp.get("priority") || undefined,
      search: sp.get("search") || undefined,
      limit: sp.get("limit") ? Number(sp.get("limit")) : 50,
      offset: sp.get("offset") ? Number(sp.get("offset")) : 0,
    });
    return NextResponse.json({ tickets, total });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const vendor = await resolveVendorFromSession();
  if (!vendor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = await req.json();
    const { subject, category, priority, description, attachments } = body;

    if (!subject?.trim() || !category || !description?.trim()) {
      return NextResponse.json({ error: "Subject, category, and description are required" }, { status: 400 });
    }

    // Fetch vendor contact info
    const fullVendor = await db.vendor.findUnique({
      where: { id: vendor.id },
      select: { name: true, userEmail: true, whatsapp: true },
    });

    // Auto-capture browser info + dashboard URL from headers
    const userAgent = req.headers.get("user-agent") || "";
    const dashboardUrl = body.dashboardUrl || req.headers.get("referer") || "";

    const ticket = await createTicket({
      vendorId: vendor.id,
      vendorName: fullVendor?.name || "Unknown",
      vendorEmail: fullVendor?.userEmail || "",
      vendorPhone: fullVendor?.whatsapp || "",
      subject, category, priority: priority || "medium",
      description, attachments,
      browserInfo: userAgent, dashboardUrl,
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err: any) {
    console.error("[support/tickets] POST failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
