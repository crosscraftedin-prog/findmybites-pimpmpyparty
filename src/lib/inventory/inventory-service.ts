/**
 * Inventory & Availability Service
 * ───────────────────────────────────────────────────────────────────────────
 * Production-grade inventory management for FindMyBites (food) and
 * PimpMyParty (event packages).
 *
 * Guarantees:
 *  • All stock mutations run inside database transactions.
 *  • Overselling is impossible: decrement uses a conditional WHERE
 *    (stockCount >= qty) and verifies the affected-rows count.
 *  • Auto status transition: when stock hits 0 → status = "out_of_stock".
 *  • Booking-notice & availability validation before any booking is accepted.
 *  • Daily-order caps (maxOrdersPerDay) enforce "Fully Booked".
 *  • Calendar blocks (holidays / vacations / fully-booked) are honoured.
 *
 * Designed to scale to thousands of products — every hot query is indexed.
 */
import { db } from "@/lib/db";

// ── Status taxonomy ──────────────────────────────────────────────────────────
export const PRODUCT_STATUSES = [
  "active",
  "draft",
  "out_of_stock",
  "temporarily_unavailable",
  "seasonal",
  "archived",
] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export interface StatusMeta {
  label: string;
  className: string;
  dot: string;
}

export const STATUS_META: Record<ProductStatus, StatusMeta> = {
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  out_of_stock: {
    label: "Out of Stock",
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
    dot: "bg-red-500",
  },
  temporarily_unavailable: {
    label: "Temporarily Unavailable",
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  seasonal: {
    label: "Seasonal",
    className: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800",
    dot: "bg-violet-500",
  },
  archived: {
    label: "Archived",
    className: "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700",
    dot: "bg-zinc-400",
  },
};

// ── Preparation time ──────────────────────────────────────────────────────────
export const PREPARATION_TIMES: { value: string; label: string; hours: number }[] = [
  { value: "same_day", label: "Same Day", hours: 0 },
  { value: "24_hours", label: "24 Hours", hours: 24 },
  { value: "2_days", label: "2 Days", hours: 48 },
  { value: "3_days", label: "3 Days", hours: 72 },
  { value: "1_week", label: "1 Week", hours: 168 },
  { value: "custom", label: "Custom", hours: -1 },
];

export function prepTimeLabel(product: {
  preparationTimeCategory?: string | null;
  preparationTimeCustom?: string | null;
  prepTime?: string | null;
}): string | null {
  if (product.preparationTimeCategory && product.preparationTimeCategory !== "custom") {
    const found = PREPARATION_TIMES.find((t) => t.value === product.preparationTimeCategory);
    if (found) return found.label;
  }
  if (product.preparationTimeCategory === "custom" && product.preparationTimeCustom) {
    return product.preparationTimeCustom;
  }
  return product.prepTime ?? null;
}

// ── Booking notice presets ────────────────────────────────────────────────────
export const BOOKING_NOTICE_PRESETS: { value: string; label: string; hours: number }[] = [
  { value: "2", label: "2 hours", hours: 2 },
  { value: "24", label: "24 hours", hours: 24 },
  { value: "48", label: "48 hours", hours: 48 },
  { value: "168", label: "7 days", hours: 168 },
];

// ── Availability modes ────────────────────────────────────────────────────────
export const AVAILABILITY_MODES = [
  { value: "always", label: "Always Available" },
  { value: "selected_days", label: "Available on Selected Days" },
  { value: "date_range", label: "Available During Date Range" },
] as const;

export const WEEKDAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export function weekdayCode(d: Date): string {
  return WEEKDAY_CODES[d.getDay()];
}

// ── Service area ──────────────────────────────────────────────────────────────
export const SERVICE_AREA_TYPES = [
  { value: "local", label: "Local" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "country", label: "Country" },
  { value: "worldwide", label: "Worldwide" },
] as const;

// ── Calendar block types ──────────────────────────────────────────────────────
export const BLOCK_TYPES = [
  { value: "holiday", label: "Holiday" },
  { value: "vacation", label: "Vacation" },
  { value: "fully_booked", label: "Fully Booked" },
  { value: "manual", label: "Manual Block" },
  { value: "maintenance", label: "Maintenance" },
] as const;

// ───────────────────────────────────────────────────────────────────────────
// AVAILABILITY CHECKING
// ───────────────────────────────────────────────────────────────────────────

export interface AvailabilityResult {
  available: boolean;
  reason:
    | "ok"
    | "draft"
    | "archived"
    | "force_hidden"
    | "out_of_stock"
    | "temporarily_unavailable"
    | "not_in_date_range"
    | "not_available_on_day"
    | "date_blocked"
    | "fully_booked_day"
    | "insufficient_notice"
    | "season_ended"
    | "season_not_started";
  message: string;
  nextAvailableDate?: string | null;
}

/**
 * Full availability check for a product on a requested booking date.
 * Pure read operation — safe to call from public endpoints.
 */
export async function checkAvailability(
  productId: string,
  requestedDate: Date,
  qty: number = 1
): Promise<AvailabilityResult> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      status: true,
      stockType: true,
      stockCount: true,
      isAvailable: true,
      availabilityMode: true,
      availableDays: true,
      availabilityStart: true,
      availabilityEnd: true,
      bookingNoticeHours: true,
      maxOrdersPerDay: true,
      forceHidden: true,
    },
  });

  if (!product) {
    return { available: false, reason: "force_hidden", message: "Product not found." };
  }

  if (product.forceHidden) {
    return { available: false, reason: "force_hidden", message: "This listing is currently unavailable." };
  }
  if (product.status === "archived") {
    return { available: false, reason: "archived", message: "This product has been archived." };
  }
  if (product.status === "draft") {
    return { available: false, reason: "draft", message: "This product is not yet published." };
  }
  if (product.status === "temporarily_unavailable") {
    return { available: false, reason: "temporarily_unavailable", message: "Temporarily unavailable by the vendor." };
  }

  if (product.status === "out_of_stock" || (product.stockType === "limited" && (product.stockCount ?? 0) < qty)) {
    return { available: false, reason: "out_of_stock", message: "Out of stock." };
  }

  if (product.bookingNoticeHours && product.bookingNoticeHours > 0) {
    const minTime = new Date(Date.now() + product.bookingNoticeHours * 3600 * 1000);
    if (requestedDate.getTime() < minTime.getTime()) {
      return {
        available: false,
        reason: "insufficient_notice",
        message: `Requires at least ${formatHours(product.bookingNoticeHours)} advance notice.`,
      };
    }
  }

  if (product.availabilityMode === "date_range") {
    const start = product.availabilityStart;
    const end = product.availabilityEnd;
    if (start && requestedDate < start) {
      return { available: false, reason: "season_not_started", message: `Available from ${fmtDate(start)}.` };
    }
    if (end && requestedDate > end) {
      return { available: false, reason: "season_ended", message: `This seasonal offering ended on ${fmtDate(end)}.` };
    }
  }

  if (product.availabilityMode === "selected_days") {
    const days: string[] = product.availableDays ? safeParse(product.availableDays, []) : [];
    if (days.length > 0 && !days.includes(weekdayCode(requestedDate))) {
      return {
        available: false,
        reason: "not_available_on_day",
        message: `Available only on ${days.join(", ")}.`,
      };
    }
  }

  const dayStart = startOfDay(requestedDate);
  const dayEnd = endOfDay(requestedDate);
  const block = await db.productBlockedDate.findFirst({
    where: {
      productId,
      startDate: { lte: dayEnd },
      endDate: { gte: dayStart },
    },
    select: { blockType: true, note: true, endDate: true },
  });
  if (block) {
    return {
      available: false,
      reason: "date_blocked",
      message: block.note || `Blocked (${block.blockType.replace("_", " ")}).`,
    };
  }

  if (product.maxOrdersPerDay && product.maxOrdersPerDay > 0) {
    const confirmedToday = await countConfirmedBookingsOnDate(productId, dayStart, dayEnd);
    if (confirmedToday >= product.maxOrdersPerDay) {
      return { available: false, reason: "fully_booked_day", message: "Fully booked on this date." };
    }
  }

  return { available: true, reason: "ok", message: "Available" };
}

/**
 * Find the next available date starting from `from`, scanning up to `maxDays` ahead.
 */
export async function findNextAvailableDate(
  productId: string,
  from: Date = new Date(),
  maxDays: number = 60
): Promise<string | null> {
  const cursor = new Date(from);
  for (let i = 0; i <= maxDays; i++) {
    const check = new Date(cursor);
    check.setDate(check.getDate() + i);
    const result = await checkAvailability(productId, check, 1);
    if (result.available) return check.toISOString();
  }
  return null;
}

// ───────────────────────────────────────────────────────────────────────────
// STOCK MUTATIONS (transactional, oversell-proof)
// ───────────────────────────────────────────────────────────────────────────

export interface DecrementResult {
  ok: boolean;
  remaining: number | null;
  message: string;
}

/**
 * Atomically decrement stock for a product by `qty`.
 * Uses a conditional UPDATE … WHERE stockCount >= qty inside a transaction.
 * If zero rows are updated, the stock was insufficient → oversell prevented.
 *
 * After decrement, if remaining hits 0 the status is flipped to "out_of_stock".
 */
export async function decrementStock(productId: string, qty: number = 1): Promise<DecrementResult> {
  if (qty <= 0) return { ok: true, remaining: null, message: "No quantity change." };

  return db.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { stockType: true, stockCount: true, status: true, lowStockThreshold: true },
    });
    if (!product) throw new Error("Product not found");

    if (product.stockType !== "limited") {
      return { ok: true, remaining: null, message: "Unlimited stock." };
    }

    const current = product.stockCount ?? 0;
    if (current < qty) {
      return { ok: false, remaining: current, message: "Insufficient stock — order rejected." };
    }

    // Conditional update prevents overselling under concurrency.
    const updated = await tx.product.updateMany({
      where: { id: productId, stockCount: { gte: qty } },
      data: { stockCount: { decrement: qty } },
    });

    if (updated.count === 0) {
      const fresh = await tx.product.findUnique({ where: { id: productId }, select: { stockCount: true } });
      return { ok: false, remaining: fresh?.stockCount ?? 0, message: "Stock just sold out — order rejected." };
    }

    const remaining = current - qty;

    // Auto status transition when stock reaches zero.
    if (remaining <= 0 && product.status !== "out_of_stock") {
      await tx.product.update({
        where: { id: productId },
        data: { status: "out_of_stock", inStock: false, stockCount: 0 },
      });
    }

    return { ok: true, remaining, message: `Stock decremented. ${remaining} remaining.` };
  });
}

/**
 * Restore stock (e.g. when a booking is cancelled). Transactional.
 */
export async function restoreStock(productId: string, qty: number = 1): Promise<DecrementResult> {
  if (qty <= 0) return { ok: true, remaining: null, message: "No quantity change." };

  return db.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { stockType: true, stockCount: true, status: true },
    });
    if (!product) throw new Error("Product not found");
    if (product.stockType !== "limited") {
      return { ok: true, remaining: null, message: "Unlimited stock." };
    }

    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        stockCount: { increment: qty },
        status: product.status === "out_of_stock" ? "active" : product.status,
        inStock: true,
      },
    });
    return { ok: true, remaining: updated.stockCount ?? 0, message: `Stock restored. ${updated.stockCount} now available.` };
  });
}

/**
 * Manually set the stock count (vendor editing inventory). Transactional.
 * Auto-syncs status: 0 → out_of_stock, >0 → active (if currently out_of_stock).
 */
export async function setStock(
  productId: string,
  stockType: "unlimited" | "limited",
  count: number | null
): Promise<void> {
  await db.$transaction(async (tx) => {
    const existing = await tx.product.findUnique({ where: { id: productId }, select: { status: true } });
    if (!existing) throw new Error("Product not found");

    let newStatus = existing.status;
    if (stockType === "unlimited") {
      if (existing.status === "out_of_stock") newStatus = "active";
    } else {
      const c = Math.max(0, count ?? 0);
      if (c <= 0) newStatus = "out_of_stock";
      else if (existing.status === "out_of_stock") newStatus = "active";
    }

    await tx.product.update({
      where: { id: productId },
      data: {
        stockType,
        stockCount: stockType === "limited" ? Math.max(0, count ?? 0) : null,
        inStock: stockType === "unlimited" || (count ?? 0) > 0,
        status: newStatus,
      },
    });
  });
}

// ───────────────────────────────────────────────────────────────────────────
// DAILY ORDER CAPS
// ───────────────────────────────────────────────────────────────────────────

/** Count confirmed/active bookings for a product on a given day. */
export async function countConfirmedBookingsOnDate(
  productId: string,
  dayStart: Date,
  dayEnd: Date
): Promise<number> {
  const bookings = await db.bookingV2.findMany({
    where: {
      bookingDate: { gte: dayStart, lte: dayEnd },
      status: { in: ["pending", "confirmed", "accepted", "in_progress"] },
    },
    select: { items: true },
  });
  let count = 0;
  for (const b of bookings) {
    const items = safeParse(b.items, []);
    if (Array.isArray(items) && items.some((it: any) => it.productId === productId)) count++;
  }
  return count;
}

// ───────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ───────────────────────────────────────────────────────────────────────────

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Increment a daily analytics counter for a product (idempotent upsert). */
export async function trackEvent(
  productId: string,
  event: "views" | "enquiries" | "bookings",
  revenue: number = 0
): Promise<void> {
  const key = todayKey();
  try {
    await db.productAnalyticsDaily.upsert({
      where: { productId_dateKey: { productId, dateKey: key } },
      create: { productId, dateKey: key, [event]: 1, revenue },
      update: { [event]: { increment: 1 }, revenue: { increment: revenue } },
    });
    if (event === "views") {
      await db.product.update({ where: { id: productId }, data: { views: { increment: 1 }, lastViewedAt: new Date() } }).catch(() => {});
    } else if (event === "enquiries") {
      await db.product.update({ where: { id: productId }, data: { enquiryCount: { increment: 1 } } }).catch(() => {});
    } else if (event === "bookings") {
      await db.product.update({ where: { id: productId }, data: { orderCount: { increment: 1 }, salesRevenue: { increment: revenue } } }).catch(() => {});
    }
  } catch (err) {
    console.error("[inventory] trackEvent failed:", err);
  }
}

// ───────────────────────────────────────────────────────────────────────────
// ALERTS
// ───────────────────────────────────────────────────────────────────────────

export interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  type: "low_stock" | "out_of_stock" | "season_ending" | "availability_ending" | "fully_booked";
  severity: "info" | "warning" | "critical";
  message: string;
  detail?: string;
}

/**
 * Compute live inventory alerts for a vendor. Reads-only, no persistence.
 */
export async function getVendorAlerts(vendorId: string): Promise<InventoryAlert[]> {
  const products = await db.product.findMany({
    where: { vendorId, status: { notIn: ["archived", "draft"] } },
    select: {
      id: true,
      name: true,
      status: true,
      stockType: true,
      stockCount: true,
      lowStockThreshold: true,
      availabilityMode: true,
      availabilityEnd: true,
      maxOrdersPerDay: true,
    },
  });

  const alerts: InventoryAlert[] = [];
  const now = new Date();
  const sevenDays = 7 * 24 * 3600 * 1000;

  for (const p of products) {
    if (p.status === "out_of_stock" || (p.stockType === "limited" && (p.stockCount ?? 0) <= 0)) {
      alerts.push({
        id: `oos-${p.id}`,
        productId: p.id,
        productName: p.name,
        type: "out_of_stock",
        severity: "critical",
        message: `${p.name} is out of stock`,
        detail: "Restock or switch to unlimited to reactivate.",
      });
      continue;
    }
    if (p.stockType === "limited") {
      const threshold = p.lowStockThreshold && p.lowStockThreshold > 0 ? p.lowStockThreshold : 10;
      if ((p.stockCount ?? 0) < threshold) {
        alerts.push({
          id: `low-${p.id}`,
          productId: p.id,
          productName: p.name,
          type: "low_stock",
          severity: "warning",
          message: `Only ${p.stockCount} left for ${p.name}`,
          detail: `Below the low-stock threshold of ${threshold}.`,
        });
      }
    }
    if ((p.availabilityMode === "date_range" || p.status === "seasonal") && p.availabilityEnd) {
      const msLeft = p.availabilityEnd.getTime() - now.getTime();
      if (msLeft <= sevenDays && msLeft > 0) {
        alerts.push({
          id: `season-${p.id}`,
          productId: p.id,
          productName: p.name,
          type: "season_ending",
          severity: "info",
          message: `${p.name} availability ends ${fmtDate(p.availabilityEnd)}`,
          detail: "Extend the date range or archive when the season closes.",
        });
      }
    }
  }

  const order = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => order[a.severity] - order[b.severity]);
  return alerts;
}

// ───────────────────────────────────────────────────────────────────────────
// DASHBOARD WIDGET DATA
// ───────────────────────────────────────────────────────────────────────────

export interface ProductDashboardData {
  todaysOrders: number;
  upcomingBookings: { id: string; bookingNumber: string; bookingDate: string; customerName: string; eventType: string }[];
  lowStockCount: number;
  outOfStockCount: number;
  seasonalCount: number;
  totalActiveProducts: number;
  alerts: InventoryAlert[];
}

export async function getVendorProductDashboard(vendorId: string): Promise<ProductDashboardData> {
  const productIds = await db.product.findMany({
    where: { vendorId },
    select: { id: true },
  });
  const ids = productIds.map((p) => p.id);

  const dayStart = startOfDay(new Date());
  const dayEnd = endOfDay(new Date());

  const todaysBookings = ids.length
    ? await db.bookingV2.findMany({
        where: { bookingDate: { gte: dayStart, lte: dayEnd }, status: { notIn: ["cancelled", "rejected"] } },
        select: { id: true, bookingNumber: true, bookingDate: true, customerName: true, eventType: true, items: true },
      })
    : [];
  const todaysOrders = todaysBookings.filter((b) => {
    const items = safeParse(b.items, []);
    return Array.isArray(items) && items.some((it: any) => ids.includes(it.productId));
  }).length;

  const upcomingRaw = ids.length
    ? await db.bookingV2.findMany({
        where: { bookingDate: { gte: new Date() }, status: { in: ["pending", "confirmed", "accepted"] } },
        select: { id: true, bookingNumber: true, bookingDate: true, customerName: true, eventType: true, items: true },
        orderBy: { bookingDate: "asc" },
        take: 50,
      })
    : [];
  const upcomingBookings = upcomingRaw
    .filter((b) => {
      const items = safeParse(b.items, []);
      return Array.isArray(items) && items.some((it: any) => ids.includes(it.productId));
    })
    .slice(0, 8)
    .map((b) => ({
      id: b.id,
      bookingNumber: b.bookingNumber,
      bookingDate: b.bookingDate instanceof Date ? b.bookingDate.toISOString() : b.bookingDate,
      customerName: b.customerName,
      eventType: b.eventType,
    }));

  const [outOfStockCount, seasonalCount, totalActiveProducts, alerts] = await Promise.all([
    db.product.count({ where: { vendorId, status: "out_of_stock" } }),
    db.product.count({ where: { vendorId, status: "seasonal" } }),
    db.product.count({ where: { vendorId, status: "active" } }),
    getVendorAlerts(vendorId),
  ]);

  const limitedProducts = await db.product.findMany({
    where: { vendorId, stockType: "limited", status: { notIn: ["archived", "draft", "out_of_stock"] } },
    select: { stockCount: true, lowStockThreshold: true },
  });
  const lowStock = limitedProducts.filter(
    (p) => (p.stockCount ?? 0) < (p.lowStockThreshold && p.lowStockThreshold > 0 ? p.lowStockThreshold : 10)
  ).length;

  return {
    todaysOrders,
    upcomingBookings,
    lowStockCount: lowStock,
    outOfStockCount,
    seasonalCount,
    totalActiveProducts,
    alerts,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// ANALYTICS AGGREGATION
// ───────────────────────────────────────────────────────────────────────────

export interface ProductAnalytics {
  productId: string;
  productName: string;
  views: number;
  enquiries: number;
  bookings: number;
  revenue: number;
  conversionRate: number;
  stockRemaining: number | null;
  status: string;
}

export async function getVendorAnalytics(vendorId: string, days: number = 30): Promise<{
  products: ProductAnalytics[];
  totals: { views: number; enquiries: number; bookings: number; revenue: number; conversionRate: number };
  topProducts: ProductAnalytics[];
  lowInventory: ProductAnalytics[];
}> {
  const products = await db.product.findMany({
    where: { vendorId },
    select: {
      id: true,
      name: true,
      views: true,
      enquiryCount: true,
      orderCount: true,
      salesRevenue: true,
      stockType: true,
      stockCount: true,
      status: true,
    },
    orderBy: { views: "desc" },
  });

  const items: ProductAnalytics[] = products.map((p) => ({
    productId: p.id,
    productName: p.name,
    views: p.views ?? 0,
    enquiries: p.enquiryCount ?? 0,
    bookings: p.orderCount ?? 0,
    revenue: p.salesRevenue ?? 0,
    conversionRate: p.views ? ((p.orderCount ?? 0) / p.views) * 100 : 0,
    stockRemaining: p.stockType === "limited" ? p.stockCount : null,
    status: p.status,
  }));

  const totals = {
    views: items.reduce((s, i) => s + i.views, 0),
    enquiries: items.reduce((s, i) => s + i.enquiries, 0),
    bookings: items.reduce((s, i) => s + i.bookings, 0),
    revenue: items.reduce((s, i) => s + i.revenue, 0),
    conversionRate: 0,
  };
  totals.conversionRate = totals.views ? (totals.bookings / totals.views) * 100 : 0;

  return {
    products: items,
    totals,
    topProducts: [...items].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    lowInventory: items
      .filter((i) => i.stockRemaining !== null && i.stockRemaining < 10)
      .sort((a, b) => (a.stockRemaining ?? 0) - (b.stockRemaining ?? 0)),
  };
}

// ───────────────────────────────────────────────────────────────────────────
// ADMIN: global inventory view
// ───────────────────────────────────────────────────────────────────────────

export async function getAdminInventoryOverview(filters?: {
  status?: string;
  ecosystem?: string;
  outOfStockOnly?: boolean;
  seasonalOnly?: boolean;
  forceHiddenOnly?: boolean;
  limit?: number;
}) {
  const where: any = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.ecosystem) where.ecosystem = filters.ecosystem;
  if (filters?.outOfStockOnly) where.status = "out_of_stock";
  if (filters?.seasonalOnly) where.status = "seasonal";
  if (filters?.forceHiddenOnly) where.forceHidden = true;

  const [products, total, outOfStock, seasonal, forceHidden, lowStockRows] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: Math.min(filters?.limit ?? 100, 500),
      select: {
        id: true, name: true, status: true, stockType: true, stockCount: true,
        lowStockThreshold: true, forceHidden: true, isFeatured: true, featured: true,
        ecosystem: true, category: true, views: true, orderCount: true, salesRevenue: true,
        availabilityMode: true, availabilityEnd: true, vendorId: true,
      },
    }),
    db.product.count({ where }),
    db.product.count({ where: { status: "out_of_stock" } }),
    db.product.count({ where: { status: "seasonal" } }),
    db.product.count({ where: { forceHidden: true } }),
    db.product.findMany({ where: { stockType: "limited", stockCount: { lt: 10 } }, select: { id: true } }),
  ]);

  // Attach vendor names in one query
  const vendorIds = [...new Set(products.map((p) => p.vendorId))];
  const vendors = vendorIds.length
    ? await db.vendor.findMany({ where: { id: { in: vendorIds } }, select: { id: true, businessName: true, ecosystem: true } })
    : [];
  const vendorMap = new Map(vendors.map((v) => [v.id, v]));

  return {
    products: products.map((p) => ({
      ...p,
      vendorName: vendorMap.get(p.vendorId)?.businessName ?? "Unknown",
      vendorEcosystem: vendorMap.get(p.vendorId)?.ecosystem ?? null,
    })),
    stats: {
      total,
      outOfStock,
      seasonal,
      forceHidden,
      lowStock: lowStockRows.length,
    },
  };
}

// ───────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function formatHours(h: number): string {
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""}`;
  const days = Math.round(h / 24);
  return `${days} day${days > 1 ? "s" : ""}`;
}

export function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function parseAvailableDays(raw: string | null | undefined): string[] {
  return safeParse<string[]>(raw, []);
}

export function parseServiceCities(raw: string | null | undefined): string[] {
  return safeParse<string[]>(raw, []);
}
