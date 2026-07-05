import { NextRequest, NextResponse } from "next/server";
import { generateExpiryReminders } from "@/lib/subscription/subscription-service";

/**
 * GET /api/subscriptions/reminders
 *
 * Generates reminder events for subscriptions expiring within 7 days.
 * Returns events ready for Email/WhatsApp integration (future).
 *
 * Protected by CRON_SECRET: the Authorization header must be
 * `Bearer <CRON_SECRET>`. If CRON_SECRET is not set (dev), the endpoint
 * is open but logs a warning.
 *
 * Reminder schedule:
 *   - 7 days before expiry
 *   - 3 days before expiry
 *   - 1 day before expiry
 *   - expiry day
 *
 * This endpoint is designed to be called by a cron job (Vercel Cron,
 * GitHub Actions, or any scheduler) once daily.
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
    const events = await generateExpiryReminders();

    // Group by reminder type for easy logging/processing
    const grouped = {
      seven_days: events.filter(e => e.reminderType === "7_days"),
      three_days: events.filter(e => e.reminderType === "3_days"),
      one_day: events.filter(e => e.reminderType === "1_day"),
      expiry_day: events.filter(e => e.reminderType === "expiry_day"),
    };

    console.log(
      `[reminders] Generated ${events.length} reminder events: ` +
      `${grouped.seven_days.length} (7d), ${grouped.three_days.length} (3d), ` +
      `${grouped.one_day.length} (1d), ${grouped.expiry_day.length} (expiry day)`
    );

    // TODO (future): send emails via Resend/SendGrid
    // TODO (future): send WhatsApp messages via WhatsApp Business API
    // For now, events are returned so the caller can process them.

    return NextResponse.json({
      total: events.length,
      events,
      grouped,
      // Metadata for the future email/WhatsApp integration
      channels: {
        email: { configured: !!process.env.RESEND_API_KEY, sent: 0 },
        whatsapp: { configured: !!process.env.WHATSAPP_TOKEN, sent: 0 },
      },
    });
  } catch (error: any) {
    console.error("[reminders] GET failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
