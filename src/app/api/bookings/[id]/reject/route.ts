import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { rejectBooking, generateBookingNotification } from "@/lib/bookings/booking-service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const vendor = await db.vendor.findFirst({ where: { owner_user_id: session.user.id }, select: { id: true } });
    if (!vendor) return NextResponse.json({ error: "No vendor listing found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const booking = await rejectBooking(id, vendor.id, body.reason);
    const notif = await generateBookingNotification(id, "rejected").catch(() => null);
    return NextResponse.json({ success: true, booking, notification: notif });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
