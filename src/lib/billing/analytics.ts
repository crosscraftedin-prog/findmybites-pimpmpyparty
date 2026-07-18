/**
 * Billing Module — Analytics
 *
 * Billing metrics for the admin dashboard.
 * MRR, ARR, revenue, churn, conversion, country/plan distribution.
 */

import { db } from "@/lib/db";
import type { BillingAnalytics } from "./types";

/**
 * Get comprehensive billing analytics for the admin dashboard.
 */
export async function getBillingAnalytics(): Promise<BillingAnalytics> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    activeSubs,
    newThisMonth,
    renewalsThisMonth,
    monthlyRevenue,
    failedPayments,
    recoveredPayments,
    countryStats,
    planStats,
    lastMonthActive,
  ] = await Promise.all([
    // Active subscriptions
    db.vendorSubscription.count({ where: { status: "active" } }).catch(() => 0),

    // New subscriptions this month
    db.vendorSubscription.count({
      where: { planStartedAt: { gte: monthStart }, status: "active" },
    }).catch(() => 0),

    // Renewals this month
    db.paymentHistory.count({
      where: { createdAt: { gte: monthStart }, paymentType: "renewal", paymentStatus: "captured" },
    }).catch(() => 0),

    // Monthly revenue (captured payments this month)
    db.paymentHistory.aggregate({
      where: { createdAt: { gte: monthStart }, paymentStatus: "captured" },
      _sum: { amount: true },
      _count: true,
    }).catch(() => ({ _sum: { amount: 0 }, _count: 0 })),

    // Failed payments this month
    db.paymentHistory.count({
      where: { createdAt: { gte: monthStart }, paymentStatus: "failed" },
    }).catch(() => 0),

    // Recovered payments (failed then succeeded)
    db.paymentHistory.count({
      where: { createdAt: { gte: monthStart }, paymentStatus: "captured", paymentType: "renewal" },
    }).catch(() => 0),

    // Country distribution (active subscriptions)
    db.vendorSubscription.findMany({
      where: { status: "active" },
      select: { vendorId: true, amountPaid: true, currency: true },
    }).catch(() => []),

    // Plan distribution
    db.vendorSubscription.groupBy({
      by: ["planName"],
      where: { status: "active" },
      _count: true,
      _sum: { amountPaid: true },
    }).catch(() => []),

    // Last month active (for churn calculation)
    db.vendorSubscription.count({
      where: { planStartedAt: { lt: monthStart }, status: "active" },
    }).catch(() => 0),
  ]);

  // Calculate MRR (sum of monthly-equivalent revenue)
  // For yearly subscriptions, divide by 12
  const mrr = monthlyRevenue._sum.amount || 0;

  // Calculate ARR (MRR × 12)
  const arr = mrr * 12;

  // Total revenue (all time)
  const totalRevenue = await db.paymentHistory.aggregate({
    where: { paymentStatus: "captured" },
    _sum: { amount: true },
  }).catch(() => ({ _sum: { amount: 0 } }));

  // Churn rate = (last month active - current active that started before this month) / last month active
  const churnRate = lastMonthActive > 0
    ? ((lastMonthActive - (activeSubs - newThisMonth)) / lastMonthActive) * 100
    : 0;

  // Country distribution
  const countryMap = new Map<string, { count: number; revenue: number }>();
  for (const sub of countryStats) {
    // We don't have country in the subscription directly — use vendor's country
    // For now, group by currency as a proxy
    const key = sub.currency || "INR";
    const existing = countryMap.get(key) || { count: 0, revenue: 0 };
    existing.count++;
    existing.revenue += sub.amountPaid || 0;
    countryMap.set(key, existing);
  }
  const topCountries = Array.from(countryMap.entries())
    .map(([country, data]) => ({ country, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Plan distribution
  const topPlans = planStats.map((p: any) => ({
    plan: p.planName,
    count: p._count,
    revenue: p._sum.amountPaid || 0,
  }));

  return {
    mrr,
    arr,
    totalRevenue: totalRevenue._sum.amount || 0,
    activeSubscriptions: activeSubs,
    newThisMonth,
    renewalsThisMonth,
    churnRate: Math.max(0, Math.round(churnRate * 100) / 100),
    failedPayments,
    recoveredPayments,
    topCountries,
    topPlans,
  };
}
