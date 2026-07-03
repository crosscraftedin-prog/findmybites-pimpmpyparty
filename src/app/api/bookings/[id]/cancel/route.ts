import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { cancelBooking, generateBookingNotification } from "@/lib/bookings/booking-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    const body = await req.json().catch(() => ({}));

    // If admin is cancelling, require admin auth
    if (body.actorRole === "admin") {
      const { requireAdmin } = await import("@/lib/admin-guard");
      const guard = await requireAdmin();
      if (guard) return guard;
      const booking = await cancelBooking(id, null, "admin", body.reason);
      const notif = await generateBookingNotification(id, "cancelled").catch(() => null);
      return NextResponse.json({ success: true, booking, notification: notif });
    }

    // Vendor cancellation: resolve from session
    if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const vendor = await db.vendor.findFirst({ where: { owner_user_id: session.user.id }, select: { id: true } });
    if (!vendor) return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });

    const booking = await cancelBooking(id, vendor.id, "vendor", body.reason);
    const notif = await generateBookingNotification(id, "cancelled").catch(() => null);
    return NextResponse.json({ success: true, booking, notification: notif });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
