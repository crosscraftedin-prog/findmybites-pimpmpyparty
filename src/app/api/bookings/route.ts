import { NextRequest, NextResponse } from "next/server";
import { createBooking, type BookingItem } from "@/lib/bookings/booking-service";

/**
 * POST /api/bookings
 * Create a new booking (customer-facing).
 * Body: CreateBookingInput
 *
 * GET /api/bookings?search=...&status=...&city=...&vendorId=...&dateFrom=...&dateTo=...
 * Search bookings (vendor/admin).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const booking = await createBooking({
      vendorId: body.vendorId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      customerId: body.customerId,
      eventType: body.eventType,
      bookingDate: body.bookingDate,
      bookingTime: body.bookingTime,
      address: body.address,
      city: body.city,
      guests: body.guests,
      budget: body.budget,
      currency: body.currency,
      specialNotes: body.specialNotes,
      items: body.items as BookingItem[],
      referenceImage: body.referenceImage,
      createdBy: body.createdBy,
    });
    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error: any) {
    console.error("[bookings] POST failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const { searchBookings } = await import("@/lib/bookings/booking-service");

    const bookings = await searchBookings({
      vendorId: sp.get("vendorId") ?? undefined,
      customerEmail: sp.get("customerEmail") ?? undefined,
      status: (sp.get("status") as any) ?? undefined,
      city: sp.get("city") ?? undefined,
      search: sp.get("search") ?? undefined,
      dateFrom: sp.get("dateFrom") ?? undefined,
      dateTo: sp.get("dateTo") ?? undefined,
      limit: sp.get("limit") ? parseInt(sp.get("limit")!) : 50,
      offset: sp.get("offset") ? parseInt(sp.get("offset")!) : 0,
    });

    return NextResponse.json({ bookings, count: bookings.length });
  } catch (error: any) {
    console.error("[bookings] GET failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
