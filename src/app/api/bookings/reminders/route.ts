import { NextRequest, NextResponse } from "next/server";
import { getBookingsNeeding24hReminders, generateBookingNotification } from "@/lib/bookings/booking-service";

/**
 * GET /api/bookings/reminders — 24h reminder events (cron-ready)
 *
 * Protected by CRON_SECRET: the Authorization header must be
 * `Bearer <CRON_SECRET>`. If CRON_SECRET is not set (dev), the endpoint
 * is open but logs a warning.
 */
export async function GET(req: NextRequest) {
  // ── CRON_SECRET authorization ──
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const bookings = await getBookingsNeeding24hReminders();
    const notifications = await Promise.all(
      bookings.map(b => generateBookingNotification(b.id, "reminder_24h").catch(() => null))
    );
    const valid = notifications.filter(Boolean);
    return NextResponse.json({
      total: valid.length,
      notifications: valid,
      channels: {
        email: { configured: !!process.env.RESEND_API_KEY, sent: 0 },
        whatsapp: { configured: !!process.env.WHATSAPP_TOKEN, sent: 0 },
        push: { configured: !!process.env.FCM_SERVER_KEY, sent: 0 },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
