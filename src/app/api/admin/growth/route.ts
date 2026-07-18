import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

/**
 * GET /api/admin/growth
 * CEO dashboard — platform-wide growth metrics.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalVendors, verifiedVendors, pendingVendors,
      totalProducts, totalBookings, totalCustomers,
      thisMonthVendors, lastMonthVendors, thisMonthBookings,
      completedBookings, cancelledBookings,
      revenueAgg, monthlyRevenueAgg,
      activeSubscriptions, proSubscriptions, businessSubscriptions,
    ] = await Promise.all([
      db.vendor.count({ where: { approved: true } }),
      db.vendor.count({ where: { approved: true, verified: true } }),
      db.vendor.count({ where: { approved: false } }),
      db.product.count(),
      db.bookingV2.count(),
      db.bookingV2.groupBy({ by: ["customerEmail"], _count: { id: true } }).then(r => r.length),
      db.vendor.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.vendor.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
      db.bookingV2.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.bookingV2.count({ where: { status: "completed" } }),
      db.bookingV2.count({ where: { status: "cancelled" } }),
      db.bookingV2.aggregate({ where: { status: "completed" }, _sum: { totalAmount: true } }),
      db.paymentHistory.aggregate({ where: { createdAt: { gte: startOfMonth }, paymentStatus: "captured" }, _sum: { amount: true } }),
      db.vendorSubscription.count({ where: { status: "active" } }),
      db.vendorSubscription.count({ where: { status: "active", planTier: "pro" } }),
      db.vendorSubscription.count({ where: { status: "active", planTier: "business" } }),
    ]);

    // Top categories
    const topCategories = await db.vendor.groupBy({
      by: ["category"], where: { approved: true },
      _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 10,
    });

    // Top countries
    const topCountries = await db.vendor.groupBy({
      by: ["country"], where: { approved: true },
      _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 10,
    });

    // Top cities
    const topCities = await db.vendor.groupBy({
      by: ["city"], where: { approved: true },
      _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 10,
    });

    // Monthly vendor growth (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const recentVendors = await db.vendor.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, ecosystem: true },
      orderBy: { createdAt: "asc" },
    });
    const monthlyGrowth: { month: string; food: number; party: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthVendors = recentVendors.filter(v => v.createdAt >= d && v.createdAt < next);
      monthlyGrowth.push({
        month: d.toLocaleDateString("en-US", { month: "short" }),
        food: monthVendors.filter(v => v.ecosystem === "FINDMYBITES").length,
        party: monthVendors.filter(v => v.ecosystem === "PIMPMYPARTY").length,
      });
    }

    const vendorGrowthRate = lastMonthVendors > 0
      ? Math.round(((thisMonthVendors - lastMonthVendors) / lastMonthVendors) * 100)
      : 0;

    const conversionRate = totalBookings > 0
      ? Math.round((completedBookings / totalBookings) * 100)
      : 0;

    const cancellationRate = totalBookings > 0
      ? Math.round((cancelledBookings / totalBookings) * 100)
      : 0;

    // MRR: Calculate from actual subscription amounts (not hardcoded prices)
    // Uses the sum of active subscription amountsPaid divided by billing cycle
    const subscriptionData = await db.vendorSubscription.findMany({
      where: { status: "active" },
      select: { amountPaid: true, billingCycle: true, currency: true },
    }).catch(() => []);
    const MRR = subscriptionData.reduce((sum, sub) => {
      // Convert yearly to monthly equivalent
      const monthly = sub.billingCycle === "yearly" ? sub.amountPaid / 12 : sub.amountPaid;
      return sum + monthly;
    }, 0);
    const ARR = MRR * 12;

    return NextResponse.json({
      overview: {
        totalVendors, verifiedVendors, pendingVendors,
        totalProducts, totalBookings, totalCustomers,
        totalRevenue: revenueAgg._sum.totalAmount ?? 0,
        monthlyRevenue: monthlyRevenueAgg._sum.amount ?? 0,
        MRR, ARR,
        conversionRate, cancellationRate,
        vendorGrowthRate,
        thisMonthVendors, thisMonthBookings,
      },
      subscriptions: {
        active: activeSubscriptions,
        pro: proSubscriptions,
        business: businessSubscriptions,
        free: totalVendors - activeSubscriptions,
      },
      topCategories: topCategories.map(c => ({ name: c.category, count: c._count.id })),
      topCountries: topCountries.map(c => ({ name: c.country, count: c._count.id })),
      topCities: topCities.map(c => ({ name: c.city, count: c._count.id })),
      monthlyGrowth,
    });
  } catch (error: any) {
    console.error("[admin/growth] GET failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
