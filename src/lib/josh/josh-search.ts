/**
 * Josh Search — V4 Backend Search Engine
 *
 * The backend performs the marketplace search BEFORE the LLM is called.
 * The LLM NEVER searches. The backend returns:
 *   - vendors[]   (top matches filtered by category + city + filters)
 *   - products[]  (top products from matched vendors)
 *   - filters[]   (active filter summary)
 *
 * All DB access is wrapped in try/catch so a DB outage degrades gracefully
 * (returns empty arrays) rather than crashing the conversation.
 */

import { db } from "@/lib/db";
import { migrateCategory } from "@/lib/constants";
import { parseJsonArray } from "@/lib/format";
import type { ConversationState } from "@/lib/conversation-state";

export interface JoshVendor {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string | null;
  city: string;
  country: string;
  countryCode: string;
  tagline: string;
  description: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  basePrice: number;
  currency: string;
  featured: boolean;
  verified: boolean;
  tags: string[];
  ecosystem: string;
  whatsapp: string | null;
  heroImage: string;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  responseTime: string;
}

export interface JoshProduct {
  id: string;
  vendorId: string;
  vendorName: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  productType: string | null;
  eggless: boolean;
  featured: boolean;
  currency: string;
}

export interface JoshFilterSummary {
  key: string;
  value: string;
}

export interface JoshSearchResult {
  vendors: JoshVendor[];
  products: JoshProduct[];
  filters: JoshFilterSummary[];
}

/**
 * Build the active-filter summary from ConversationState (for logging + LLM context).
 */
export function buildFilterSummary(state: ConversationState): JoshFilterSummary[] {
  const filters: JoshFilterSummary[] = [];
  if (state.budget) filters.push({ key: "budget", value: String(state.budget) });
  if (state.dietaryRequirements?.length)
    filters.push({ key: "dietary", value: state.dietaryRequirements.join(", ") });
  if (state.attributeSlugs?.length)
    filters.push({ key: "attributes", value: state.attributeSlugs.join(", ") });
  if (state.eventDate) filters.push({ key: "date", value: state.eventDate });
  if (state.guestCount) filters.push({ key: "guests", value: String(state.guestCount) });
  if (state.deliveryRequired) filters.push({ key: "delivery", value: "yes" });
  if (state.pickupRequired) filters.push({ key: "pickup", value: "yes" });
  if (state.onlyVerified) filters.push({ key: "verified", value: "only" });
  if (state.onlyFeatured) filters.push({ key: "featured", value: "only" });
  if (state.sortBy) filters.push({ key: "sort", value: state.sortBy });
  return filters;
}

/**
 * Search the marketplace for vendors matching the ConversationState.
 * Filters by category, city, budget, dietary, and sort preference.
 * Returns at most `limit` vendors (default 10).
 *
 * This is a pure DB operation — no LLM involved.
 */
export async function searchVendors(
  state: ConversationState,
  limit: number = 10
): Promise<JoshSearchResult> {
  const filters = buildFilterSummary(state);

  try {
    // Build the where clause from ConversationState
    const where: any = { approved: true };

    if (state.category) {
      // Match either the migrated category or the raw category
      const migrated = migrateCategory(state.category);
      where.OR = [
        { category: state.category },
        ...(migrated && migrated !== state.category ? [{ category: migrated }] : []),
      ];
    }

    if (state.city) {
      // Use case-insensitive contains for PostgreSQL
      where.city = { contains: state.city, mode: "insensitive" };
    }

    if (state.onlyVerified) where.verified = true;
    if (state.onlyFeatured) where.featured = true;

    // Sort
    let orderBy: any[] = [{ featured: "desc" }, { rating: "desc" }, { reviewCount: "desc" }];
    if (state.sortBy === "price-asc") orderBy = [{ basePrice: "asc" }];
    else if (state.sortBy === "price-desc") orderBy = [{ basePrice: "desc" }];
    else if (state.sortBy === "reviews") orderBy = [{ reviewCount: "desc" }];
    else if (state.sortBy === "rating") orderBy = [{ rating: "desc" }];
    else if (state.sortBy === "newest") orderBy = [{ createdAt: "desc" }];

    const rows = await db.vendor.findMany({
      where,
      select: {
        id: true, name: true, slug: true, category: true, subcategory: true,
        city: true, country: true, countryCode: true, tagline: true, description: true,
        rating: true, reviewCount: true, priceRange: true, basePrice: true, currency: true,
        featured: true, verified: true, tags: true, ecosystem: true, whatsapp: true,
        heroImage: true, deliveryAvailable: true, pickupAvailable: true, responseTime: true,
      },
      orderBy,
      take: limit,
    });

    let vendors: JoshVendor[] = rows.map((r) => ({
      ...r,
      tags: parseJsonArray<string>(r.tags),
    }));

    // In-memory filtering for dietary + budget (DB schema doesn't have a clean
    // dietary column on Vendor; products carry eggless/vegan flags, and tags
    // may carry dietary info).
    if (state.budget && state.budget > 0) {
      vendors = vendors.filter((v) => v.basePrice <= state.budget! * 1.2); // 20% headroom
    }
    if (state.dietaryRequirements?.length) {
      vendors = vendors.filter((v) => {
        const tagsLower = v.tags.map((t) => t.toLowerCase());
        return state.dietaryRequirements!.some((d) => {
          const dl = d.toLowerCase();
          return tagsLower.some((t) => t.includes(dl) || t.includes(dl.replace("-", " ")));
        });
      });
    }

    // Global Attribute System — filter vendors by extracted attribute slugs.
    // Uses the indexed vendor_attributes table (not tag substring matching).
    if (state.attributeSlugs && state.attributeSlugs.length > 0) {
      try {
        const { findVendorIdsByAttributes } = await import("@/lib/attributes/attribute-service");
        const matchedIds = await findVendorIdsByAttributes(state.attributeSlugs, {
          category: state.category ?? undefined,
        });
        const matchedSet = new Set(matchedIds);
        vendors = vendors.filter((v) => matchedSet.has(v.id));
      } catch (attrErr) {
        console.error("[josh-search] attribute filter failed (non-fatal):", attrErr);
      }
    }

    // Fetch top products from the matched vendors (for SEARCH_VENDORS / REFINE)
    let products: JoshProduct[] = [];
    if (vendors.length > 0) {
      try {
        const productRows = await db.product.findMany({
          where: {
            vendorId: { in: vendors.slice(0, 5).map((v) => v.id) },
            isAvailable: true,
          },
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          take: 8,
        });
        const vendorCurrency = new Map(vendors.map((v) => [v.id, v.currency]));
        const vendorName = new Map(vendors.map((v) => [v.id, v.name]));
        products = productRows.map((p) => ({
          id: p.id,
          vendorId: p.vendorId,
          vendorName: vendorName.get(p.vendorId) ?? "",
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.image,
          productType: p.productType,
          eggless: p.eggless,
          featured: p.featured,
          currency: vendorCurrency.get(p.vendorId) ?? "INR",
        }));
      } catch {
        products = [];
      }
    }

    return { vendors, products, filters };
  } catch (e) {
    // DB unavailable — return empty result so the caller can compute NO_RESULTS
    return { vendors: [], products: [], filters };
  }
}
