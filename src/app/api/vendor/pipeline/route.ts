import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { getPipelineStats, searchBookings } from "@/lib/bookings/booking-service";

/** GET /api/vendor/pipeline — pipeline stats + bookings by stage (vendor only) */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const vendor = await db.vendor.findFirst({ where: { owner_user_id: session.user.id }, select: { id: true } });
    if (!vendor) return NextResponse.json({ error: "No vendor listing" }, { status: 404 });

    const sp = req.nextUrl.searchParams;
    const status = sp.get("status") as any;
    const search = sp.get("search") ?? undefined;

    const [stats, bookings] = await Promise.all([
      getPipelineStats(vendor.id),
      searchBookings({
        vendorId: vendor.id,
        status: status || undefined,
        search: search || undefined,
        limit: 100,
      }),
    ]);

    return NextResponse.json({ stats, bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
