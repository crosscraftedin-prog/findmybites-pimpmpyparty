/**
 * Customer Dashboard Service — V7 AI Commerce Operating System
 *
 * Aggregates ALL customer data into a single dashboard response:
 *   - My Enquiries (bookings/leads)
 *   - My Events (ConciergeEvents)
 *   - Wishlist (saved vendors + products)
 *   - Quotes Received
 *   - Recommendations
 *
 * REUSES existing data — no new tables:
 *   - Booking model (customer enquiries/leads)
 *   - ConciergeEvent model (customer events)
 *   - Wishlist model (saved items)
 *   - Quote model (vendor quotes)
 *   - findBestVendors() for recommendations
 */

import { db } from "@/lib/db";
import { findBestVendors } from "@/lib/leads/lead-routing";
import { getEventCountdown } from "@/lib/events/event-intelligence";
import { logger } from "@/lib/logger";

export interface CustomerEnquiry {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  eventType: string;
  eventDate: string;
  status: string;
  leadScore: number;
  aiSummary: string | null;
  budget: string;
  createdAt: string;
}

export interface CustomerEvent {
  id: string;
  eventType: string;
  eventDate: string;
  eventCity: string;
  guests: number;
  budget: string;
  status: string;
  countdown: { daysUntilEvent: number; phase: string };
}

export interface CustomerWishlistItem {
  id: string;
  entityType: string;
  entityId: string;
  vendorId: string | null;
  name: string;
  image: string | null;
  price: number | null;
  slug: string | null;
  addedAt: string;
}

export interface CustomerQuote {
  id: string;
  vendorId: string;
  vendorName: string;
  bookingId: string;
  totalAmount: number;
  currency: string;
  status: string;
  validUntil: string | null;
  createdAt: string;
}

export interface CustomerRecommendation {
  vendorId: string;
  vendorName: string;
  slug: string;
  matchScore: number;
  matchReasons: string[];
  category: string;
  city: string;
  rating: number;
}

export interface CustomerDashboard {
  enquiries: CustomerEnquiry[];
  events: CustomerEvent[];
  wishlist: CustomerWishlistItem[];
  quotes: CustomerQuote[];
  recommendations: CustomerRecommendation[];
  stats: {
    totalEnquiries: number;
    activeEvents: number;
    wishlistCount: number;
    pendingQuotes: number;
    acceptedQuotes: number;
  };
}

export async function getCustomerDashboard(
  userEmail: string,
  userId: string
): Promise<CustomerDashboard> {
  try {
    // 1. Enquiries (bookings)
    const bookings = await db.booking.findMany({
      where: { email: userEmail },
      include: { vendor: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []);

    const enquiries: CustomerEnquiry[] = (bookings as any[]).map((b) => ({
      id: b.id, vendorId: b.vendorId,
      vendorName: b.vendor?.name || "Unknown",
      vendorSlug: b.vendor?.slug || "",
      eventType: b.eventType, eventDate: b.eventDate,
      status: b.status, leadScore: b.leadScore || 0,
      aiSummary: b.aiSummary, budget: b.budget || "Not specified",
      createdAt: b.createdAt?.toISOString?.() || String(b.createdAt),
    }));

    // 2. Events (ConciergeEvents)
    const events = await db.conciergeEvent.findMany({
      where: { customerEmail: userEmail },
      orderBy: { eventDate: "desc" },
      take: 10,
    }).catch(() => []);

    const customerEvents: CustomerEvent[] = (events as any[]).map((e) => ({
      id: e.id, eventType: e.eventType, eventDate: e.eventDate,
      eventCity: e.eventCity, guests: e.guests, budget: e.budget,
      status: e.status,
      countdown: getEventCountdown(e.eventDate),
    }));

    // 3. Wishlist
    const wishlistRows = await db.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []);

    const wishlist: CustomerWishlistItem[] = [];
    for (const item of wishlistRows) {
      let name = "Unknown", image: string | null = null;
      let price: number | null = null, slug: string | null = null;
      try {
        if (item.entityType === "vendor") {
          const v = await db.vendor.findUnique({
            where: { id: item.entityId },
            select: { name: true, slug: true, avatarImage: true },
          });
          if (v) { name = v.name; slug = v.slug; image = v.avatarImage || null; }
        } else if (item.entityType === "product") {
          const p = await db.product.findUnique({
            where: { id: item.entityId },
            select: { name: true, slug: true, image: true, price: true },
          });
          if (p) { name = p.name; slug = p.slug; image = p.image || null; price = p.price; }
        }
      } catch {}
      wishlist.push({
        id: item.id, entityType: item.entityType, entityId: item.entityId,
        vendorId: item.vendorId, name, image, price, slug,
        addedAt: item.createdAt?.toISOString?.() || String(item.createdAt),
      });
    }

    // 4. Quotes
    const bookingIds = (bookings as any[]).map((b) => b.id);
    const quoteRows = bookingIds.length > 0
      ? await db.quote.findMany({
          where: { bookingId: { in: bookingIds } },
          orderBy: { createdAt: "desc" },
          take: 20,
        }).catch(() => [])
      : [];

    // Fetch vendor names for quotes (Quote model has vendorId but no vendor relation)
    const quoteVendorIds = [...new Set((quoteRows as any[]).map((q) => q.vendorId))];
    const quoteVendors = quoteVendorIds.length > 0
      ? await db.vendor.findMany({
          where: { id: { in: quoteVendorIds } },
          select: { id: true, name: true },
        }).catch(() => [])
      : [];
    const quoteVendorMap = new Map(quoteVendors.map((v: any) => [v.id, v.name]));

    const quotes: CustomerQuote[] = (quoteRows as any[]).map((q) => ({
      id: q.id, vendorId: q.vendorId,
      vendorName: quoteVendorMap.get(q.vendorId) || "Unknown",
      bookingId: q.bookingId, totalAmount: q.totalAmount,
      currency: q.currency, status: q.status,
      validUntil: q.validUntil?.toISOString?.() || null,
      createdAt: q.createdAt?.toISOString?.() || String(q.createdAt),
    }));

    // 5. Recommendations (based on last enquiry)
    let recommendations: CustomerRecommendation[] = [];
    const lastEnquiry = enquiries[0];
    if (lastEnquiry) {
      let category: string | undefined, city: string | undefined;
      try {
        const v = await db.vendor.findUnique({
          where: { id: lastEnquiry.vendorId },
          select: { category: true, city: true },
        });
        category = v?.category; city = v?.city;
      } catch {}
      if (category) {
        const matches = await findBestVendors({ category, city }, 5);
        recommendations = matches.map((m) => ({
          vendorId: m.vendorId, vendorName: m.vendorName, slug: m.slug,
          matchScore: m.matchScore, matchReasons: m.matchReasons,
          category: m.category, city: m.city, rating: m.rating,
        }));
      }
    }

    // 6. Stats
    const stats = {
      totalEnquiries: enquiries.length,
      activeEvents: customerEvents.filter((e) => e.countdown.daysUntilEvent >= 0).length,
      wishlistCount: wishlist.length,
      pendingQuotes: quotes.filter((q) => q.status === "sent" || q.status === "draft").length,
      acceptedQuotes: quotes.filter((q) => q.status === "accepted").length,
    };

    logger.info("customer-dashboard", "Dashboard generated", {
      userEmail, enquiries: enquiries.length, events: customerEvents.length,
      wishlist: wishlist.length, quotes: quotes.length,
      recommendations: recommendations.length,
    });

    return { enquiries, events: customerEvents, wishlist, quotes, recommendations, stats };
  } catch (error: any) {
    logger.error("customer-dashboard", "getCustomerDashboard failed", error, { userEmail });
    return {
      enquiries: [], events: [], wishlist: [], quotes: [], recommendations: [],
      stats: { totalEnquiries: 0, activeEvents: 0, wishlistCount: 0, pendingQuotes: 0, acceptedQuotes: 0 },
    };
  }
}
