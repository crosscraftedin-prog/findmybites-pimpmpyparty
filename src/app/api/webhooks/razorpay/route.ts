import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, processWebhookEvent } from "@/lib/billing";
import { logger } from "@/lib/logger";

/**
 * POST /api/webhooks/razorpay
 *
 * Razorpay webhook handler for subscription events.
 *
 * Security:
 *   - Verifies webhook signature using RAZORPAY_WEBHOOK_SECRET
 *   - Idempotent: each event processed only once (via WebhookLog table)
 *   - Never trusts frontend — all data comes from Razorpay
 *
 * Handled events:
 *   - subscription.activated  → logs, waits for first charge
 *   - subscription.charged     → activates/renews subscription
 *   - subscription.cancelled   → marks subscription as cancelled
 *   - subscription.completed   → marks subscription as expired
 *   - subscription.paused      → marks subscription as paused
 *   - subscription.resumed     → marks subscription as active
 *   - payment.failed           → marks subscription as past_due
 *   - payment.authorized       → logged (no action)
 *   - payment.captured         → logged (handled by subscription.charged)
 *
 * Database:
 *   - Logs every webhook to WebhookLog table (immutable audit trail)
 *   - Updates VendorSubscription table
 *   - Creates PaymentHistory entries
 */

export async function POST(req: NextRequest) {
  try {
    // ── 1. Get the raw body and signature ──
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    // ── 2. Verify webhook secret is configured ──
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[webhook] RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 503 }
      );
    }

    // ── 3. Verify signature ──
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error("[webhook] Signature verification failed");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // ── 4. Parse the payload ──
    const payload = JSON.parse(body);
    const event = payload.event as string;

    // ── 5. Generate a deterministic event ID ──
    // Use payment ID for payment events, subscription ID + event for subscription events
    const deterministicEventId =
      payload.payload?.payment?.entity?.id ||
      `${payload.payload?.subscription?.entity?.id}_${event}` ||
      `unknown_${Date.now()}`;

    logger.info("webhook", `Received: ${event}`, { eventId: deterministicEventId });

    // ── 6. Process the event (idempotent via WebhookLog table) ──
    await processWebhookEvent(payload, deterministicEventId);

    // ── 7. Return success ──
    return NextResponse.json({ status: "ok", event });
  } catch (error: any) {
    console.error("[webhook] Error:", error.message);
    return NextResponse.json(
      { error: `Webhook processing failed: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/razorpay
 * Health check endpoint — confirms the webhook route is reachable.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Razorpay webhook handler is active",
    configured: !!process.env.RAZORPAY_WEBHOOK_SECRET,
  });
}
