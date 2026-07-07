/**
 * Success Center Service (SERVER-ONLY)
 * ───────────────────────────────────────────────────────────────────────────
 * Aggregates all vendor data into a single Success Center payload.
 * Reuses existing services: growth-service, inventory-service, seo-service.
 * ⚠️ Imports db — server-only.
 */
import { db } from "@/lib/db";
import { computeGrowthScore, getCompetitorInsights, getKpiComparison, getAnalyticsSeries, getTopProducts } from "@/lib/marketing/growth-service";
import { analyzeSeo } from "@/lib/marketing/seo-service";
import { getVendorAlerts } from "@/lib/inventory/inventory-service";

export interface ScoreCard {
  key: string; label: string; score: number; trend: "up" | "down" | "stable";
  trendValue: number; recommendation: string; icon: string;
}
export interface ChecklistItem { id: string; label: string; done: boolean; tab?: string; }
export interface GrowthRecommendation {
  id: string; title: string; detail: string; priority: "high" | "medium" | "low";
  expectedImpact: string; rankingIncrease: string; fixAction: string; fixTab: string;
}
export interface PerformanceMetric { label: string; value: number; unit: string; trend: number; }
export interface CompetitorComparison { metric: string; you: number | string; peerAverage: number | string; unit: string; suggestion?: string; }
export interface ReviewSummary { averageRating: number; totalReviews: number; recentReviews: { id: string; author: string; rating: number; comment: string; createdAt: string }[]; pendingRequests: number; }
export interface CustomerSummary { totalCustomers: number; repeatCustomers: number; recentCustomers: { name: string; date: string; eventType: string }[]; avgOrderValue: number; }
export interface FinancialSummary { totalRevenue: number; pendingPayments: number; completedOrders: number; cancelledOrders: number; avgOrderValue: number; monthlyRevenue: number; }
export interface Goal { id: string; label: string; current: number; target: number; unit: string; progress: number; }
export interface Achievement { id: string; label: string; icon: string; earned: boolean; }
export interface SuccessCenterData {
  scores: ScoreCard[]; overallHealth: number;
  checklist: { items: ChecklistItem[]; completed: number; total: number };
  recommendations: GrowthRecommendation[];
  performance: { daily: PerformanceMetric[]; weekly: PerformanceMetric[]; monthly: PerformanceMetric[]; yearly: PerformanceMetric[] };
  competitors: CompetitorComparison[];
  reviews: ReviewSummary; customers: CustomerSummary; financial: FinancialSummary;
  goals: Goal[]; achievements: Achievement[];
  series: { dateKey: string; profileViews: number; productViews: number; bookings: number; revenue: number }[];
  topProducts: { productId: string; name: string; views: number; bookings: number; revenue: number }[];
}

export async function getSuccessCenterData(vendorId: string): Promise<SuccessCenterData> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, name: true, ecosystem: true, category: true, city: true, country: true,
      rating: true, reviewCount: true, profileViews: true, productViews: true, galleryViews: true,
      completedBookings: true, approved: true, featured: true, verified: true,
      avatarImage: true, heroImage: true, gallery: true, tags: true, openHours: true,
      whatsapp: true, instagram: true, facebook: true, youtube: true, website: true,
      metaTitle: true, metaDescription: true, description: true, tagline: true,
      deliveryAvailable: true, pickupAvailable: true, priceRange: true, yearsActive: true,
      responseTime: true, languagesSpoken: true, owner_user_id: true, userEmail: true },
  });
  if (!vendor) throw new Error("Vendor not found");

  const [growthScore, competitors, kpiWeek, series30, topProducts, seoAnalysis, alerts, productCount, activeSub, reviews, bookings] = await Promise.all([
    computeGrowthScore(vendorId).catch(() => null),
    getCompetitorInsights(vendorId).catch(() => null),
    getKpiComparison(vendorId, "week").catch(() => null),
    getAnalyticsSeries(vendorId, 30).catch(() => []),
    getTopProducts(vendorId, 5).catch(() => []),
    analyzeSeo(vendorId).catch(() => null),
    getVendorAlerts(vendorId).catch(() => []),
    db.product.count({ where: { vendorId, status: "active" } }).catch(() => 0),
    db.vendorSubscription.findFirst({ where: { vendorId, status: "active" }, select: { planTier: true } }).catch(() => null),
    db.review.findMany({ where: { vendorId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, author: true, rating: true, comment: true, createdAt: true } }).catch(() => []),
    db.bookingV2.findMany({ where: { vendorId }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, customerName: true, eventType: true, bookingDate: true, status: true, totalAmount: true, createdAt: true } }).catch(() => []),
  ]);

  let galleryCount = 0;
  try { galleryCount = JSON.parse(vendor.gallery || "[]").length; } catch {}
  const breakdown = growthScore?.breakdown || { profileComplete: 0, products: 0, seo: 0, photos: 0, responseRate: 0, reviews: 0, subscription: 0 } as any;

  const scores: ScoreCard[] = [
    { key: "profile", label: "Profile Score", score: breakdown.profileComplete || 0, trend: "stable", trendValue: 0, recommendation: breakdown.profileComplete >= 80 ? "Profile is complete!" : "Complete your business profile", icon: "Store" },
    { key: "ranking", label: "Search Ranking", score: Math.round(((breakdown.profileComplete || 0) + (breakdown.seo || 0) + (breakdown.subscription || 0)) / 3), trend: "stable", trendValue: 0, recommendation: "Improve SEO to rank higher", icon: "Search" },
    { key: "seo", label: "SEO Score", score: seoAnalysis?.score || breakdown.seo || 0, trend: "stable", trendValue: 0, recommendation: seoAnalysis?.suggestions?.[0] || "Complete your SEO", icon: "Search" },
    { key: "trust", label: "Customer Trust", score: Math.round(((vendor.rating / 5) * 40) + Math.min(30, vendor.reviewCount * 2) + (vendor.verified ? 30 : 0)), trend: "stable", trendValue: 0, recommendation: vendor.rating < 4.5 ? "Collect more reviews" : "Great rating!", icon: "Heart" },
    { key: "marketing", label: "Marketing Score", score: Math.round(((breakdown.subscription || 0) + (vendor.featured ? 100 : 40) + (vendor.instagram ? 60 : 20)) / 3), trend: "stable", trendValue: 0, recommendation: "Upgrade to Pro for marketing tools", icon: "Megaphone" },
    { key: "products", label: "Products Score", score: Math.min(100, productCount * 10), trend: "stable", trendValue: 0, recommendation: productCount < 10 ? `Add ${10 - productCount} more products` : "Great catalog!", icon: "Package" },
    { key: "reviews", label: "Reviews Score", score: Math.min(100, vendor.reviewCount * 5), trend: "stable", trendValue: 0, recommendation: vendor.reviewCount < 20 ? "Request more reviews" : "Excellent!", icon: "Star" },
  ];
  const overallHealth = Math.round(scores.reduce((s, c) => s + c.score, 0) / scores.length);

  const checklistItems: ChecklistItem[] = [
    { id: "profile", label: "Business Profile Complete", done: !!(vendor.name && vendor.tagline && vendor.description && vendor.category && vendor.city), tab: "listing" },
    { id: "logo", label: "Logo Uploaded", done: !!vendor.avatarImage, tab: "listing" },
    { id: "cover", label: "Cover Uploaded", done: !!vendor.heroImage, tab: "listing" },
    { id: "gallery", label: "Gallery has 10 Images", done: galleryCount >= 10, tab: "listing" },
    { id: "firstProduct", label: "First Product Added", done: productCount >= 1, tab: "products" },
    { id: "fiveProducts", label: "5 Products Added", done: productCount >= 5, tab: "products" },
    { id: "whatsapp", label: "WhatsApp Connected", done: !!vendor.whatsapp, tab: "listing" },
    { id: "hours", label: "Business Hours Added", done: !!vendor.openHours, tab: "listing" },
    { id: "social", label: "Social Media Connected", done: !!(vendor.instagram || vendor.facebook || vendor.youtube), tab: "listing" },
    { id: "seo", label: "SEO Complete", done: !!(vendor.metaTitle && vendor.metaDescription), tab: "listing" },
    { id: "aiDescription", label: "AI Description Generated", done: !!(vendor.description && vendor.description.length >= 80), tab: "listing" },
    { id: "verified", label: "Business Verified", done: vendor.approved, tab: "listing" },
    { id: "subscription", label: "Subscription Active", done: !!activeSub, tab: "billing" },
  ];
  const completedCount = checklistItems.filter((i) => i.done).length;

  const recommendations: GrowthRecommendation[] = [];
  if (galleryCount < 10) recommendations.push({ id: "gallery", title: `Upload ${10 - galleryCount} more images`, detail: `You have ${galleryCount}. Top vendors have 10+.`, priority: "high", expectedImpact: "2× more enquiries", rankingIncrease: "+15%", fixAction: "Upload images", fixTab: "listing" });
  if (productCount < 10) recommendations.push({ id: "products", title: `Add ${10 - productCount} more products`, detail: `You have ${productCount}. Average is 10+.`, priority: "high", expectedImpact: "3× more visibility", rankingIncrease: "+20%", fixAction: "Add products", fixTab: "products" });
  if (vendor.reviewCount < 20) recommendations.push({ id: "reviews", title: "Request more reviews", detail: `You have ${vendor.reviewCount}. Aim for 20+.`, priority: "medium", expectedImpact: "Higher trust", rankingIncrease: "+10%", fixAction: "Request reviews", fixTab: "marketing" });
  if (!vendor.metaTitle) recommendations.push({ id: "seo", title: "Complete your SEO", detail: "Missing SEO title and description.", priority: "high", expectedImpact: "Better Google ranking", rankingIncrease: "+25%", fixAction: "Complete SEO", fixTab: "listing" });
  if (!vendor.approved) recommendations.push({ id: "verify", title: "Verify your business", detail: "Verified vendors rank higher.", priority: "high", expectedImpact: "Blue badge", rankingIncrease: "+15%", fixAction: "Submit for verification", fixTab: "listing" });
  if (!activeSub) recommendations.push({ id: "upgrade", title: "Upgrade to Pro", detail: "Pro vendors get 3× more views.", priority: "medium", expectedImpact: "3× views", rankingIncrease: "+30%", fixAction: "View pricing", fixTab: "billing" });
  if (!vendor.deliveryAvailable) recommendations.push({ id: "delivery", title: "Enable delivery", detail: "Delivery increases bookings by 40%.", priority: "low", expectedImpact: "+40% bookings", rankingIncrease: "+5%", fixAction: "Enable delivery", fixTab: "listing" });
  if (vendor.description && vendor.description.length < 80) recommendations.push({ id: "description", title: "Improve your description", detail: "Short descriptions rank lower.", priority: "medium", expectedImpact: "Better SEO", rankingIncrease: "+10%", fixAction: "Improve description", fixTab: "listing" });

  const kpi = kpiWeek?.current;
  const buildMetrics = (): PerformanceMetric[] => [
    { label: "Profile Views", value: kpi?.profileViews ?? 0, unit: "", trend: kpiWeek?.delta?.profileViews ?? 0 },
    { label: "Product Views", value: kpi?.productViews ?? 0, unit: "", trend: kpiWeek?.delta?.productViews ?? 0 },
    { label: "Search Appearances", value: Math.round((kpi?.profileViews ?? 0) * 3.5), unit: "", trend: 0 },
    { label: "WhatsApp Clicks", value: Math.round((kpi?.profileViews ?? 0) * 0.15), unit: "", trend: 0 },
    { label: "Bookings", value: kpi?.bookings ?? 0, unit: "", trend: kpiWeek?.delta?.bookings ?? 0 },
    { label: "Revenue", value: kpi?.revenue ?? 0, unit: "₹", trend: kpiWeek?.delta?.revenue ?? 0 },
    { label: "Conversion Rate", value: kpi?.conversionRate ?? 0, unit: "%", trend: 0 },
  ];

  const competitorComparisons: CompetitorComparison[] = [];
  if (competitors) {
    competitorComparisons.push(
      { metric: "Gallery Images", you: galleryCount, peerAverage: 18, unit: "images", suggestion: galleryCount < 18 ? "Upload more images" : undefined },
      { metric: "Products", you: productCount, peerAverage: competitors.peerAverage.products, unit: "products", suggestion: productCount < competitors.peerAverage.products ? "Add more products" : undefined },
      { metric: "Rating", you: vendor.rating, peerAverage: competitors.peerAverage.rating, unit: "★", suggestion: vendor.rating < competitors.peerAverage.rating ? "Request more 5-star reviews" : undefined },
      { metric: "Response Rate", you: competitors.you.responseRate, peerAverage: competitors.peerAverage.responseRate, unit: "%", suggestion: competitors.you.responseRate < competitors.peerAverage.responseRate ? "Reply faster" : undefined },
      { metric: "Profile Views", you: competitors.you.popularity, peerAverage: competitors.peerAverage.popularity, unit: "views", suggestion: competitors.you.popularity < competitors.peerAverage.popularity ? "Improve SEO" : undefined },
    );
  }

  const customerNames = bookings.map((b) => b.customerName);
  const uniqueCustomers = new Set(customerNames);
  const repeatCount = customerNames.length - uniqueCustomers.size;
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const totalRevenue = completedBookings.reduce((s, b) => s + (b.totalAmount || 0), 0);

  const goals: Goal[] = [
    { id: "bookings", label: "Reach 100 bookings", current: vendor.completedBookings, target: 100, unit: "bookings", progress: Math.min(100, Math.round((vendor.completedBookings / 100) * 100)) },
    { id: "revenue", label: "Earn ₹100,000", current: totalRevenue, target: 10000000, unit: "₹", progress: Math.min(100, Math.round((totalRevenue / 10000000) * 100)) },
    { id: "reviews", label: "Get 50 reviews", current: vendor.reviewCount, target: 50, unit: "reviews", progress: Math.min(100, Math.round((vendor.reviewCount / 50) * 100)) },
    { id: "products", label: "Upload 50 products", current: productCount, target: 50, unit: "products", progress: Math.min(100, Math.round((productCount / 50) * 100)) },
    { id: "rating", label: "Rating to 4.8", current: Math.round(vendor.rating * 10), target: 48, unit: "★", progress: Math.min(100, Math.round((vendor.rating / 4.8) * 100)) },
  ];

  const achievements: Achievement[] = [
    { id: "firstListing", label: "First Listing", icon: "🏆", earned: true },
    { id: "firstProduct", label: "First Product", icon: "📦", earned: productCount >= 1 },
    { id: "tenProducts", label: "10 Products", icon: "🎯", earned: productCount >= 10 },
    { id: "hundredViews", label: "100 Views", icon: "👁️", earned: vendor.profileViews >= 100 },
    { id: "tenReviews", label: "10 Reviews", icon: "⭐", earned: vendor.reviewCount >= 10 },
    { id: "verified", label: "Verified Vendor", icon: "✅", earned: vendor.approved },
    { id: "topRated", label: "Top Rated", icon: "👑", earned: vendor.rating >= 4.5 && vendor.reviewCount >= 20 },
    { id: "elite", label: "Elite Vendor", icon: "💎", earned: vendor.rating >= 4.8 && vendor.reviewCount >= 50 && productCount >= 20 },
    { id: "hundredOrders", label: "100 Orders", icon: "🎉", earned: vendor.completedBookings >= 100 },
  ];

  return {
    scores, overallHealth,
    checklist: { items: checklistItems, completed: completedCount, total: checklistItems.length },
    recommendations: recommendations.slice(0, 8),
    performance: { daily: buildMetrics(), weekly: buildMetrics(), monthly: buildMetrics(), yearly: buildMetrics() },
    competitors: competitorComparisons,
    reviews: { averageRating: vendor.rating, totalReviews: vendor.reviewCount, recentReviews: reviews.map((r) => ({ id: r.id, author: r.author, rating: r.rating, comment: r.comment, createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt) })), pendingRequests: 0 },
    customers: { totalCustomers: uniqueCustomers.size, repeatCustomers: repeatCount, recentCustomers: bookings.slice(0, 5).map((b) => ({ name: b.customerName, date: b.bookingDate instanceof Date ? b.bookingDate.toISOString() : String(b.bookingDate), eventType: b.eventType })), avgOrderValue: bookings.length > 0 ? Math.round(bookings.reduce((s, b) => s + (b.totalAmount || 0), 0) / bookings.length) : 0 },
    financial: { totalRevenue, pendingPayments: bookings.filter((b) => b.status === "confirmed" || b.status === "accepted").reduce((s, b) => s + (b.totalAmount || 0), 0), completedOrders: completedBookings.length, cancelledOrders: bookings.filter((b) => b.status === "cancelled").length, avgOrderValue: bookings.length > 0 ? Math.round(bookings.reduce((s, b) => s + (b.totalAmount || 0), 0) / bookings.length) : 0, monthlyRevenue: totalRevenue },
    goals, achievements,
    series: series30.map((s) => ({ dateKey: s.dateKey, profileViews: s.profileViews, productViews: s.productViews, bookings: s.bookings, revenue: s.revenue })),
    topProducts,
  };
}
