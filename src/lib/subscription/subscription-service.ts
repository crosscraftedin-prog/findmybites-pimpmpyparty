/**
 * Subscription Service — Provider-Agnostic Billing Lifecycle
 *
 * This is the modular billing layer. All subscription lifecycle logic
 * (activation, expiry, renewal, feature gating, history) lives here and
 * is INDEPENDENT of the payment provider.
 *
 * Today: provider = "razorpay_orders" (one-time payments, manual renewal)
 * Future: provider = "razorpay_subscriptions" (AutoPay) or "stripe"
 *
 * When swapping providers, ONLY the payment-creation + verification modules
 * change. This service, the dashboard, billing history, expiry logic, and
 * feature gating remain untouched.
 */

import { db } from "@/lib/db";

// ── Types ────────────────────────────────────────────────────────────────

export type PlanName = "vendor-pro" | "business";
export type PlanTier = "pro" | "business";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "expired" | "cancelled" | "past_due";
export type PaymentProvider = "razorpay_orders" | "razorpay_subscriptions" | "stripe";
export type PaymentType = "new" | "renewal";

export interface PlanConfig {
  planName: PlanName;
  planTier: PlanTier;
  billingCycle: BillingCycle;
  durationDays: number; // 30 for monthly, 365 for yearly
}

export interface ActiveSubscriptionInfo {
  subscriptionId: string;
  vendorId: string;
  planName: PlanName;
  planTier: PlanTier;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  planStartedAt: Date;
  planExpiresAt: Date;
  nextRenewalDate: Date | null;
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean; // < 10 days
  amountPaid: number;
  currency: string;
  provider: PaymentProvider;
}

// ── Plan helpers ─────────────────────────────────────────────────────────

const PLAN_DURATIONS: Record<BillingCycle, number> = {
  monthly: 30,
  yearly: 365,
};

const PLAN_TIERS: Record<PlanName, PlanTier> = {
  "vendor-pro": "pro",
  "business": "business",
};

export function getPlanConfig(planName: PlanName, billingCycle: BillingCycle = "monthly"): PlanConfig {
  return {
    planName,
    planTier: PLAN_TIERS[planName],
    billingCycle,
    durationDays: PLAN_DURATIONS[billingCycle],
  };
}

export function computeExpiry(start: Date, billingCycle: BillingCycle): Date {
  const expiry = new Date(start);
  expiry.setDate(expiry.getDate() + PLAN_DURATIONS[billingCycle]);
  return expiry;
}

/**
 * Generate a human-readable invoice number: FMB-INV-YYYY-NNNNN
 */
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 89999);
  return `FMB-INV-${year}-${random}`;
}

// ── Subscription integrity helpers ───────────────────────────────────────

/**
 * V7.1 INTEGRITY: Expire every OTHER active subscription for a vendor.
 *
 * Guarantees that at most ONE VendorSubscription row can have status="active"
 * per vendor at any time. Must be called inside the same transaction as the
 * row that is BECOMING active, BEFORE that row is set to "active".
 *
 * What this does:
 *   - Finds all rows where vendorId matches AND status="active" AND id != keepId
 *   - Sets them to status="expired"
 *
 * What this does NOT do:
 *   - Does NOT touch rows with status "pending", "cancelled", "past_due", or "expired"
 *   - Does NOT touch the row identified by `keepId` (the one being activated)
 *
 * @param tx  The Prisma transaction client
 * @param vendorId  The vendor whose other active subs should be expired
 * @param keepId  The subscription row ID that is about to become active (excluded)
 */
async function expireOtherActiveSubscriptions(
  tx: any,
  vendorId: string,
  keepId: string
): Promise<number> {
  const result = await tx.vendorSubscription.updateMany({
    where: {
      vendorId,
      status: "active",
      id: { not: keepId },
    },
    data: {
      status: "expired",
    },
  });
  if (result.count > 0) {
  }
  return result.count;
}

// ── Core lifecycle operations ────────────────────────────────────────────

/**
 * Activate a subscription after a VERIFIED payment.
 *
 * Security:
 *   - Caller MUST have already verified the payment signature
 *   - Idempotent: if paymentId already processed, returns the existing subscription
 *   - Does NOT create duplicate vendor records
 *
 * V7: For Razorpay Subscriptions (provider="razorpay_subscriptions"), finds the
 * existing "pending" row by providerSubscriptionId and upgrades it to "active".
 * This row was created in createSubscription() and contains the Razorpay
 * subscription ID needed for lifecycle webhook matching.
 *
 * For Razorpay Orders (provider="razorpay_orders", one-time payment), creates
 * a new row or renews the latest existing subscription for the vendor.
 */
export async function activateSubscription(params: {
  vendorId: string;
  planName: PlanName;
  billingCycle?: BillingCycle;
  orderId: string;
  paymentId: string;
  signature?: string;
  amount: number;
  currency: string;
  provider?: PaymentProvider;
  paymentMethod?: string;
  providerSubscriptionId?: string;
  razorpayCustomerId?: string;
}): Promise<{ subscription: ActiveSubscriptionInfo; paymentType: PaymentType; created: boolean }> {
  const {
    vendorId,
    planName,
    billingCycle = "monthly",
    orderId,
    paymentId,
    signature,
    amount,
    currency,
    provider = "razorpay_orders",
    paymentMethod,
    providerSubscriptionId,
    razorpayCustomerId,
  } = params;

  // ── Idempotency: check if this paymentId was already processed ──
  // This prevents duplicate payment processing (Step 9 security requirement)
  const existingPayment = await db.paymentHistory.findUnique({
    where: { paymentId },
    include: { subscription: true },
  });

  if (existingPayment?.subscription) {
    return {
      subscription: toActiveInfo(existingPayment.subscription),
      paymentType: existingPayment.paymentType as PaymentType,
      created: false,
    };
  }

  const config = getPlanConfig(planName, billingCycle);
  const now = new Date();

  // ── Transaction: subscription + payment history + vendor update must be atomic ──
  // If any operation fails, the entire transaction rolls back.
  const result = await db.$transaction(async (tx) => {
    // ── V7: For subscriptions, find the pending row by providerSubscriptionId ──
    let pendingRow: any = null;
    if (providerSubscriptionId) {
      pendingRow = await tx.vendorSubscription.findFirst({
        where: { providerSubscriptionId },
      });
    }

    let paymentType: PaymentType = "new";
    let subscriptionRow;

    if (pendingRow) {
      // ── V7: Activate the existing pending subscription row ──
      // This row was created in createSubscription() with status="pending".
      // Now that subscription.charged arrived, upgrade it to "active".
      const expiry = computeExpiry(now, billingCycle);

      subscriptionRow = await tx.vendorSubscription.update({
        where: { id: pendingRow.id },
        data: {
          planName,
          planTier: config.planTier,
          billingCycle,
          status: "active",
          planStartedAt: now,
          planExpiresAt: expiry,
          nextRenewalDate: provider === "razorpay_subscriptions" ? expiry : null,
          cancelledAt: null,
          amountPaid: amount,
          currency,
          provider,
          ...(razorpayCustomerId ? { razorpayCustomerId } : {}),
        },
      });
      // V7.1 INTEGRITY: Expire any OTHER active subscriptions for this vendor
      await expireOtherActiveSubscriptions(tx, vendorId, subscriptionRow.id);
      paymentType = pendingRow.status === "pending" ? "new" : "renewal";
    } else {
      // ── Orders flow: check for an existing subscription (renewal vs new) ──
      const existingSub = await tx.vendorSubscription.findFirst({
        where: { vendorId },
        orderBy: { planExpiresAt: "desc" },
      });

      if (existingSub && existingSub.status !== "cancelled" && existingSub.status !== "pending") {
        // ── RENEWAL: extend the existing subscription ──
        paymentType = "renewal";

        const baseDate = existingSub.status === "active" && existingSub.planExpiresAt > now
          ? existingSub.planExpiresAt
          : now;
        const newExpiry = computeExpiry(baseDate, billingCycle);

        subscriptionRow = await tx.vendorSubscription.update({
          where: { id: existingSub.id },
          data: {
            planName,
            planTier: config.planTier,
            billingCycle,
            status: "active",
            planExpiresAt: newExpiry,
            nextRenewalDate: provider === "razorpay_subscriptions" ? newExpiry : null,
            cancelledAt: null,
            amountPaid: amount,
            currency,
            provider,
            ...(providerSubscriptionId ? { providerSubscriptionId } : {}),
            ...(razorpayCustomerId ? { razorpayCustomerId } : {}),
          },
        });
        // V7.1 INTEGRITY: Expire any OTHER active subscriptions for this vendor
        await expireOtherActiveSubscriptions(tx, vendorId, subscriptionRow.id);
      } else {
        // ── NEW subscription ──
        const expiry = computeExpiry(now, billingCycle);
        subscriptionRow = await tx.vendorSubscription.create({
          data: {
            vendorId,
            planName,
            planTier: config.planTier,
            billingCycle,
            status: "active",
            planStartedAt: now,
            planExpiresAt: expiry,
            nextRenewalDate: provider === "razorpay_subscriptions" ? expiry : null,
            amountPaid: amount,
            currency,
            provider,
            ...(providerSubscriptionId ? { providerSubscriptionId } : {}),
            ...(razorpayCustomerId ? { razorpayCustomerId } : {}),
          },
        });
        // V7.1 INTEGRITY: Expire any OTHER active subscriptions for this vendor
        await expireOtherActiveSubscriptions(tx, vendorId, subscriptionRow.id);
      }
    }

    // ── Record the payment in history (immutable, append-only) ──
    const invoiceNumber = generateInvoiceNumber();
    await tx.paymentHistory.create({
      data: {
        vendorId,
        subscriptionId: subscriptionRow.id,
        orderId,
        paymentId,
        invoiceNumber,
        signature,
        planName,
        billingCycle,
        amount,
        currency,
        paymentStatus: "captured",
        provider,
        paymentMethod: paymentMethod ?? null,
        paymentType,
      },
    });

    // ── Sync the legacy Vendor.planExpiresAt field (backward compat) ──
    const vendorUpdate: Record<string, unknown> = {
      planExpiresAt: subscriptionRow.planExpiresAt,
    };
    if (planName === "business" || planName === "vendor-pro") {
      vendorUpdate.featured = true;
    }
    if (planName === "business") {
      vendorUpdate.verified = true;
    }
    await tx.vendor.update({ where: { id: vendorId }, data: vendorUpdate }).catch(() => {});

    return { subscriptionRow, paymentType };
  }).catch(err => {
    // Transaction failed — check if it's a duplicate payment (idempotency)
    throw err;
  });

  return {
    subscription: toActiveInfo(result.subscriptionRow),
    paymentType: result.paymentType,
    created: result.paymentType === "new",
  };
}

/**
 * Get the active subscription for a vendor (or null if none).
 * Auto-expires subscriptions past their expiry date.
 * V7: Skips "pending" rows (created but not yet charged).
 */
export async function getActiveSubscription(vendorId: string): Promise<ActiveSubscriptionInfo | null> {
  const sub = await db.vendorSubscription.findFirst({
    where: { vendorId, status: { not: "pending" } },
    orderBy: { planExpiresAt: "desc" },
  });

  if (!sub) return null;

  // ── Auto-expire: if past expiry and still active, mark expired ──
  const now = new Date();
  if (sub.status === "active" && sub.planExpiresAt < now) {
    await expireSubscription(sub.id, vendorId);
    sub.status = "expired";
  }

  return toActiveInfo(sub);
}

/**
 * Expire a subscription: set status=expired, downgrade vendor to free,
 * keep listing published, lock only premium features.
 */
export async function expireSubscription(subscriptionId: string, vendorId: string): Promise<void> {
  await db.vendorSubscription.update({
    where: { id: subscriptionId },
    data: { status: "expired" },
  });

  // Downgrade vendor: remove premium features but KEEP the listing published
  await db.vendor.update({
    where: { id: vendorId },
    data: {
      featured: false,  // remove priority search + homepage promotion
      verified: false,  // remove verified badge (premium feature)
      // NOTE: planExpiresAt stays as the historical record; status is in the subscription
    },
  }).catch(() => {});

}

/**
 * Cancel a subscription (admin or vendor action). Sets status=cancelled,
 * keeps the listing active until expiry, then it will auto-expire.
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await db.vendorSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
    },
  });
}

/**
 * Manually extend a subscription by N days (admin action).
 */
export async function extendSubscription(subscriptionId: string, days: number): Promise<ActiveSubscriptionInfo | null> {
  const sub = await db.vendorSubscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) return null;

  const base = sub.planExpiresAt > new Date() ? sub.planExpiresAt : new Date();
  const newExpiry = new Date(base);
  newExpiry.setDate(newExpiry.getDate() + days);

  const updated = await db.vendorSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: "active",
      planExpiresAt: newExpiry,
      cancelledAt: null,
    },
  });

  // V7.1 INTEGRITY: Expire any OTHER active subscriptions for this vendor.
  // extendSubscription() is an admin action that sets a row to "active" —
  // we must ensure no other row is also active for the same vendor.
  // Uses db (not tx) since this function is not transactional — the updateMany
  // runs as a separate statement, but the partial unique index (see migration)
  // enforces the constraint at the DB level regardless.
  await db.vendorSubscription.updateMany({
    where: {
      vendorId: sub.vendorId,
      status: "active",
      id: { not: subscriptionId },
    },
    data: { status: "expired" },
  }).catch(() => {});

  // Re-apply premium features
  const vendorUpdate: Record<string, unknown> = { planExpiresAt: newExpiry };
  if (sub.planName === "vendor-pro" || sub.planName === "business") vendorUpdate.featured = true;
  if (sub.planName === "business") vendorUpdate.verified = true;
  await db.vendor.update({ where: { id: sub.vendorId }, data: vendorUpdate }).catch(() => {});

  return toActiveInfo(updated);
}

// ── Feature gating (Step 4) ──────────────────────────────────────────────

export interface FeatureAccess {
  verifiedBadge: boolean;
  prioritySearch: boolean;
  homepagePromotion: boolean;
  advancedAnalytics: boolean;
  unlimitedGallery: boolean;
  aiTools: boolean;
  businessFeatures: boolean;
  planTier: "free" | "pro" | "business";
}

const FREE_ACCESS: FeatureAccess = {
  verifiedBadge: false,
  prioritySearch: false,
  homepagePromotion: false,
  advancedAnalytics: false,
  unlimitedGallery: false,
  aiTools: false,
  businessFeatures: false,
  planTier: "free",
};

const PRO_ACCESS: FeatureAccess = {
  verifiedBadge: false, // verified is business-only
  prioritySearch: true,
  homepagePromotion: true,
  advancedAnalytics: true,
  unlimitedGallery: true,
  aiTools: true,
  businessFeatures: false,
  planTier: "pro",
};

const BUSINESS_ACCESS: FeatureAccess = {
  verifiedBadge: true,
  prioritySearch: true,
  homepagePromotion: true,
  advancedAnalytics: true,
  unlimitedGallery: true,
  aiTools: true,
  businessFeatures: true,
  planTier: "business",
};

/**
 * Check which premium features a vendor can access based on their active subscription.
 * Expired plans lose ALL premium access (downgraded to free).
 */
export async function getFeatureAccess(vendorId: string): Promise<FeatureAccess> {
  const sub = await getActiveSubscription(vendorId);
  if (!sub || sub.isExpired || sub.status !== "active") {
    return FREE_ACCESS;
  }
  if (sub.planTier === "business") return BUSINESS_ACCESS;
  if (sub.planTier === "pro") return PRO_ACCESS;
  return FREE_ACCESS;
}

/**
 * Synchronous feature access check from a known subscription (no DB hit).
 */
export function getFeatureAccessFromSubscription(sub: ActiveSubscriptionInfo | null): FeatureAccess {
  if (!sub || sub.isExpired || sub.status !== "active") return FREE_ACCESS;
  if (sub.planTier === "business") return BUSINESS_ACCESS;
  if (sub.planTier === "pro") return PRO_ACCESS;
  return FREE_ACCESS;
}

// ── Billing history (Step 6) ─────────────────────────────────────────────

export interface PaymentHistoryEntry {
  id: string;
  invoiceNumber: string | null;
  date: Date;
  planName: string;
  billingCycle: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  orderId: string;
  paymentId: string;
  paymentMethod: string | null;
  paymentType: PaymentType;
  provider: string;
}

export async function getPaymentHistory(vendorId: string, limit: number = 50): Promise<PaymentHistoryEntry[]> {
  const rows = await db.paymentHistory.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(r => ({
    id: r.id,
    invoiceNumber: r.invoiceNumber,
    date: r.createdAt,
    planName: r.planName,
    billingCycle: r.billingCycle,
    amount: r.amount,
    currency: r.currency,
    paymentStatus: r.paymentStatus,
    orderId: r.orderId,
    paymentId: r.paymentId,
    paymentMethod: r.paymentMethod,
    paymentType: r.paymentType as PaymentType,
    provider: r.provider,
  }));
}

// ── Admin reports (Step 8) ───────────────────────────────────────────────

export interface AdminSubscriptionReport {
  totalActiveVendors: number;
  expiringIn7Days: number;
  expiredVendors: number;
  monthlyRevenue: { amount: number; currency: string; count: number };
  renewalsThisMonth: number;
}

export async function getAdminSubscriptionReport(): Promise<AdminSubscriptionReport> {
  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeCount, expiringCount, expiredCount, monthlyPayments, monthlyRenewals] = await Promise.all([
    db.vendorSubscription.count({ where: { status: "active" } }),
    db.vendorSubscription.count({
      where: {
        status: "active",
        planExpiresAt: { gte: now, lte: sevenDaysFromNow },
      },
    }),
    db.vendorSubscription.count({ where: { status: "expired" } }),
    db.paymentHistory.aggregate({
      where: { createdAt: { gte: monthStart }, paymentStatus: "captured" },
      _sum: { amount: true },
      _count: true,
    }),
    db.paymentHistory.count({
      where: { createdAt: { gte: monthStart }, paymentType: "renewal", paymentStatus: "captured" },
    }),
  ]);

  return {
    totalActiveVendors: activeCount,
    expiringIn7Days: expiringCount,
    expiredVendors: expiredCount,
    monthlyRevenue: {
      amount: monthlyPayments._sum.amount ?? 0,
      currency: "INR",
      count: monthlyPayments._count,
    },
    renewalsThisMonth: monthlyRenewals,
  };
}

// ── Reminders (Step 7) ───────────────────────────────────────────────────

export interface ReminderEvent {
  vendorId: string;
  subscriptionId: string;
  vendorName: string;
  vendorEmail: string | null;
  planName: string;
  planExpiresAt: Date;
  daysUntilExpiry: number;
  reminderType: "7_days" | "3_days" | "1_day" | "expiry_day";
}

/**
 * Generate reminder events for subscriptions expiring within the threshold.
 * Returns events ready for Email/WhatsApp integration (future).
 *
 * Reminder schedule:
 *   - 7 days before expiry
 *   - 3 days before expiry
 *   - 1 day before expiry
 *   - expiry day
 */
export async function generateExpiryReminders(): Promise<ReminderEvent[]> {
  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // Find active subscriptions expiring within 7 days
  const expiringSubs = await db.vendorSubscription.findMany({
    where: {
      status: "active",
      planExpiresAt: { gte: now, lte: sevenDaysFromNow },
    },
    include: {
      vendor: { select: { name: true, userEmail: true } },
    },
  });

  const events: ReminderEvent[] = [];
  for (const sub of expiringSubs) {
    const daysUntilExpiry = Math.ceil((sub.planExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let reminderType: ReminderEvent["reminderType"] | null = null;
    if (daysUntilExpiry <= 0) reminderType = "expiry_day";
    else if (daysUntilExpiry <= 1) reminderType = "1_day";
    else if (daysUntilExpiry <= 3) reminderType = "3_days";
    else if (daysUntilExpiry <= 7) reminderType = "7_days";

    if (reminderType) {
      events.push({
        vendorId: sub.vendorId,
        subscriptionId: sub.id,
        vendorName: sub.vendor.name,
        vendorEmail: sub.vendor.userEmail,
        planName: sub.planName,
        planExpiresAt: sub.planExpiresAt,
        daysUntilExpiry,
        reminderType,
      });
    }
  }

  return events;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function toActiveInfo(row: any): ActiveSubscriptionInfo {
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((row.planExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  return {
    subscriptionId: row.id,
    vendorId: row.vendorId,
    planName: row.planName as PlanName,
    planTier: row.planTier as PlanTier,
    billingCycle: row.billingCycle as BillingCycle,
    status: row.status as SubscriptionStatus,
    planStartedAt: row.planStartedAt,
    planExpiresAt: row.planExpiresAt,
    nextRenewalDate: row.nextRenewalDate,
    daysRemaining,
    isExpired: row.planExpiresAt < now || row.status === "expired",
    isExpiringSoon: daysRemaining <= 10 && daysRemaining > 0 && row.status === "active",
    amountPaid: row.amountPaid,
    currency: row.currency,
    provider: row.provider as PaymentProvider,
  };
}
