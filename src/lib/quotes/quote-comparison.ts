/**
 * AI Quote Comparison Service — V8 Marketplace Intelligence
 *
 * When a customer receives multiple quotes (via Multi-Vendor Enquiry),
 * Josh AI compares them and explains the tradeoffs in plain English.
 *
 * REUSES existing data:
 *   - Quote model (totalAmount, currency, status, lineItems)
 *   - Vendor model (rating, reviewCount, verified, featured)
 *   - VendorSubscription (premium status)
 */

import { db } from "@/lib/db";
import { getZAI } from "@/lib/zai-server";
import { callWithTimeout } from "@/lib/ai/security";
import { logger } from "@/lib/logger";

export interface QuoteWithVendor {
  quoteId: string;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  vendorRating: number;
  vendorReviewCount: number;
  vendorVerified: boolean;
  vendorFeatured: boolean;
  vendorPremium: boolean;
  totalAmount: number;
  currency: string;
  status: string;
  validUntil: string | null;
  lineItems: any[];
  aiNotes: string | null;
}

export interface QuoteComparison {
  quotes: QuoteWithVendor[];
  analysis: {
    bestValue: QuoteWithVendor | null;
    highestRated: QuoteWithVendor | null;
    fastestResponder: QuoteWithVendor | null;
    mostPremium: QuoteWithVendor | null;
    averagePrice: number;
    priceRange: { min: number; max: number };
  };
  aiSummary: string;
  recommendations: string[];
}

async function fetchQuotesForBooking(bookingId: string): Promise<QuoteWithVendor[]> {
  const quotes = await db.quote.findMany({
    where: { bookingId, status: { in: ["sent", "draft", "accepted"] } },
    orderBy: { totalAmount: "asc" },
  }).catch(() => []);

  if (quotes.length === 0) return [];

  const vendorIds = [...new Set(quotes.map((q) => q.vendorId))];
  const vendors = await db.vendor.findMany({
    where: { id: { in: vendorIds } },
    select: {
      id: true, name: true, slug: true, rating: true,
      reviewCount: true, verified: true, featured: true,
      subscriptions: {
        where: { status: "active", planExpiresAt: { gt: new Date() } },
        select: { planTier: true }, take: 1,
      },
    },
  }).catch(() => []);

  const vendorMap = new Map<string, any>();
  for (const v of vendors) { vendorMap.set((v as any).id, v); }

  return quotes.map((q) => {
    const vendor: any = vendorMap.get(q.vendorId) || {};
    let lineItems: any[] = [];
    try { lineItems = JSON.parse(q.lineItems || "[]"); } catch { lineItems = []; }
    return {
      quoteId: q.id, vendorId: q.vendorId,
      vendorName: vendor.name || "Unknown", vendorSlug: vendor.slug || "",
      vendorRating: vendor.rating || 0, vendorReviewCount: vendor.reviewCount || 0,
      vendorVerified: vendor.verified || false, vendorFeatured: vendor.featured || false,
      vendorPremium: (vendor.subscriptions?.[0]?.planTier === "business") || false,
      totalAmount: q.totalAmount, currency: q.currency, status: q.status,
      validUntil: q.validUntil?.toISOString() || null, lineItems, aiNotes: q.aiNotes,
    };
  });
}

function analyzeQuotes(quotes: QuoteWithVendor[]) {
  if (quotes.length === 0) return {
    bestValue: null, highestRated: null, fastestResponder: null,
    mostPremium: null, averagePrice: 0, priceRange: { min: 0, max: 0 },
  };
  const prices = quotes.map((q) => q.totalAmount);
  const sortedByPrice = [...quotes].sort((a, b) => a.totalAmount - b.totalAmount);
  const sortedByRating = [...quotes].sort((a, b) => b.vendorRating - a.vendorRating);
  const sortedByPremium = [...quotes].sort((a, b) => {
    if (a.vendorPremium && !b.vendorPremium) return -1;
    if (!a.vendorPremium && b.vendorPremium) return 1;
    return b.totalAmount - a.totalAmount;
  });
  const sortedByReviews = [...quotes].sort((a, b) => b.vendorReviewCount - a.vendorReviewCount);
  return {
    bestValue: sortedByPrice[0], highestRated: sortedByRating[0],
    fastestResponder: sortedByReviews[0], mostPremium: sortedByPremium[0],
    averagePrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
  };
}

async function generateAiSummary(quotes: QuoteWithVendor[], analysis: ReturnType<typeof analyzeQuotes>) {
  const zai = await getZAI();
  const quoteSummary = quotes.map((q, i) =>
    `Vendor ${String.fromCharCode(65 + i)}: ${q.vendorName} — ${q.currency} ${q.totalAmount}, ${q.vendorRating}★ (${q.vendorReviewCount} reviews), ${q.vendorVerified ? "Verified" : "Unverified"}, ${q.vendorPremium ? "Premium" : "Standard"}`
  ).join("\n");

  const fallbackRecs: string[] = [];
  if (analysis.bestValue) fallbackRecs.push(`Best Value: ${analysis.bestValue.vendorName} at ${analysis.bestValue.currency} ${analysis.bestValue.totalAmount}`);
  if (analysis.highestRated) fallbackRecs.push(`Highest Rated: ${analysis.highestRated.vendorName} (${analysis.highestRated.vendorRating}★)`);
  if (analysis.mostPremium) fallbackRecs.push(`Most Premium: ${analysis.mostPremium.vendorName}`);
  const fallbackSummary = `You received ${quotes.length} quotes ranging from ${analysis.priceRange.min} to ${analysis.priceRange.max}. ${fallbackRecs.join(". ")}.`;

  if (!zai) return { summary: fallbackSummary, recommendations: fallbackRecs };

  try {
    const { result: text, timedOut } = await callWithTimeout(async () => {
      const completion = await zai.chat.completions.create({
        messages: [{ role: "user", content: `Compare these vendor quotes and return ONLY JSON:\n${quoteSummary}\n\nReturn: {"summary":"2-3 sentences","recommendations":["3-4 bullet points"]}` }],
        thinking: { type: "disabled" as const },
      });
      return completion.choices[0]?.message?.content || "";
    }, 15_000);

    if (timedOut || !text) return { summary: fallbackSummary, recommendations: fallbackRecs };
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: String(parsed.summary || fallbackSummary),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String) : fallbackRecs,
      };
    }
  } catch {}
  return { summary: fallbackSummary, recommendations: fallbackRecs };
}

export async function compareQuotes(bookingId: string): Promise<QuoteComparison | null> {
  try {
    const quotes = await fetchQuotesForBooking(bookingId);
    if (quotes.length === 0) return {
      quotes: [],
      analysis: { bestValue: null, highestRated: null, fastestResponder: null, mostPremium: null, averagePrice: 0, priceRange: { min: 0, max: 0 } },
      aiSummary: "No quotes received yet. Vendors will respond shortly.",
      recommendations: ["Check back in a few hours for vendor responses."],
    };
    const analysis = analyzeQuotes(quotes);
    const { summary, recommendations } = await generateAiSummary(quotes, analysis);
    logger.info("quote-comparison", "Comparison generated", { bookingId, quoteCount: quotes.length });
    return { quotes, analysis, aiSummary: summary, recommendations };
  } catch (error: any) {
    logger.error("quote-comparison", "compareQuotes failed", error, { bookingId });
    return null;
  }
}
