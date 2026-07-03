import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { updatePaymentStatus } from "@/lib/bookings/booking-service";

/** PUT /api/bookings/[id]/payment — update payment status (vendor only) */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const vendor = await db.vendor.findFirst({ where: { owner_user_id: session.user.id }, select: { id: true } });
    if (!vendor) return NextResponse.json({ error: "No vendor listing" }, { status: 404 });

    const body = await req.json();
    const { paymentStatus, depositStatus } = body;
    const booking = await updatePaymentStatus(id, vendor.id, paymentStatus, depositStatus);
    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
