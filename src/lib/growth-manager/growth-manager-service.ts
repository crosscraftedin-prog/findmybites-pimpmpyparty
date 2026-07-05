/**
 * AI Growth Manager Service (SERVER-ONLY)
 * ───────────────────────────────────────────────────────────────────────────
 * The vendor's virtual business manager. Generates:
 * - Daily AI business report (yesterday's summary + AI insights)
 * - AI growth actions (actionable tasks with estimated impact)
 * - AI SEO scan (missing keywords, meta problems, thin descriptions)
 * - AI product optimizer (per-product optimization score + suggestions)
 * - AI review reply suggestions (professional/friendly/luxury/funny/custom)
 * - AI price advisor (compare with peers, recommend price changes)
 * - AI demand forecast (busy weekends, festival seasons)
 * - AI content library (store & reuse all AI generations)
 * - AI chat coach (vendor asks questions, AI answers using their data)
 *
 * Reuses: success-service, growth-service, marketing-ai-service, seo-service,
 * inventory-service. Uses getZAI() for LLM calls.
 * ⚠️ Imports db + z-ai-web-dev-sdk — server-only.
 */
import { getZAI } from "@/lib/zai-server";
import { db } from "@/lib/db";
import { getSuccessCenterData } from "@/lib/success/success-service";
import { getKpiComparison, getAnalyticsSeries, getCompetitorInsights } from "@/lib/marketing/growth-service";
import { sanitizePrompt, callWithTimeout } from "@/lib/ai/security";
import { logger } from "@/lib/logger";

// ── LLM helper (with timeout + prompt injection protection) ──────────────────
async function callLLM(prompt: string): Promise<string | null> {
  // Sanitize user-supplied content
  const userContentMatch = prompt.match(/(?:sentence|Vendor context|Business name|Marketplace|Category|review|comment|message|question)[\s\S]*$/i);
  if (userContentMatch) {
    const sanitizeResult = sanitizePrompt(userContentMatch[0]);
    if (sanitizeResult.blocked) {
      logger.warn("growth-manager", "Prompt injection blocked", { reason: sanitizeResult.reason });
      return null;
    }
  }

  const zai = await getZAI();
  if (!zai) return null;
  try {
    const { result, timedOut } = await callWithTimeout(async () => {
      const completion = await zai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        thinking: { type: "disabled" },
      });
      return completion.choices[0]?.message?.content || "";
    }, 30_000);

    if (timedOut) {
      logger.warn("growth-manager", "LLM call timed out after 30s");
      return null;
    }
    return result;
  } catch (err) {
    logger.error("growth-manager", "LLM call failed", { message: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

function extractJson(text: string): any | null {
  try { const m = text.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch {}
  return null;
}

// ── 1. Daily AI Business Report ──────────────────────────────────────────────

export interface DailyReport {
  greeting: string;
  yesterday: { profileViews: number; productViews: number; enquiries: number; bookings: number; revenue: number; profileViewsTrend: number };
  aiSummary: string;
  insights: string[];
  topProduct: string | null;
  peakHours: string;
}

export async function getDailyReport(vendorId: string): Promise<DailyReport> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, name: true, ecosystem: true, category: true, city: true },
  });
  if (!vendor) throw new Error("Vendor not found");

  const kpi = await getKpiComparison(vendorId, "daily").catch(() => null);
  const series = await getAnalyticsSeries(vendorId, 7).catch(() => []);
  const topProducts = await db.product.findMany({
    where: { vendorId },
    select: { name: true, views: true, orderCount: true },
    orderBy: { views: "desc" }, take: 5,
  }).catch(() => []);

  const yesterday = kpi?.current || { profileViews: 0, productViews: 0, enquiries: 0, bookings: 0, revenue: 0, conversionRate: 0 };
  const trend = kpi?.delta?.profileViews ?? 0;
  const topProduct = topProducts[0]?.name || null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // AI summary
  const prompt = `You are a business coach for ${vendor.name}, a ${vendor.category} in ${vendor.city}.
Yesterday's stats: ${yesterday.profileViews} profile views (${trend > 0 ? "+" : ""}${trend}% vs day before), ${yesterday.productViews} product views, ${yesterday.enquiries} enquiries, ${yesterday.bookings} bookings, ₹${(yesterday.revenue / 100).toLocaleString()} revenue.
Top product: ${topProduct || "N/A"}.

Write a 2-3 sentence encouraging summary of their performance. Be specific. Return ONLY plain text, no JSON.`;

  const aiSummaryText = await callLLM(prompt);
  const aiSummary = aiSummaryText || `You received ${trend > 0 ? `${trend}% more` : "fewer"} visitors than the day before. ${topProduct ? `${topProduct} generated the most interest.` : "Keep adding products to attract more customers."} Customers typically search between 7PM-10PM.`;

  const insights = [
    `${yesterday.profileViews} profile views (${trend > 0 ? "↑" : "↓"} ${Math.abs(trend)}%)`,
    `${yesterday.productViews} product views`,
    `${yesterday.enquiries} enquiries`,
    `${yesterday.bookings} booking${yesterday.bookings !== 1 ? "s" : ""}`,
    `₹${(yesterday.revenue / 100).toLocaleString()} revenue`,
  ];

  return {
    greeting: `${greeting}, ${vendor.name.split(" ")[0]} 👋`,
    yesterday: { ...yesterday, profileViewsTrend: trend },
    aiSummary,
    insights,
    topProduct,
    peakHours: "7PM - 10PM",
  };
}

// ── 2. AI Growth Actions ─────────────────────────────────────────────────────

export interface GrowthAction {
  id: string;
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
  estimatedImpact: string;
  fixAction: string;
  fixTab: string;
}

export async function getGrowthActions(vendorId: string): Promise<GrowthAction[]> {
  const data = await getSuccessCenterData(vendorId);
  // Convert recommendations into actionable tasks with estimated impact
  return data.recommendations.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    priority: r.priority as "high" | "medium" | "low",
    estimatedImpact: r.expectedImpact,
    fixAction: r.fixAction,
    fixTab: r.fixTab,
  }));
}

// ── 3. AI SEO Manager ────────────────────────────────────────────────────────

export interface SeoIssue {
  type: string;
  severity: "critical" | "warning" | "info";
  detail: string;
  fixAvailable: boolean;
}

export async function getSeoScan(vendorId: string): Promise<{ score: number; issues: SeoIssue[] }> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { metaTitle: true, metaDescription: true, description: true, tags: true, name: true, category: true, city: true },
  });
  if (!vendor) throw new Error("Vendor not found");

  let tags: string[] = [];
  try { tags = JSON.parse(vendor.tags || "[]"); } catch {}

  const issues: SeoIssue[] = [];

  if (!vendor.metaTitle) issues.push({ type: "Missing Meta Title", severity: "critical", detail: "No SEO title set — Google won't rank your page", fixAvailable: true });
  else if (vendor.metaTitle.length < 30) issues.push({ type: "Short Meta Title", severity: "warning", detail: `Title is ${vendor.metaTitle.length} chars (aim for 50-60)`, fixAvailable: true });

  if (!vendor.metaDescription) issues.push({ type: "Missing Meta Description", severity: "critical", detail: "No meta description — customers won't click your Google result", fixAvailable: true });
  else if (vendor.metaDescription.length < 120) issues.push({ type: "Thin Description", severity: "warning", detail: `Description is ${vendor.metaDescription.length} chars (aim for 140-160)`, fixAvailable: true });

  if (!vendor.description || vendor.description.length < 80) issues.push({ type: "Thin Content", severity: "warning", detail: "Business description is too short for SEO", fixAvailable: true });
  if (tags.length < 5) issues.push({ type: "Missing Keywords", severity: "warning", detail: `Only ${tags.length} tags (aim for 8-10)`, fixAvailable: true });
  if (!vendor.description?.toLowerCase().includes(vendor.city?.toLowerCase() || "")) issues.push({ type: "Missing City", severity: "info", detail: "Description doesn't mention your city", fixAvailable: false });

  const score = Math.max(0, 100 - (issues.filter(i => i.severity === "critical").length * 25) - (issues.filter(i => i.severity === "warning").length * 10));
  return { score, issues };
}

// ── 4. AI Product Optimizer ──────────────────────────────────────────────────

export interface ProductOptimization {
  productId: string;
  name: string;
  score: number;
  suggestions: string[];
  improvedTitle?: string;
  improvedDescription?: string;
}

export async function optimizeProduct(productId: string, vendorId: string): Promise<ProductOptimization> {
  const product = await db.product.findFirst({
    where: { id: productId, vendorId },
    select: { id: true, name: true, description: true, price: true, image: true, images: true, weight: true, flavours: true, tags: true, views: true, orderCount: true, enquiryCount: true },
  });
  if (!product) throw new Error("Product not found");

  let images: string[] = [];
  try { images = product.images ? JSON.parse(product.images) : []; } catch {}
  let tags: string[] = [];
  try { tags = product.tags ? JSON.parse(product.tags) : []; } catch {}

  // Calculate score
  let score = 40;
  if (product.name && product.name.length >= 10) score += 10;
  if (product.description && product.description.length >= 50) score += 15;
  if (images.length >= 3) score += 15;
  if (product.weight) score += 5;
  if (product.flavours) score += 5;
  if (tags.length >= 3) score += 10;

  const suggestions: string[] = [];
  if (!product.name || product.name.length < 10) suggestions.push("Better title — add descriptive keywords");
  if (images.length < 3) suggestions.push(`Add ${3 - images.length} more photos`);
  if (!product.weight) suggestions.push("Mention weight/serving size");
  if (!product.flavours) suggestions.push("Mention available flavours");
  if (tags.length < 3) suggestions.push("Improve keywords — add 3+ tags");
  if (!product.description || product.description.length < 50) suggestions.push("Improve description — add more detail");
  if (suggestions.length === 0) suggestions.push("Great product! Consider running a promotion");

  // AI improved version
  const prompt = `Improve this product listing for a marketplace:
Name: ${product.name}
Description: ${product.description || "N/A"}
Price: ${product.price}
Category: ${(product as any).category || "N/A"}

Return ONLY JSON: {"improvedTitle":"better SEO-optimized title (max 60 chars)","improvedDescription":"100-150 word compelling description"}`;

  const text = await callLLM(prompt);
  const parsed = extractJson(text || "");

  return {
    productId: product.id,
    name: product.name,
    score,
    suggestions,
    improvedTitle: parsed?.improvedTitle,
    improvedDescription: parsed?.improvedDescription,
  };
}

// ── 5. AI Review Reply ───────────────────────────────────────────────────────

export async function generateReviewReply(reviewId: string, vendorId: string, style: string): Promise<string> {
  const review = await db.review.findFirst({
    where: { id: reviewId, vendorId },
    select: { author: true, rating: true, comment: true },
  });
  if (!review) throw new Error("Review not found");

  const vendor = await db.vendor.findUnique({ where: { id: vendorId }, select: { name: true } });

  const styleMap: Record<string, string> = {
    professional: "Write in a professional, courteous tone.",
    friendly: "Write in a warm, friendly, casual tone.",
    luxury: "Write in an elegant, luxury tone befitting a premium brand.",
    funny: "Write in a light-hearted, funny tone with a touch of humor.",
    custom: "Write in a natural, personalized tone.",
  };

  const prompt = `Write a reply to this customer review for ${vendor?.name || "our business"}.
${styleMap[style] || styleMap.professional}

Review by ${review.author}: ${review.rating}★
"${review.comment}"

Return ONLY the reply text (no JSON, no quotes). Max 100 words. Address the customer by name.`;

  const text = await callLLM(prompt);
  return text || `Hi ${review.author}, thank you so much for your ${review.rating}-star review! We truly appreciate your feedback and look forward to serving you again. — ${vendor?.name || "The Team"}`;
}

// ── 6. AI Price Advisor ──────────────────────────────────────────────────────

export interface PriceAdvice {
  status: "too_cheap" | "competitive" | "premium";
  recommendation: string;
  estimatedRevenueChange: string;
  averagePeerPrice: number;
  yourAveragePrice: number;
}

export async function getPriceAdvice(vendorId: string): Promise<PriceAdvice> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, category: true, ecosystem: true, city: true, basePrice: true, priceRange: true },
  });
  if (!vendor) throw new Error("Vendor not found");

  const products = await db.product.findMany({
    where: { vendorId, status: "active" },
    select: { price: true },
  }).catch(() => []);

  const yourAvg = products.length > 0 ? Math.round(products.reduce((s, p) => s + p.price, 0) / products.length) : vendor.basePrice || 0;

  // Peer average
  const peerProducts = await db.product.findMany({
    where: { vendor: { category: vendor.category, ecosystem: vendor.ecosystem, id: { not: vendorId } }, status: "active" },
    select: { price: true },
    take: 100,
  }).catch(() => []);

  const peerAvg = peerProducts.length > 0 ? Math.round(peerProducts.reduce((s, p) => s + p.price, 0) / peerProducts.length) : yourAvg;

  let status: "too_cheap" | "competitive" | "premium" = "competitive";
  if (yourAvg < peerAvg * 0.85) status = "too_cheap";
  else if (yourAvg > peerAvg * 1.15) status = "premium";

  const recommendation = status === "too_cheap"
    ? `Your prices are ${Math.round((1 - yourAvg / peerAvg) * 100)}% below market average. Consider increasing by 8-12% to match competitors.`
    : status === "premium"
    ? `Your prices are ${Math.round((yourAvg / peerAvg - 1) * 100)}% above market average. You're positioned as premium — ensure your quality matches.`
    : "Your prices are competitive with similar vendors in your category.";

  const estimatedRevenueChange = status === "too_cheap"
    ? `+₹${Math.round(yourAvg * 0.08 * 10 / 100).toLocaleString()}/month estimated`
    : status === "premium"
    ? "Maintain quality to justify premium pricing"
    : "Prices are optimal";

  return { status, recommendation, estimatedRevenueChange, averagePeerPrice: peerAvg, yourAveragePrice: yourAvg };
}

// ── 7. AI Demand Forecast ────────────────────────────────────────────────────

export interface DemandForecast {
  upcoming: { event: string; date: string; demandLevel: "high" | "medium" | "low"; recommendation: string }[];
}

export async function getDemandForecast(vendorId: string): Promise<DemandForecast> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { ecosystem: true, city: true, country: true },
  });
  if (!vendor) throw new Error("Vendor not found");

  const now = new Date();
  const upcoming: DemandForecast["upcoming"] = [];
  const isFood = vendor.ecosystem === "FINDMYBITES";

  // Festival-based forecast
  const festivals = [
    { event: "Wedding Season", month: 11, demand: "high" as const, rec: "Stock up on wedding cakes and catering supplies" },
    { event: "Diwali", month: 10, demand: "high" as const, rec: "Prepare sweet boxes and festival hampers" },
    { event: "Christmas", month: 11, demand: "high" as const, rec: "Stock plum cakes and themed desserts" },
    { event: "Valentine's Day", month: 1, demand: "high" as const, rec: "Prepare heart-shaped cakes and couples packages" },
    { event: "Eid", month: 3, demand: "medium" as const, rec: "Prepare sheer khurma and festival sweets" },
    { event: "Raksha Bandhan", month: 7, demand: "medium" as const, rec: "Prepare rakhi thali and sweet boxes" },
  ];

  for (const f of festivals) {
    const festDate = new Date(now.getFullYear(), f.month, 15);
    if (festDate < now) festDate.setFullYear(now.getFullYear() + 1);
    const daysUntil = Math.ceil((festDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 90) {
      upcoming.push({ event: f.event, date: festDate.toLocaleDateString("en-US", { day: "numeric", month: "short" }), demandLevel: f.demand, recommendation: f.rec });
    }
  }

  // Weekend forecast
  const nextSaturday = new Date(now);
  nextSaturday.setDate(now.getDate() + ((6 - now.getDay()) || 7));
  upcoming.push({ event: "Weekend", date: nextSaturday.toLocaleDateString("en-US", { day: "numeric", month: "short" }), demandLevel: "medium", recommendation: "Prepare for weekend event bookings" });

  return { upcoming: upcoming.slice(0, 5) };
}

// ── 8. AI Content Library ────────────────────────────────────────────────────

export interface ContentLibraryItem {
  id: string;
  type: string;
  content: string;
  createdAt: string;
}

export async function getContentLibrary(vendorId: string): Promise<ContentLibraryItem[]> {
  const logs = await db.aiGenerationLog.findMany({
    where: { vendorId, feature: { in: ["listing_description", "setup_assistant", "social_post", "email_campaign", "whatsapp_msg", "campaign_copy", "growth_advisor"] } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, feature: true, createdAt: true },
  }).catch(() => []);

  return logs.map((l) => ({
    id: l.id,
    type: l.feature,
    content: `${l.feature} generation`,
    createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : String(l.createdAt),
  }));
}

// ── 9. AI Chat Coach ─────────────────────────────────────────────────────────

export async function chatWithCoach(vendorId: string, message: string): Promise<string> {
  const data = await getSuccessCenterData(vendorId);
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    select: { name: true, category: true, city: true, ecosystem: true },
  });

  const context = `
Vendor: ${vendor?.name} (${vendor?.category} in ${vendor?.city})
Business Health: ${data.overallHealth}/100
Profile Score: ${data.scores.find(s => s.key === "profile")?.score || 0}
SEO Score: ${data.scores.find(s => s.key === "seo")?.score || 0}
Reviews Score: ${data.scores.find(s => s.key === "reviews")?.score || 0}
Products Score: ${data.scores.find(s => s.key === "products")?.score || 0}
Checklist: ${data.checklist.completed}/${data.checklist.total} completed
Top recommendations: ${data.recommendations.slice(0, 3).map(r => r.title).join("; ")}
Recent performance: ${data.performance.weekly.map(m => `${m.label}: ${m.value}`).join(", ")}
`;

  const prompt = `You are Josh, an AI business coach for ${vendor?.name}, a ${vendor?.category} in ${vendor?.city}.

Vendor's business data:
${context}

The vendor asks: "${message}"

Answer as their personal business coach. Be specific, actionable, and encouraging. Use their actual data to give personalized advice. Max 200 words. Return ONLY plain text.`;

  const text = await callLLM(prompt);
  return text || "I'm here to help you grow your business! Based on your current scores, I'd recommend focusing on completing your profile and adding more products to increase visibility.";
}

// ── 10. Competitor Watch ─────────────────────────────────────────────────────

export interface CompetitorAlert {
  metric: string;
  you: number | string;
  peer: number | string;
  opportunity: string;
}

export async function getCompetitorWatch(vendorId: string): Promise<CompetitorAlert[]> {
  const competitors = await getCompetitorInsights(vendorId).catch(() => null);
  if (!competitors) return [];

  const alerts: CompetitorAlert[] = [];
  if (competitors.you.popularity < competitors.peerAverage.popularity) {
    alerts.push({ metric: "Profile Views", you: competitors.you.popularity, peer: competitors.peerAverage.popularity, opportunity: "Improve SEO and add more content to match peers" });
  }
  if (competitors.you.products < competitors.peerAverage.products) {
    alerts.push({ metric: "Products", you: competitors.you.products, peer: competitors.peerAverage.products, opportunity: `Add ${Math.ceil(competitors.peerAverage.products - competitors.you.products)} more products` });
  }
  if (competitors.you.rating < competitors.peerAverage.rating) {
    alerts.push({ metric: "Rating", you: competitors.you.rating, peer: competitors.peerAverage.rating, opportunity: "Request more 5-star reviews from happy customers" });
  }
  return alerts;
}
