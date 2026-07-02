import { NextRequest, NextResponse } from "next/server";
import { getCustomerBookings } from "@/lib/bookings/booking-service";

/** GET /api/bookings/customer/[email] — customer's bookings */
export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  try {
    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);
    const bookings = await getCustomerBookings(decodedEmail);
    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
