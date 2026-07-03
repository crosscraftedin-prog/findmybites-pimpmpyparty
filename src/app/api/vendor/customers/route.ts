import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { getVendorCustomers } from "@/lib/bookings/booking-service";

/** GET /api/vendor/customers — customer CRM profiles (vendor only) */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const vendor = await db.vendor.findFirst({ where: { owner_user_id: session.user.id }, select: { id: true } });
    if (!vendor) return NextResponse.json({ error: "No vendor listing" }, { status: 404 });

    const customers = await getVendorCustomers(vendor.id);
    return NextResponse.json({ customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
