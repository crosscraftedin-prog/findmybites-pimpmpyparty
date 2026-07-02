import { NextRequest, NextResponse } from "next/server";
import { generateExpiryReminders } from "@/lib/subscription/subscription-service";

/**
 * GET /api/subscriptions/reminders
 *
 * Generates reminder events for subscriptions expiring within 7 days.
 * Returns events ready for Email/WhatsApp integration (future).
 *
 * Reminder schedule:
 *   - 7 days before expiry
 *   - 3 days before expiry
 *   - 1 day before expiry
 *   - expiry day
 *
 * This endpoint is designed to be called by a cron job (Vercel Cron,
 * GitHub Actions, or any scheduler) once daily.
 *
 * Future: integrate with an email provider (Resend/SendGrid) and WhatsApp
 * Business API. The ReminderEvent structure is provider-agnostic.
 */
export async function GET(req: NextRequest) {
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
