/**
 * GET  /api/admin/support/tickets          — list all tickets (with filters)
 * POST /api/admin/support/tickets          — merge tickets { sourceId, targetId }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { searchTickets, mergeTickets, getAdminStats } from "@/lib/support/support-service";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const sp = req.nextUrl.searchParams;
    const [{ tickets, total }, stats] = await Promise.all([
      searchTickets({
        status: sp.get("status") || undefined,
        category: sp.get("category") || undefined,
        priority: sp.get("priority") || undefined,
        search: sp.get("search") || undefined,
        limit: sp.get("limit") ? Number(sp.get("limit")) : 100,
        offset: sp.get("offset") ? Number(sp.get("offset")) : 0,
      }),
      getAdminStats(),
    ]);
    return NextResponse.json({ tickets, total, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;
  try {
    const { sourceId, targetId } = await req.json();
    if (!sourceId || !targetId) return NextResponse.json({ error: "sourceId and targetId required" }, { status: 400 });
    await mergeTickets(sourceId, targetId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
