import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCustomerDashboard } from "@/lib/customers/customer-dashboard";
import { logger } from "@/lib/logger";

/**
 * GET /api/customer/dashboard
 *
 * The V7 Customer Dashboard — aggregates everything about a customer:
 *   - My Enquiries (bookings/leads with lead scores + AI summaries)
 *   - My Events (ConciergeEvents with countdowns)
 *   - Wishlist (saved vendors + products with names/images)
 *   - Quotes Received (vendor quotes with status)
 *   - Recommendations (AI-ranked vendors based on last enquiry)
 *   - Stats (totals + pending quotes)
 *
 * Authentication: Supabase session required.
 * The customer is identified by their email (used across Booking,
 * ConciergeEvent, and Wishlist tables).
 *
 * This is the missing piece that makes FindMyBites customer-first:
 * customers can see all their enquiries, events, quotes, and saved
 * items in one place — without leaving the platform.
 */

export async function GET(req: NextRequest) {
  try {
    // Authenticate
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
        if (session?.user?.id) {
          userId = session.user.id;
          userEmail = session.user.email ?? null;
        }
      } catch {}
    }

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const dashboard = await getCustomerDashboard(userEmail, userId);

    logger.info("customer-dashboard-api", "Dashboard served", {
      userId,
      stats: dashboard.stats,
    });

    return NextResponse.json(dashboard);
  } catch (error: any) {
    logger.error("customer-dashboard-api", "GET failed", error, { message: error.message });
    return NextResponse.json(
      { error: `Failed to load dashboard: ${error.message}` },
      { status: 500 }
    );
  }
}
