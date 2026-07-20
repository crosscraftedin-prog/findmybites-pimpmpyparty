export const maxDuration = 30;
import { guardAiRoute } from "@/lib/billing/guards";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { parseJsonArray } from "@/lib/format";

/**
 * GET /api/ai/insights
 *
 * AI-powered marketplace insights for the admin dashboard.
 * Returns trending data, top vendors, search analytics, and lead quality.
 *
 * Admin auth required.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const sp = req.nextUrl.searchParams;
    const daysRaw = Number(sp.get("days"));
    const days = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.min(90, daysRaw) : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // 1. Top vendors by rating + reviews + bookings
    let topVendors: any[] = [];
    try {
      topVendors = await db.vendor.findMany({
        where: { approved: true },
        orderBy: [{ featured: "desc" }, { rating: "desc" }, { reviewCount: "desc" }],
        take: 10,
        select: {
          id: true, name: true, slug: true, category: true, city: true,
          rating: true, reviewCount: true, completedBookings: true,
          featured: true, verified: true, createdAt: true,
        },
      });
    } catch {}

    // 2. Fastest growing vendors (most products + reviews in last N days)
    let fastestGrowing: any[] = [];
    try {
      fastestGrowing = await db.vendor.findMany({
        where: {
          approved: true,
          products: { some: { createdAt: { gte: since } } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true, name: true, slug: true, category: true, city: true,
          rating: true, reviewCount: true, createdAt: true,
        },
      });
    } catch {}

    // 3. Popular cities (by vendor count)
    let popularCities: any[] = [];
    try {
      const cityGroups = await db.vendor.groupBy({
        by: ["city"],
        where: { approved: true },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      });
      popularCities = cityGroups.map((c: any) => ({ city: c.city, vendorCount: c._count.id }));
    } catch {}

    // 4. Category distribution
    let categoryStats: any[] = [];
    try {
      const catGroups = await db.vendor.groupBy({
        by: ["category"],
        where: { approved: true },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      });
      categoryStats = catGroups.map((c: any) => ({ category: c.category, vendorCount: c._count.id }));
    } catch {}

    // 5. Lead quality (average lead score)
    let leadQuality: any = { averageScore: 0, totalLeads: 0, highQuality: 0 };
    try {
      const leads = await db.booking.findMany({
        where: { createdAt: { gte: since } },
        select: { leadScore: true },
      });
      const scores = leads.filter(l => l.leadScore != null).map(l => l.leadScore as number);
      leadQuality = {
        averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        totalLeads: leads.length,
        highQuality: scores.filter(s => s >= 70).length,
      };
    } catch {}

    // 6. Analytics trends (page views over time)
    let analyticsTrends: any = { totalViews: 0, totalClicks: 0, uniqueVisitors: 0 };
    try {
      const events = await db.vendorAnalytics.findMany({
        where: { createdAt: { gte: since } },
        select: { eventType: true, visitorHash: true },
      });
      const uniqueVisitors = new Set(events.map(e => e.visitorHash || "anon"));
      analyticsTrends = {
        totalViews: events.filter(e => e.eventType === "page_view").length,
        totalClicks: events.filter(e => e.eventType.includes("click")).length,
        uniqueVisitors: uniqueVisitors.size,
      };
    } catch {}

    // 7. Filter popularity (most selected filter values)
    let filterPopularity: any[] = [];
    try {
      const filterValues = await db.vendorFilterValue.findMany({
        include: {
          filterValue: {
            include: { group: { select: { name: true } } },
          },
        },
        take: 500,
      });
      const filterCount: Record<string, number> = {};
      for (const fv of filterValues) {
        const key = `${fv.filterValue.group.name}: ${fv.filterValue.value}`;
        filterCount[key] = (filterCount[key] || 0) + 1;
      }
      filterPopularity = Object.entries(filterCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([name, count]) => ({ name, count }));
    } catch {}

    // 8. Conversion data (enquiries → confirmed bookings)
    let conversion: any = { enquiries: 0, confirmed: 0, completed: 0, rate: 0 };
    try {
      const enquiries = await db.booking.count({ where: { createdAt: { gte: since } } });
      const confirmed = await db.booking.count({ where: { status: "confirmed", createdAt: { gte: since } } });
      const completed = await db.booking.count({ where: { status: "completed", createdAt: { gte: since } } });
      conversion = {
        enquiries,
        confirmed,
        completed,
        rate: enquiries > 0 ? Math.round((confirmed / enquiries) * 100) : 0,
      };
    } catch {}

    return NextResponse.json({
      topVendors,
      fastestGrowing,
      popularCities,
      categoryStats,
      leadQuality,
      analyticsTrends,
      filterPopularity,
      conversion,
      days,
    });
  } catch (err) {
    console.error("[api/ai/insights] GET failed:", err);
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 });
  }
}
