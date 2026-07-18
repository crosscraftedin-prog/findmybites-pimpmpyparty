/**
 * Billing Module — Webhooks
 *
 * Webhook processing utilities.
 * The actual webhook route is at /api/webhooks/razorpay.
 * This module provides the processing logic + DB logging.
 */

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { activateSubscriptionFromWebhook, cancelSubscription as cancelRzpSub } from "./subscriptions";

// ── Types ────────────────────────────────────────────────────────────────

interface WebhookPayload {
  entity: string;
  event: string;
  contains: string[];
  payload: {
    subscription?: {
      entity: {
        id: string;
        status: string;
        plan_id: string;
        current_start: number;
        current_end: number;
        ended_at: number | null;
        payment_method?: string;
        customer_id?: string;  // V7: present when subscription is created with a customer
        notes?: Record<string, string>;
      };
    };
    payment?: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        method: string;
        status: string;
        error_code?: string;
        error_description?: string;
      };
    };
  };
}

// ── Idempotency ──────────────────────────────────────────────────────────

/**
 * Check if a webhook event has already been processed.
 * Uses the WebhookLog table's unique eventId.
 */
export async function isEventProcessed(eventId: string): Promise<boolean> {
  const existing = await db.webhookLog.findUnique({
    where: { eventId },
    select: { id: true, processed: true },
  }).catch(() => null);
  return !!existing?.processed;
}

/**
 * Log a webhook event to the database (for audit trail).
 */
export async function logWebhookEvent(params: {
  eventId: string;
  eventType: string;
  entity: string;
  entityId?: string;
  payload: any;
  signature?: string;
}): Promise<void> {
  try {
    await db.webhookLog.create({
      data: {
        eventId: params.eventId,
        eventType: params.eventType,
        entity: params.entity,
        entityId: params.entityId,
        payload: params.payload,
        signature: params.signature,
        processed: false,
      },
    });
  } catch (err: any) {
    // Duplicate eventId = already logged (idempotent)
    if (err?.code === "P2002") return;
    throw err;
  }
}

/**
 * Mark a webhook event as processed.
 */
export async function markEventProcessed(eventId: string, error?: string): Promise<void> {
  await db.webhookLog.updateMany({
    where: { eventId },
    data: {
      processed: error ? false : true,
      processedAt: error ? undefined : new Date(),
      error: error || null,
    },
  }).catch(() => {});
}

// ── Event Handlers ───────────────────────────────────────────────────────

export async function processWebhookEvent(
  payload: WebhookPayload,
  eventId: string
): Promise<void> {
  const event = payload.event;

  // Check idempotency
  if (await isEventProcessed(eventId)) {
    logger.info("webhook", "Event already processed — skipping", { eventId, event });
    return;
  }

  // Log the event
  await logWebhookEvent({
    eventId,
    eventType: event,
    entity: payload.entity,
    entityId: payload.payload.subscription?.entity?.id || payload.payload.payment?.entity?.id,
    payload,
  });

  try {
    switch (event) {
      case "subscription.charged":
        await handleSubscriptionCharged(payload, eventId);
        break;
      case "subscription.cancelled":
        await handleSubscriptionCancelled(payload, eventId);
        break;
      case "subscription.completed":
        await handleSubscriptionCompleted(payload, eventId);
        break;
      case "subscription.paused":
        await handleSubscriptionPaused(payload, eventId);
        break;
      case "subscription.resumed":
        await handleSubscriptionResumed(payload, eventId);
        break;
      case "payment.failed":
        await handlePaymentFailed(payload, eventId);
        break;
      case "subscription.halted":
        await handleSubscriptionHalted(payload, eventId);
        break;
      case "subscription.activated":
      case "subscription.authenticated":
        // V7: Save the providerSubscriptionId so lifecycle webhooks can find it.
        // These events fire when the subscription is created/authenticated,
        // BEFORE the first charge. The pending row may already exist (created
        // in createSubscription()), so this is an idempotent upsert.
        await handleSubscriptionCreatedEvent(payload, eventId, event);
        break;
      case "subscription.pending":
      case "subscription.updated":
      case "order.paid":
      case "invoice.paid":
      case "payment.authorized":
      case "payment.captured":
        logger.info("webhook", `${event} (no action needed)`, { eventId });
        break;
      case "refund.created":
      case "refund.processed":
      case "refund.failed":
        await handleRefundEvent(payload, eventId, event);
        break;
      default:
        logger.warn("webhook", `Unhandled event: ${event}`, { eventId });
    }

    await markEventProcessed(eventId);
  } catch (err: any) {
    await markEventProcessed(eventId, err.message);
    throw err;
  }
}

/**
 * V7: Handle subscription.activated / subscription.authenticated.
 *
 * These events fire when:
 *   - subscription.activated: The subscription goes live (mandate registered)
 *   - subscription.authenticated: The customer authenticates the mandate (UPI PIN)
 *
 * We save/upsert the providerSubscriptionId here as a safety net. If the
 * subscription was created via createSubscription(), the pending row already
 * exists — this is a no-op. If the webhook arrives before the API response
 * (race condition), this creates the pending row.
 */
async function handleSubscriptionCreatedEvent(
  payload: WebhookPayload,
  eventId: string,
  event: string
): Promise<void> {
  const sub = payload.payload.subscription?.entity;
  if (!sub) return;

  const notes = sub.notes || {};
  const vendorId = notes.vendorId;
  const planName = notes.planName as any;
  const billingCycle = (notes.billingCycle as any) || "monthly";
  const countryCode = notes.countryCode || "US";
  const razorpayCustomerId = notes.razorpayCustomerId || sub.customer_id || null;

  if (!vendorId || !planName) {
    logger.warn("webhook", `${event} missing vendor/plan in notes`, { subId: sub.id });
    return;
  }

  // ── Idempotent upsert: if the row exists, do nothing; if not, create pending ──
  const existing = await db.vendorSubscription.findFirst({
    where: { providerSubscriptionId: sub.id },
    select: { id: true, status: true },
  }).catch(() => null);

  if (existing) {
    logger.info("webhook", `${event} — pending row already exists`, { subId: sub.id, dbId: existing.id });
    return;
  }

  // Row doesn't exist (race condition or subscription created outside our flow).
  // Create a pending row so lifecycle events can find it.
  const planTier = planName === "business" ? "business" : "pro";
  const now = new Date();
  const placeholderExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    await db.vendorSubscription.create({
      data: {
        vendorId,
        planName,
        planTier,
        billingCycle,
        status: "pending",
        planStartedAt: now,
        planExpiresAt: placeholderExpiry,
        provider: "razorpay_subscriptions",
        providerSubscriptionId: sub.id,
        razorpayCustomerId,
        amountPaid: 0,
        currency: "INR",
      },
    });
    logger.info("webhook", `${event} — created pending row from webhook`, { subId: sub.id });
  } catch (err: any) {
    if (err?.code === "P2002") return; // Unique constraint — already created
    logger.error("webhook", `${event} — failed to create pending row`, { error: err.message });
  }
}

async function handleSubscriptionCharged(payload: WebhookPayload, eventId: string): Promise<void> {
  const sub = payload.payload.subscription?.entity;
  const payment = payload.payload.payment?.entity;
  if (!sub || !payment) return;

  const notes = sub.notes || {};
  const vendorId = notes.vendorId;
  const planName = notes.planName as any;
  const billingCycle = notes.billingCycle as any;
  const razorpayCustomerId = notes.razorpayCustomerId || sub.customer_id || undefined;

  if (!vendorId || !planName) {
    logger.warn("webhook", "subscription.charged missing vendor/plan in notes", { subId: sub.id });
    return;
  }

  logger.info("webhook", "subscription.charged", {
    vendorId,
    paymentId: payment.id,
    subscriptionId: sub.id,
  });

  await activateSubscriptionFromWebhook({
    vendorId,
    planName,
    billingCycle: billingCycle || "monthly",
    orderId: payment.order_id || sub.id,
    paymentId: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    paymentMethod: payment.method,
    providerSubscriptionId: sub.id,        // ← V7: pass through
    razorpayCustomerId,                     // ← V7: pass through
  });
}

async function handleSubscriptionCancelled(payload: WebhookPayload, eventId: string): Promise<void> {
  const sub = payload.payload.subscription?.entity;
  if (!sub) return;

  const notes = sub.notes || {};
  const vendorId = notes.vendorId;

  const dbSub = await db.vendorSubscription.findFirst({
    where: { providerSubscriptionId: sub.id },
    select: { id: true, vendorId: true },
  }).catch(() => null);

  if (dbSub) {
    await db.vendorSubscription.update({
      where: { id: dbSub.id },
      data: { status: "cancelled", cancelledAt: new Date() },
    }).catch(() => {});
    logger.info("webhook", "subscription.cancelled — DB updated", { dbSubId: dbSub.id });
  }
}

async function handleSubscriptionCompleted(payload: WebhookPayload, eventId: string): Promise<void> {
  const sub = payload.payload.subscription?.entity;
  if (!sub) return;

  const dbSub = await db.vendorSubscription.findFirst({
    where: { providerSubscriptionId: sub.id },
    select: { id: true },
  }).catch(() => null);

  if (dbSub) {
    await db.vendorSubscription.update({
      where: { id: dbSub.id },
      data: { status: "expired" },
    }).catch(() => {});
  }
}

async function handleSubscriptionPaused(payload: WebhookPayload, eventId: string): Promise<void> {
  const sub = payload.payload.subscription?.entity;
  if (!sub) return;

  const dbSub = await db.vendorSubscription.findFirst({
    where: { providerSubscriptionId: sub.id },
    select: { id: true },
  }).catch(() => null);

  if (dbSub) {
    await db.vendorSubscription.update({
      where: { id: dbSub.id },
      data: { status: "cancelled", cancelledAt: new Date() },
    }).catch(() => {});
  }
}

async function handleSubscriptionResumed(payload: WebhookPayload, eventId: string): Promise<void> {
  const sub = payload.payload.subscription?.entity;
  if (!sub) return;

  const dbSub = await db.vendorSubscription.findFirst({
    where: { providerSubscriptionId: sub.id },
    select: { id: true, vendorId: true },
  }).catch(() => null);

  if (dbSub) {
    await db.vendorSubscription.update({
      where: { id: dbSub.id },
      data: { status: "active", cancelledAt: null },
    }).catch(() => {});

    // V7.1 INTEGRITY: Expire any OTHER active subscriptions for this vendor.
    // subscription.resumed sets this row to "active" — ensure no other row
    // is also active. The partial unique index enforces this at the DB level,
    // but we expire previous active rows first to avoid a constraint violation.
    await db.vendorSubscription.updateMany({
      where: {
        vendorId: dbSub.vendorId,
        status: "active",
        id: { not: dbSub.id },
      },
      data: { status: "expired" },
    }).catch(() => {});
  }
}

async function handlePaymentFailed(payload: WebhookPayload, eventId: string): Promise<void> {
  const payment = payload.payload.payment?.entity;
  const sub = payload.payload.subscription?.entity;
  if (!payment) return;

  logger.warn("webhook", "payment.failed", {
    paymentId: payment.id,
    errorCode: payment.error_code,
    subscriptionId: sub?.id,
  });

  // V7: Look up by subscription ID (preferred) or order ID (fallback)
  let dbSub: any = null;
  if (sub?.id) {
    dbSub = await db.vendorSubscription.findFirst({
      where: { providerSubscriptionId: sub.id },
      select: { id: true, vendorId: true },
    }).catch(() => null);
  }
  if (!dbSub && payment.order_id) {
    // Orders flow fallback: search by orderId in payment history
    const ph = await db.paymentHistory.findFirst({
      where: { orderId: payment.order_id },
      select: { subscriptionId: true, vendorId: true },
    }).catch(() => null);
    if (ph?.subscriptionId) {
      dbSub = await db.vendorSubscription.findUnique({
        where: { id: ph.subscriptionId },
        select: { id: true, vendorId: true },
      }).catch(() => null);
    }
  }

  if (dbSub) {
    await db.vendorSubscription.update({
      where: { id: dbSub.id },
      data: { status: "past_due" },
    }).catch(() => {});

    // Record the failed payment
    try {
      await db.paymentHistory.create({
        data: {
          vendorId: dbSub.vendorId,
          subscriptionId: dbSub.id,
          orderId: payment.order_id,
          paymentId: payment.id,
          planName: "unknown",
          billingCycle: "monthly",
          amount: payment.amount,
          currency: payment.currency,
          paymentStatus: "failed",
          provider: "razorpay_subscriptions",
          paymentMethod: payment.method,
          paymentType: "renewal",
        },
      });
    } catch (err: any) {
      if (err?.code !== "P2002") throw err; // Ignore duplicate
    }
  }
}

/**
 * Handle subscription.halted — Razorpay stopped retrying after all attempts failed.
 */
async function handleSubscriptionHalted(payload: WebhookPayload, eventId: string): Promise<void> {
  const sub = payload.payload.subscription?.entity;
  if (!sub) return;

  logger.warn("webhook", "subscription.halted — all retries exhausted", { subId: sub.id });

  const dbSub = await db.vendorSubscription.findFirst({
    where: { providerSubscriptionId: sub.id },
    select: { id: true, vendorId: true },
  }).catch(() => null);

  if (dbSub) {
    await db.vendorSubscription.update({
      where: { id: dbSub.id },
      data: { status: "expired" },
    }).catch(() => {});
    await db.vendor.update({
      where: { id: dbSub.vendorId },
      data: { featured: false, verified: false },
    }).catch(() => {});
  }
}

/**
 * Handle refund events — update payment history status.
 */
async function handleRefundEvent(payload: WebhookPayload, eventId: string, event: string): Promise<void> {
  const payment = payload.payload.payment?.entity;
  if (!payment) return;

  logger.info("webhook", `Refund event: ${event}`, { paymentId: payment.id });

  const existingPayment = await db.paymentHistory.findUnique({
    where: { paymentId: payment.id },
    select: { id: true },
  }).catch(() => null);

  if (existingPayment) {
    const newStatus = event === "refund.processed" ? "refunded" :
                      event === "refund.failed" ? "captured" : "refunded";
    await db.paymentHistory.update({
      where: { id: existingPayment.id },
      data: { paymentStatus: newStatus },
    }).catch(() => {});
  }
}
