/**
 * Growth Service — Growth Score, KPI aggregation, competitor insights.
 * ───────────────────────────────────────────────────────────────────────────
 * Computes a vendor's Growth Score (0-100) from 7 weighted dimensions,
 * aggregates KPIs with period comparisons (today/week/month/last-month),
 * and benchmarks against similar vendors.
 *
 * All aggregation uses the daily analytics table (server-side) so it scales
 * to tens of thousands of vendors without scanning raw event logs.
 */
import { db } from "@/lib/db";

// ── Growth Score dimensions ──────────────────────────────────────────────────
export interface GrowthBreakdown {
  profileComplete: number;   // 0-100
  products: number;           // 0-100
  seo: number;                // 0-100
  photos: number;             // 0-100
  responseRate: number;       // 0-100
  reviews: number;            // 0-100
  subscription: number;       // 0-100 (0=free, 70=pro, 100=business)
}

export interface GrowthScoreResult {
  score: number;       // 0-100 weighted overall
  stars: number;       // 0-5
  breakdown: GrowthBreakdown;
  weakAreas: string[]; // dimension labels scoring below 70
}

const WEIGHTS: Record<keyof GrowthBreakdown, number> = {
  profileComplete: 0.20,
  products: 0.15,
  seo: 0.15,
  photos: 0.10,
  responseRate: 0.15,
  reviews: 0.15,
  subscription: 0.10,
};

/** Compute + persist a fresh growth score snapshot for a vendor. */
export async function computeGrowthScore(vendorId: string): Promise<GrowthScoreResult> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: {
      id: true, name: true, tagline: true, description: true, city: true,
      category: true, ecosystem: true, heroImage: true, avatarImage: true,
      gallery: true, tags: true, metaTitle: true, metaDescription: true,
      responseTime: true, rating: true, reviewCount: true, completedBookings: true,
      profileViews: true,
    },
  });
  if (!vendor) throw new Error("Vendor not found");

  const [products, reviews, subscription] = await Promise.all([
    db.product.count({ where: { vendorId, status: "active" } }),
    db.review.count({ where: { vendorId } }),
    db.vendorSubscription.findFirst({
      where: { vendorId, status: "active" },
      orderBy: { createdAt: "desc" },
      select: { planTier: true },
    }),
  ]);

  // 1. Profile completeness
  const profileFields = [
    vendor.name, vendor.tagline, vendor.description, vendor.city, vendor.category,
    vendor.heroImage, vendor.avatarImage, vendor.tags, vendor.responseTime,
  ];
  const filled = profileFields.filter((f) => f && String(f).trim().length > 0).length;
  const profileComplete = Math.round((filled / profileFields.length) * 100);

  // 2. Products (benchmark: 10+ active = 100)
  const productsScore = Math.min(100, Math.round((products / 10) * 100));

  // 3. SEO
  const hasMetaTitle = !!(vendor.metaTitle && vendor.metaTitle.trim().length >= 10);
  const hasMetaDesc = !!(vendor.metaDescription && vendor.metaDescription.trim().length >= 30);
  const hasTags = !!(vendor.tags && JSON.parse(vendor.tags || "[]").length >= 3);
  const seo = Math.round(((hasMetaTitle ? 40 : 0) + (hasMetaDesc ? 40 : 0) + (hasTags ? 20 : 0)));

  // 4. Photos (hero + avatar + gallery count)
  let galleryCount = 0;
  try { galleryCount = Array.isArray(vendor.gallery) ? vendor.gallery.length : JSON.parse(vendor.gallery || "[]").length; } catch {}
  const photoFields = [vendor.heroImage, vendor.avatarImage].filter(Boolean).length;
  const photos = Math.min(100, Math.round(((photoFields / 2) * 50) + Math.min(50, galleryCount * 10)));

  // 5. Response rate (proxy from responseTime string — faster = higher)
  const rt = (vendor.responseTime || "").toLowerCase();
  let responseRate = 60;
  if (rt.includes("minute") || rt.includes("hour")) responseRate = 95;
  else if (rt.includes("same") || rt.includes("instant")) responseRate = 100;
  else if (rt.includes("day") || rt.includes("24")) responseRate = 75;
  else if (rt.includes("week") || rt.includes("long")) responseRate = 40;

  // 6. Reviews (benchmark: 20+ reviews = 100, and rating matters)
  const reviewCountScore = Math.min(70, Math.round((reviews / 20) * 70));
  const ratingScore = Math.round(((vendor.rating || 0) / 5) * 30);
  const reviewScore = Math.min(100, reviewCountScore + ratingScore);

  // 7. Subscription
  const tier = subscription?.planTier || "free";
  const subscriptionScore = tier === "business" ? 100 : tier === "pro" ? 70 : 30;

  const breakdown: GrowthBreakdown = {
    profileComplete, products: productsScore, seo, photos,
    responseRate, reviews: reviewScore, subscription: subscriptionScore,
  };

  const score = Math.round(
    (Object.keys(WEIGHTS) as (keyof GrowthBreakdown)[]).reduce(
      (sum, k) => sum + breakdown[k] * WEIGHTS[k],
      0
    )
  );
  const stars = Math.round((score / 100) * 5 * 2) / 2; // nearest 0.5

  const weakAreas = (Object.keys(breakdown) as (keyof GrowthBreakdown)[])
    .filter((k) => breakdown[k] < 70)
    .map((k) => k);

  // Persist snapshot
  try {
    await db.growthScore.create({
      data: {
        vendorId,
        score,
        stars: Math.round(stars),
        breakdown: JSON.stringify(breakdown),
        weakAreas: JSON.stringify(weakAreas),
      },
    });
  } catch (err) {
    console.error("[growth] snapshot persist failed:", err);
  }

  return { score, stars, breakdown, weakAreas };
}

/** Latest stored growth score (without recomputing). */
export async function getLatestGrowthScore(vendorId: string): Promise<GrowthScoreResult | null> {
  const row = await db.growthScore.findFirst({
    where: { vendorId },
    orderBy: { computedAt: "desc" },
  });
  if (!row) return null;
  return {
    score: row.score,
    stars: row.stars,
    breakdown: row.breakdown ? JSON.parse(row.breakdown) : null,
    weakAreas: row.weakAreas ? JSON.parse(row.weakAreas) : [],
  };
}

// ── KPI aggregation with period comparison ───────────────────────────────────
export type PeriodKey = "today" | "week" | "month" | "last_month";

export interface Kpis {
  profileViews: number;
  productViews: number;
  enquiries: number;
  bookings: number;
  revenue: number;
  followers: number;
  wishlistAdds: number;
  conversionRate: number; // bookings / productViews * 100
}

export interface KpiComparison {
  current: Kpis;       // current period
  previous: Kpis;      // previous period (for delta)
  delta: Record<keyof Kpis, number>; // % change
}

function periodRange(period: PeriodKey): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  let start = new Date(now);
  let prevStart = new Date(now);
  let prevEnd = new Date(now);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
    prevStart.setDate(prevStart.getDate() - 1); prevStart.setHours(0,0,0,0);
    prevEnd.setDate(prevEnd.getDate() - 1); prevEnd.setHours(23,59,59,999);
  } else if (period === "week") {
    start.setDate(start.getDate() - 7); start.setHours(0,0,0,0);
    prevStart.setDate(prevStart.getDate() - 14); prevStart.setHours(0,0,0,0);
    prevEnd.setDate(prevEnd.getDate() - 7); prevEnd.setHours(23,59,59,999);
  } else if (period === "month") {
    start.setMonth(start.getMonth() - 1); start.setDate(1); start.setHours(0,0,0,0);
    prevStart.setMonth(prevStart.getMonth() - 2); prevStart.setDate(1); prevStart.setHours(0,0,0,0);
    prevEnd.setMonth(prevEnd.getMonth() - 1); prevEnd.setDate(0); prevEnd.setHours(23,59,59,999);
  } else { // last_month
    start.setMonth(start.getMonth() - 1); start.setDate(1); start.setHours(0,0,0,0);
    end.setDate(0); end.setHours(23,59,59,999); // last day of previous month
    prevStart.setMonth(prevStart.getMonth() - 2); prevStart.setDate(1); prevStart.setHours(0,0,0,0);
    prevEnd.setMonth(prevEnd.getMonth() - 1); prevEnd.setDate(0); prevEnd.setHours(23,59,59,999);
  }
  return { start, end, prevStart, prevEnd };
}

async function aggregateRange(vendorId: string, start: Date, end: Date): Promise<Kpis> {
  const rows = await db.vendorAnalyticsDaily.findMany({
    where: { vendorId, dateKey: { gte: dateKey(start), lte: dateKey(end) } },
  });
  // Include today even if the daily rollup hasn't run yet — approximate from
  // the raw counters on the vendor + product rows.
  const profileViews = rows.reduce((s, r) => s + r.profileViews, 0);
  const productViews = rows.reduce((s, r) => s + r.productViews, 0);
  const enquiries = rows.reduce((s, r) => s + r.enquiries, 0);
  const bookings = rows.reduce((s, r) => s + r.bookings, 0);
  const revenue = rows.reduce((s, r) => s + r.revenue, 0);
  const followers = rows.reduce((s, r) => s + r.follows, 0);
  const wishlistAdds = rows.reduce((s, r) => s + r.wishlistAdds, 0);
  return {
    profileViews, productViews, enquiries, bookings, revenue, followers, wishlistAdds,
    conversionRate: productViews ? (bookings / productViews) * 100 : 0,
  };
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export async function getKpiComparison(vendorId: string, period: PeriodKey): Promise<KpiComparison> {
  const { start, end, prevStart, prevEnd } = periodRange(period);
  const [current, previous] = await Promise.all([
    aggregateRange(vendorId, start, end),
    aggregateRange(vendorId, prevStart, prevEnd),
  ]);
  const delta = (Object.keys(current) as (keyof Kpis)[]).reduce((acc, k) => {
    const c = current[k] as number;
    const p = previous[k] as number;
    acc[k] = p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 100);
    return acc;
  }, {} as Record<keyof Kpis, number>);
  return { current, previous, delta };
}

// ── Performance analytics series (for charts) ────────────────────────────────
export interface AnalyticsSeries {
  dateKey: string;
  profileViews: number;
  productViews: number;
  enquiries: number;
  bookings: number;
  revenue: number;
}

export async function getAnalyticsSeries(vendorId: string, days: number = 30): Promise<AnalyticsSeries[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const rows = await db.vendorAnalyticsDaily.findMany({
    where: { vendorId, dateKey: { gte: dateKey(start), lte: dateKey(end) } },
    orderBy: { dateKey: "asc" },
  });
  return rows.map((r) => ({
    dateKey: r.dateKey,
    profileViews: r.profileViews,
    productViews: r.productViews,
    enquiries: r.enquiries,
    bookings: r.bookings,
    revenue: r.revenue,
  }));
}

export interface TopProduct {
  productId: string;
  name: string;
  views: number;
  enquiries: number;
  bookings: number;
  revenue: number;
}

export async function getTopProducts(vendorId: string, limit: number = 5): Promise<TopProduct[]> {
  const products = await db.product.findMany({
    where: { vendorId },
    select: { id: true, name: true, views: true, enquiryCount: true, orderCount: true, salesRevenue: true },
    orderBy: { views: "desc" },
    take: limit,
  });
  return products.map((p) => ({
    productId: p.id, name: p.name, views: p.views ?? 0,
    enquiries: p.enquiryCount ?? 0, bookings: p.orderCount ?? 0, revenue: p.salesRevenue ?? 0,
  }));
}

// ── Competitor insights ──────────────────────────────────────────────────────
export interface CompetitorInsights {
  you: {
    rating: number; products: number; responseRate: number;
    profileCompleteness: number; popularity: number; // profileViews benchmark
  };
  peerAverage: {
    rating: number; products: number; responseRate: number;
    profileCompleteness: number; popularity: number;
  };
  suggestions: string[];
}

export async function getCompetitorInsights(vendorId: string): Promise<CompetitorInsights> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, ecosystem: true, category: true, city: true, country: true,
      rating: true, responseTime: true, tagline: true, description: true,
      heroImage: true, avatarImage: true, gallery: true, tags: true, profileViews: true },
  });
  if (!vendor) throw new Error("Vendor not found");

  const myProducts = await db.product.count({ where: { vendorId, status: "active" } });

  // Peers: same ecosystem + category, exclude self
  const peers = await db.vendor.findMany({
    where: { ecosystem: vendor.ecosystem, category: vendor.category, id: { not: vendorId }, approved: true },
    select: { rating: true, responseTime: true, tagline: true, description: true,
      heroImage: true, avatarImage: true, gallery: true, tags: true, profileViews: true },
    take: 200,
  });

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const peerRating = avg(peers.map((p) => p.rating || 0));
  // Count products for peers would be expensive; approximate from a sample.
  const peerProductCounts = await Promise.all(
    peers.slice(0, 20).map((p) => db.product.count({ where: { vendorId: p.id, status: "active" } }))
  );
  const peerProducts = avg(peerProductCounts);
  const peerPopularity = avg(peers.map((p) => p.profileViews || 0));

  // Response rate proxy
  const rtScore = (rt: string) => {
    const r = (rt || "").toLowerCase();
    if (r.includes("minute") || r.includes("hour") || r.includes("same")) return 95;
    if (r.includes("day") || r.includes("24")) return 75;
    if (r.includes("week")) return 40;
    return 60;
  };
  const peerResponseRate = avg(peers.map((p) => rtScore(p.responseTime || "")));

  // Profile completeness
  const completeness = (v: typeof vendor) => {
    const fields = [v?.name, v?.tagline, v?.description, v?.heroImage, v?.avatarImage, v?.tags];
    return (fields.filter(Boolean).length / fields.length) * 100;
  };
  // vendor.name is always present; peers don't have it selected but we can approximate
  const peerCompleteness = avg(peers.map((p) => {
    const fields = [p.tagline, p.description, p.heroImage, p.avatarImage, p.tags];
    return (fields.filter(Boolean).length / fields.length) * 100;
  }));

  const you = {
    rating: vendor.rating || 0,
    products: myProducts,
    responseRate: rtScore(vendor.responseTime || ""),
    profileCompleteness: completeness(vendor),
    popularity: vendor.profileViews || 0,
  };
  const peerAverage = {
    rating: peerRating,
    products: peerProducts,
    responseRate: peerResponseRate,
    profileCompleteness: peerCompleteness,
    popularity: peerPopularity,
  };

  const suggestions: string[] = [];
  if (you.rating < peerAverage.rating) suggestions.push(`Your rating (${you.rating.toFixed(1)}) is below the peer average (${peerAverage.rating.toFixed(1)}). Use the Review Booster to collect more reviews.`);
  if (you.products < peerAverage.products) suggestions.push(`Peers have ~${Math.round(peerAverage.products)} products; you have ${you.products}. Add more products to increase visibility.`);
  if (you.responseRate < peerAverage.responseRate) suggestions.push(`Your response time is slower than peers. Aim to reply within an hour to improve conversion.`);
  if (you.profileCompleteness < peerAverage.profileCompleteness) suggestions.push(`Complete your profile (tagline, description, gallery) to match peer completeness.`);
  if (you.popularity < peerAverage.popularity) suggestions.push(`You get fewer profile views than peers. Run a social-media campaign or boost SEO.`);

  return { you, peerAverage, suggestions };
}

// ── Admin marketing analytics ────────────────────────────────────────────────
export interface AdminMarketingStats {
  mostActiveVendors: { vendorId: string; name: string; profileViews: number; bookings: number }[];
  leastActiveVendors: { vendorId: string; name: string; profileViews: number; bookings: number }[];
  campaignUsage: { type: string; count: number }[];
  aiUsage: { feature: string; count: number; tokens: number }[];
  topCities: { city: string; vendors: number; profileViews: number }[];
  topCategories: { category: string; vendors: number; profileViews: number }[];
  referralGrowth: { total: number; activated: number; credits: number };
  revenueByPlan: { plan: string; vendors: number; revenue: number }[];
}

export async function getAdminMarketingStats(): Promise<AdminMarketingStats> {
  const [vendors, campaigns, aiLogs, referrals, subs] = await Promise.all([
    db.vendor.findMany({
      where: { approved: true },
      select: { id: true, name: true, city: true, category: true, ecosystem: true, profileViews: true, completedBookings: true },
      take: 5000,
    }),
    db.marketingCampaign.groupBy({ by: ["type"], _count: true }),
    db.aiGenerationLog.groupBy({ by: ["feature"], _count: true, _sum: { tokens: true } }),
    db.referral.findMany({ select: { status: true, creditsEarned: true } }),
    db.vendorSubscription.findMany({ where: { status: "active" }, select: { planTier: true, amountPaid: true } }),
  ]);

  // Most/least active by profileViews
  const sorted = [...vendors].sort((a, b) => (b.profileViews || 0) - (a.profileViews || 0));
  const mostActive = sorted.slice(0, 10).map((v) => ({ vendorId: v.id, name: v.name, profileViews: v.profileViews || 0, bookings: v.completedBookings || 0 }));
  const leastActive = sorted.slice(-10).reverse().map((v) => ({ vendorId: v.id, name: v.name, profileViews: v.profileViews || 0, bookings: v.completedBookings || 0 }));

  // Top cities
  const cityMap = new Map<string, { vendors: number; profileViews: number }>();
  for (const v of vendors) {
    const c = v.city || "Unknown";
    const e = cityMap.get(c) || { vendors: 0, profileViews: 0 };
    e.vendors++; e.profileViews += v.profileViews || 0;
    cityMap.set(c, e);
  }
  const topCities = [...cityMap.entries()].map(([city, d]) => ({ city, ...d })).sort((a, b) => b.profileViews - a.profileViews).slice(0, 10);

  // Top categories
  const catMap = new Map<string, { vendors: number; profileViews: number }>();
  for (const v of vendors) {
    const c = v.category || "Unknown";
    const e = catMap.get(c) || { vendors: 0, profileViews: 0 };
    e.vendors++; e.profileViews += v.profileViews || 0;
    catMap.set(c, e);
  }
  const topCategories = [...catMap.entries()].map(([category, d]) => ({ category, ...d })).sort((a, b) => b.profileViews - a.profileViews).slice(0, 10);

  // Referral growth
  const referralGrowth = {
    total: referrals.length,
    activated: referrals.filter((r) => r.status === "activated").length,
    credits: referrals.reduce((s, r) => s + r.creditsEarned, 0),
  };

  // Revenue by plan
  const planMap = new Map<string, { vendors: number; revenue: number }>();
  for (const s of subs) {
    const p = s.planTier || "free";
    const e = planMap.get(p) || { vendors: 0, revenue: 0 };
    e.vendors++; e.revenue += s.amountPaid || 0;
    planMap.set(p, e);
  }
  const revenueByPlan = [...planMap.entries()].map(([plan, d]) => ({ plan, ...d }));

  return {
    mostActiveVendors: mostActive,
    leastActiveVendors: leastActive,
    campaignUsage: campaigns.map((c) => ({ type: c.type, count: c._count })),
    aiUsage: aiLogs.map((a) => ({ feature: a.feature, count: a._count, tokens: a._sum.tokens || 0 })),
    topCities,
    topCategories,
    referralGrowth,
    revenueByPlan,
  };
}
