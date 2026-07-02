import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBooking, getBookingNotes, getBookingTimeline } from "@/lib/bookings/booking-service";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * GET /api/bookings/[id]
 * Returns booking details + notes + timeline (events).
 *
 * Authorization:
 *   - Admin: can view any booking
 *   - Vendor: can view only bookings for their own vendor listing
 *   - Customer: can view only their own bookings (matched by email)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if admin first (admins can view any booking)
    const adminGuard = await requireAdmin();
    if (!adminGuard) {
      // Admin authorized — return full details
      return await fetchBookingDetails(id, req);
    }

    // Not admin — check if vendor or customer
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Fetch the booking to check ownership
    const booking = await getBooking(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check: is this user the vendor who owns the booking?
    // (matched via owner_user_id on the Vendor)
    // For now, allow if the user's email matches the booking's customer email,
    // OR if they're the vendor (checked via vendor ownership).
    // Since we don't have a direct vendor-owner lookup here without an extra query,
    // we allow access if the customer email matches OR admin already passed.
    const userEmail = session.user.email?.toLowerCase();
    const isCustomer = booking.customerEmail.toLowerCase() === userEmail;

    if (!isCustomer) {
      // Check if vendor owns this booking
      // The booking has vendorId — check if this user owns that vendor
      try {
        const { PrismaClient } = await import("@prisma/client");
        const prisma = new PrismaClient();
        const vendor = await prisma.vendor.findFirst({
          where: { id: booking.vendorId, owner_user_id: session.user.id },
          select: { id: true },
        });
        await prisma.$disconnect();
        if (!vendor) {
          return NextResponse.json({ error: "Not authorized to view this booking" }, { status: 403 });
        }
      } catch {
        // If the vendor lookup fails, deny access (fail-safe)
        return NextResponse.json({ error: "Not authorized to view this booking" }, { status: 403 });
      }
    }

    return await fetchBookingDetails(id, req);
  } catch (error: any) {
    console.error("[bookings/[id]] GET failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function fetchBookingDetails(id: string, req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const includeNotes = sp.get("includeNotes") !== "false";
  const includeTimeline = sp.get("includeTimeline") === "true";

  const booking = await getBooking(id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const result: any = { booking };
  if (includeNotes) result.notes = await getBookingNotes(id);
  if (includeTimeline) result.timeline = await getBookingTimeline(id);

  return NextResponse.json(result);
}
