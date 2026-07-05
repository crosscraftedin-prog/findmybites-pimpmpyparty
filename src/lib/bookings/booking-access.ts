/**
 * Booking Access Helper — BOLA (Broken Object-Level Authorization) fix.
 * ───────────────────────────────────────────────────────────────────────────
 * Centralizes the ownership check for individual booking routes:
 *   /api/bookings/[id]
 *   /api/bookings/[id]/timeline
 *   /api/bookings/[id]/notes
 *
 * Authorization ladder:
 *   1. Admin  → full access to any booking
 *   2. Vendor → access only if they own the vendor listing tied to the booking
 *   3. Customer → access only if their session email matches the booking's customer email
 *
 * Returns null if authorized, or a NextResponse (401/403/404) if not.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function verifyBookingAccess(bookingId: string): Promise<NextResponse | null> {
  // 1. Admin bypass
  const adminGuard = await requireAdmin();
  if (!adminGuard) return null; // authorized as admin

  // 2. Must be authenticated
  const supabase = await createSupabaseServerClient();
  let userId: string | null = null;
  let userEmail: string | null = null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) { userId = user.id; userEmail = user.email ?? null; }
  } catch {}
  if (!userId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) { userId = session.user.id; userEmail = session.user.email ?? null; }
    } catch {}
  }
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // 3. Fetch the booking to check ownership
  const booking = await db.bookingV2.findUnique({
    where: { id: bookingId },
    select: { id: true, vendorId: true, customerEmail: true },
  }).catch(() => null);

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // 4. Customer match (email)
  if (userEmail && booking.customerEmail?.toLowerCase() === userEmail.toLowerCase()) {
    return null; // authorized as customer
  }

  // 5. Vendor ownership (session user owns the vendor listing)
  const vendor = await db.vendor.findFirst({
    where: { id: booking.vendorId, owner_user_id: userId },
    select: { id: true },
  }).catch(() => null);

  if (vendor) {
    return null; // authorized as vendor
  }

  // 6. Deny
  return NextResponse.json({ error: "Not authorized to access this booking" }, { status: 403 });
}
