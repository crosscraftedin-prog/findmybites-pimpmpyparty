import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { rescheduleBooking, generateBookingNotification } from "@/lib/bookings/booking-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const vendor = await db.vendor.findFirst({ where: { owner_user_id: session.user.id }, select: { id: true } });
    if (!vendor) return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });

    const body = await req.json();
    const booking = await rescheduleBooking(id, vendor.id, body.newDate, body.newTime);
    const notif = await generateBookingNotification(id, "rescheduled").catch(() => null);
    return NextResponse.json({ success: true, booking, notification: notif });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
