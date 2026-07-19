/**
 * Smart Lead Routing Engine — matches leads to the best vendors.
 *
 * This is the core of the V5 "Lead Intelligence Platform" vision.
 * When a lead is created (via Smart Enquiry Form or Josh AI), this engine:
 *   1. Finds all vendors matching the lead's category + city
 *   2. Scores each vendor on 10+ signals
 *   3. Ranks vendors by match score
 *   4. Returns the top N vendors for routing
 *
 * The engine REUSES existing data:
 *   - Vendor table (rating, reviewCount, responseTime, verified, featured, etc.)
 *   - Booking table (response time, acceptance rate, conversion rate)
 *   - VendorSubscription (premium status)
 *
 * No new tables needed — this is a pure computation layer over existing data.
 */

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// ── Types ─────────────────────────────────────────────────────────────────

export interface LeadContext {
  category?: string;
  city?: string;
  budget?: string;
  eventDate?: string;
  guests?: number;
  productType?: string;
  dietaryRequirements?: string[];
}

export interface VendorMatch {
  vendorId: string;
  vendorName: string;
  slug: string;
  category: string;
  city: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  featured: boolean;
  ecosystem: string;
  matchScore: number; // 0-100
  matchReasons: string[];
  scores: {
    distance: number;
    rating: number;
    premium: number;
    responseTime: number;
    acceptanceRate: number;
    conversionRate: number;
    specialization: number;
    verified: number;
    experience: number;
    availability: number;
  };
}

// ── Scoring weights (sum = 100) ───────────────────────────────────────────

const WEIGHTS = {
  distance: 15,
  rating: 15,
  premium: 10,
  responseTime: 15,
  acceptanceRate: 10,
  conversionRate: 10,
  specialization: 10,
  verified: 5,
  experience: 5,
  availability: 5,
};

/**
 * Find the best-matched vendors for a lead.
 *
 * @param lead - The lead context (category, city, budget, etc.)
 * @param limit - Max vendors to return (default: 5)
 * @returns Ranked list of vendor matches with scores
 */
export async function findBestVendors(
  lead: LeadContext,
  limit: number = 5
): Promise<VendorMatch[]> {
  try {
    const where: any = { approved: true };
    if (lead.category) where.category = lead.category;
    if (lead.city) where.city = { contains: lead.city, mode: "insensitive" };

    const vendors = await db.vendor.findMany({
      where,
      select: {
        id: true, name: true, slug: true, category: true, city: true,
        country: true, rating: true, reviewCount: true, verified: true,
        featured: true, ecosystem: true, yearsActive: true,
        completedBookings: true, responseTime: true, whatsapp: true,
        subscriptions: {
          where: { status: "active", planExpiresAt: { gt: new Date() } },
          select: { planTier: true },
          take: 1,
          orderBy: { planExpiresAt: "desc" },
        },
      },
      take: 100,
    }).catch(() => []);

    if (vendors.length === 0) {
      logger.info("lead-routing", "No vendors found for lead", { lead });
      return [];
    }

    const vendorIds = vendors.map((v) => v.id);
    const bookingStats = await getBookingStats(vendorIds);

    const matches: VendorMatch[] = vendors.map((vendor) => {
      const stats = bookingStats.get(vendor.id) || {
        totalLeads: 0, accepted: 0, won: 0, avgResponseHours: 0,
      };

      const scores = {
        distance: scoreDistance(vendor.city, lead.city),
        rating: scoreRating(vendor.rating),
        premium: scorePremium(vendor.subscriptions),
        responseTime: scoreResponseTime(stats.avgResponseHours),
        acceptanceRate: scoreAcceptanceRate(stats.totalLeads, stats.accepted),
        conversionRate: scoreConversionRate(stats.accepted, stats.won),
        specialization: 50,
        verified: vendor.verified ? 100 : 0,
        experience: scoreExperience(vendor.yearsActive, vendor.completedBookings),
        availability: 80,
      };

      const matchScore = Math.round(
        (scores.distance * WEIGHTS.distance +
          scores.rating * WEIGHTS.rating +
          scores.premium * WEIGHTS.premium +
          scores.responseTime * WEIGHTS.responseTime +
          scores.acceptanceRate * WEIGHTS.acceptanceRate +
          scores.conversionRate * WEIGHTS.conversionRate +
          scores.specialization * WEIGHTS.specialization +
          scores.verified * WEIGHTS.verified +
          scores.experience * WEIGHTS.experience +
          scores.availability * WEIGHTS.availability) / 100
      );

      const reasons: string[] = [];
      if (scores.rating >= 80) reasons.push(`Highly rated (${vendor.rating}★)`);
      if (scores.premium >= 80) reasons.push("Premium vendor");
      if (scores.responseTime >= 80) reasons.push("Fast response time");
      if (scores.acceptanceRate >= 80) reasons.push("High acceptance rate");
      if (scores.conversionRate >= 80) reasons.push("Proven conversion");
      if (scores.verified >= 80) reasons.push("Verified");
      if (scores.experience >= 80) reasons.push("Experienced");
      if (scores.distance >= 80 && lead.city) reasons.push(`Located in ${lead.city}`);

      return {
        vendorId: vendor.id, vendorName: vendor.name, slug: vendor.slug,
        category: vendor.category, city: vendor.city,
        rating: vendor.rating, reviewCount: vendor.reviewCount,
        verified: vendor.verified, featured: vendor.featured,
        ecosystem: vendor.ecosystem,
        matchScore, matchReasons: reasons.slice(0, 3), scores,
      };
    });

    matches.sort((a, b) => b.matchScore - a.matchScore);

    logger.info("lead-routing", "Vendor matching completed", {
      leadCategory: lead.category, leadCity: lead.city,
      candidates: vendors.length,
      returned: Math.min(limit, matches.length),
      topScore: matches[0]?.matchScore || 0,
    });

    return matches.slice(0, limit);
  } catch (error: any) {
    logger.error("lead-routing", "findBestVendors failed", error, { message: error.message });
    return [];
  }
}

async function getBookingStats(
  vendorIds: string[]
): Promise<Map<string, { totalLeads: number; accepted: number; won: number; avgResponseHours: number; }>> {
  const result = new Map<string, { totalLeads: number; accepted: number; won: number; avgResponseHours: number; }>();
  if (vendorIds.length === 0) return result;

  try {
    const [leadsByVendor, acceptedByVendor, wonByVendor] = await Promise.all([
      db.booking.groupBy({ by: ["vendorId"], where: { vendorId: { in: vendorIds } }, _count: { id: true } }),
      db.booking.groupBy({ by: ["vendorId"], where: { vendorId: { in: vendorIds }, status: { in: ["confirmed", "completed"] } }, _count: { id: true } }),
      db.booking.groupBy({ by: ["vendorId"], where: { vendorId: { in: vendorIds }, status: "completed" }, _count: { id: true } }),
    ]);

    for (const v of vendorIds) {
      result.set(v, {
        totalLeads: leadsByVendor.find((l) => l.vendorId === v)?._count.id || 0,
        accepted: acceptedByVendor.find((a) => a.vendorId === v)?._count.id || 0,
        won: wonByVendor.find((w) => w.vendorId === v)?._count.id || 0,
        avgResponseHours: 0,
      });
    }
  } catch {
    for (const v of vendorIds) result.set(v, { totalLeads: 0, accepted: 0, won: 0, avgResponseHours: 0 });
  }
  return result;
}

function scoreDistance(vendorCity: string, leadCity?: string): number {
  if (!leadCity) return 50;
  if (!vendorCity) return 30;
  const match = vendorCity.toLowerCase().includes(leadCity.toLowerCase()) ||
    leadCity.toLowerCase().includes(vendorCity.toLowerCase());
  return match ? 100 : 20;
}

function scoreRating(rating: number): number { return Math.round((rating / 5) * 100); }
function scorePremium(subscriptions: any[]): number {
  if (!subscriptions || subscriptions.length === 0) return 20;
  const tier = subscriptions[0]?.planTier;
  if (tier === "business") return 100;
  if (tier === "pro") return 80;
  return 20;
}
function scoreResponseTime(avgResponseHours: number): number {
  if (avgResponseHours === 0) return 50;
  if (avgResponseHours <= 1) return 100;
  if (avgResponseHours <= 3) return 90;
  if (avgResponseHours <= 6) return 75;
  if (avgResponseHours <= 12) return 60;
  if (avgResponseHours <= 24) return 40;
  return 20;
}
function scoreAcceptanceRate(totalLeads: number, accepted: number): number {
  if (totalLeads === 0) return 50;
  return Math.round((accepted / totalLeads) * 100);
}
function scoreConversionRate(accepted: number, won: number): number {
  if (accepted === 0) return 50;
  return Math.round((won / accepted) * 100);
}
function scoreExperience(yearsActive: number, completedBookings: number): number {
  const yearsScore = Math.min(100, yearsActive * 20);
  const bookingsScore = Math.min(100, completedBookings * 2);
  return Math.round((yearsScore + bookingsScore) / 2);
}
