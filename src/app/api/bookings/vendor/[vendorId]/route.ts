import { NextRequest, NextResponse } from "next/server";
import { getVendorDashboard } from "@/lib/bookings/booking-service";

/** GET /api/bookings/vendor/[vendorId] — vendor dashboard stats + recent bookings */
export async function GET(req: NextRequest, { params }: { params: Promise<{ vendorId: string }> }) {
  try {
    const { vendorId } = await params;
    const dashboard = await getVendorDashboard(vendorId);
    return NextResponse.json(dashboard);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
