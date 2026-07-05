import { NextRequest, NextResponse } from "next/server";
import { getCustomerBookings } from "@/lib/bookings/booking-service";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/bookings/customer/[email] — customer's bookings.
 *
 * Authorization: admin can view any customer's bookings; customers can only
 * view their own (email in URL must match their session email).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  try {
    const { email } = await params;
    const decodedEmail = decodeURIComponent(email);

    // ── Authorization ──
    const adminGuard = await requireAdmin();
    if (adminGuard) {
      // Not admin — the URL email must match the authenticated user's email
      const supabase = await createSupabaseServerClient();
      let sessionEmail: string | null = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        sessionEmail = user?.email ?? null;
      } catch {}
      if (!sessionEmail) {
        const { data: { session } } = await supabase.auth.getSession();
        sessionEmail = session?.user?.email ?? null;
      }
      if (!sessionEmail) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      if (sessionEmail.toLowerCase() !== decodedEmail.toLowerCase()) {
        return NextResponse.json({ error: "Not authorized to view these bookings" }, { status: 403 });
      }
    }

    const bookings = await getCustomerBookings(decodedEmail);
    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
