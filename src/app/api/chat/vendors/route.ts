import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { CATEGORY_MIGRATION_MAP } from "@/lib/constants";
import type { Vendor as ApiVendor } from "@/lib/types";

/**
 * GET /api/chat/vendors?categories=bakers-bakery,djs&city=Dubai&limit=5
 * Fetches vendors for the AI chatbot's suggestions.
 *
 * Falls back to sample vendors when the DB is unavailable or returns 0
 * results, so the chat widget always shows vendor cards (even in preview
 * environments without a populated database).
 */

function transformVendor(v: any, distance: number | null): ApiVendor & { distance: number | null } {
  return {
    id: v.id,
    name: v.name,
    slug: v.slug,
    ecosystem: v.ecosystem as ApiVendor["ecosystem"],
    category: v.category,
    tagline: v.tagline,
    description: v.description,
    city: v.city,
    country: v.country,
    countryCode: v.countryCode,
    continent: v.continent,
    currency: v.currency,
    priceRange: v.priceRange,
    basePrice: v.basePrice,
    rating: v.rating,
    reviewCount: v.reviewCount,
    heroImage: v.heroImage,
    avatarImage: v.avatarImage,
    gallery: parseJsonArray<string>(v.gallery),
    tags: parseJsonArray<string>(v.tags),
    featured: v.featured,
    approved: v.approved,
    verified: v.verified,
    responseTime: v.responseTime,
    yearsActive: v.yearsActive,
    completedBookings: v.completedBookings,
    subcategory: v.subcategory,
    state: v.state,
    address: v.address,
    zipCode: v.zipCode,
    instagram: v.instagram,
    website: v.website,
    whatsapp: v.whatsapp,
    openHours: v.openHours,
    deliveryAvailable: v.deliveryAvailable,
    pickupAvailable: v.pickupAvailable,
    serviceAreas: v.serviceAreas,
    metaTitle: v.metaTitle,
    metaDescription: v.metaDescription,
    latitude: v.latitude,
    longitude: v.longitude,
    serviceRadiusKm: v.serviceRadiusKm,
    userEmail: v.userEmail,
    ownership_status: v.ownership_status,
    createdAt: v.createdAt.toISOString(),
    distance,
  };
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const categoriesRaw = sp.get("categories") ?? "";
    const city = sp.get("city") ?? undefined;
    const limitRaw = sp.get("limit");
    const limit = limitRaw ? Math.max(1, Number(limitRaw) || 5) : 5;

    const categories = categoriesRaw.split(",").map((c) => c.trim()).filter(Boolean);
    if (categories.length === 0) {
      return NextResponse.json({ vendors: [] });
    }

    // Expand categories to include old slugs
    const reverseMigrationMap: Record<string, string[]> = {};
    for (const [oldSlug, newSlug] of Object.entries(CATEGORY_MIGRATION_MAP)) {
      if (!reverseMigrationMap[newSlug]) reverseMigrationMap[newSlug] = [];
      reverseMigrationMap[newSlug].push(oldSlug);
    }
    const expandedCategories = new Set<string>();
    for (const cat of categories) {
      expandedCategories.add(cat);
      (reverseMigrationMap[cat] ?? []).forEach((old) => expandedCategories.add(old));
      if (CATEGORY_MIGRATION_MAP[cat]) expandedCategories.add(CATEGORY_MIGRATION_MAP[cat]);
    }

    const where: Prisma.VendorWhereInput = {
      approved: true,
      category: { in: Array.from(expandedCategories) },
    };
    if (city) where.city = { contains: city };

    const rows = await db.vendor.findMany({
      where,
      take: 50,
      orderBy: [{ featured: "desc" }, { rating: "desc" }],
    });

    // Fallback to global if city filter returns nothing
    let finalRows = rows;
    if (city && rows.length === 0) {
      finalRows = await db.vendor.findMany({
        where: { approved: true, category: { in: Array.from(expandedCategories) } },
        take: 50,
        orderBy: [{ featured: "desc" }, { rating: "desc" }],
      });
    }

    const withDistance = finalRows.map((v) => ({ vendor: v, distance: null as number | null }));

    // Sort: featured first, then by rating
    withDistance.sort((a, b) => {
      if (a.vendor.featured !== b.vendor.featured) return a.vendor.featured ? -1 : 1;
      return b.vendor.rating - a.vendor.rating;
    });

    // Limit per-category for variety
    const perCategory = Math.max(1, Math.ceil(limit / categories.length));
    const picked: typeof withDistance = [];
    const seenCategories = new Map<string, number>();
    for (const item of withDistance) {
      const catCount = seenCategories.get(item.vendor.category) ?? 0;
      if (catCount < perCategory && picked.length < limit) {
        picked.push(item);
        seenCategories.set(item.vendor.category, catCount + 1);
      }
    }
    if (picked.length < limit) {
      for (const item of withDistance) {
        if (picked.length >= limit) break;
        if (!picked.includes(item)) picked.push(item);
      }
    }

    // If DB returned 0 vendors (e.g. empty SQLite in preview), use sample
    // vendors so the chat widget always shows cards.
    if (picked.length === 0) {
      const samples = getSampleVendors(categories, city, limit);
      console.log("[api/chat/vendors] DB returned 0 vendors — using", samples.length, "sample vendors");
      return NextResponse.json({ vendors: samples, sample: true });
    }

    return NextResponse.json({
      vendors: picked.map((p) => transformVendor(p.vendor, p.distance)),
    });
  } catch (err) {
    console.error("[api/chat/vendors] GET failed:", err);
    // Return sample vendors on error so chat still works
    const sp = req.nextUrl.searchParams;
    const categoriesRaw = sp.get("categories") ?? "";
    const city = sp.get("city") ?? undefined;
    const limit = sp.get("limit") ? Math.max(1, Number(sp.get("limit")) || 5) : 5;
    const categories = categoriesRaw.split(",").map((c) => c.trim()).filter(Boolean);
    const samples = getSampleVendors(categories, city, limit);
    return NextResponse.json({ vendors: samples, sample: true });
  }
}

// ── Sample vendors (used when DB is empty/unavailable) ────────────────────

const SAMPLE_VENDORS: Record<string, Array<{
  id: string; name: string; slug: string; category: string; ecosystem: string;
  city: string; country: string; countryCode: string; continent: string;
  tagline: string; description: string; currency: string; priceRange: string;
  basePrice: number; rating: number; reviewCount: number; heroImage: string;
  avatarImage: string; tags: string; verified: boolean; featured: boolean;
}>> = {
  "bakers-bakery": [
    { id: "s1", name: "Sweet Sensations Bakery", slug: "sweet-sensations-bakery", category: "bakers-bakery", ecosystem: "FINDMYBITES", city: "Dubai", country: "UAE", countryCode: "AE", continent: "Asia", tagline: "Exquisite custom cakes for all occasions", description: "Award-winning bakery specializing in wedding cakes, birthday cakes, and custom designs.", currency: "AED", priceRange: "$$", basePrice: 250, rating: 4.9, reviewCount: 127, heroImage: "", avatarImage: "", tags: "[\"wedding cakes\",\"custom\",\"fondant\"]", verified: true, featured: true },
    { id: "s2", name: "The Cake Boutique", slug: "the-cake-boutique", category: "bakers-bakery", ecosystem: "FINDMYBITES", city: "Mumbai", country: "India", countryCode: "IN", continent: "Asia", tagline: "Artisanal cakes with a modern twist", description: "Bespoke cake studio creating designer cakes for weddings, birthdays, and celebrations.", currency: "INR", priceRange: "$$", basePrice: 1500, rating: 4.8, reviewCount: 89, heroImage: "", avatarImage: "", tags: "[\"designer cakes\",\"birthday\",\"custom\"]", verified: true, featured: false },
    { id: "s2b", name: "Mumbai Cake Studio", slug: "mumbai-cake-studio", category: "bakers-bakery", ecosystem: "FINDMYBITES", city: "Mumbai", country: "India", countryCode: "IN", continent: "Asia", tagline: "Designer cakes for every celebration", description: "Custom birthday and wedding cakes delivered across Mumbai.", currency: "INR", priceRange: "$$", basePrice: 1200, rating: 4.7, reviewCount: 65, heroImage: "", avatarImage: "", tags: "[\"birthday\",\"wedding\",\"custom\"]", verified: true, featured: true },
    { id: "s2c", name: "Sugar Rush Bakers", slug: "sugar-rush-bakers", category: "bakers-bakery", ecosystem: "FINDMYBITES", city: "Mumbai", country: "India", countryCode: "IN", continent: "Asia", tagline: "Fresh cakes baked daily", description: "Birthday cakes, cupcakes, and dessert tables for all occasions.", currency: "INR", priceRange: "$", basePrice: 900, rating: 4.6, reviewCount: 43, heroImage: "", avatarImage: "", tags: "[\"cupcakes\",\"dessert\",\"birthday\"]", verified: false, featured: false },
    { id: "s3", name: "Sugar & Spice Cakes", slug: "sugar-and-spice-cakes", category: "bakers-bakery", ecosystem: "FINDMYBITES", city: "London", country: "UK", countryCode: "GB", continent: "Europe", tagline: "Custom wedding cakes as unique as your love story", description: "Luxury wedding cake designer serving London and the South East.", currency: "GBP", priceRange: "$$$", basePrice: 180, rating: 4.7, reviewCount: 64, heroImage: "", avatarImage: "", tags: "[\"wedding\",\"luxury\",\"custom\"]", verified: true, featured: false },
    { id: "s4", name: "Hyderabad Cake House", slug: "hyderabad-cake-house", category: "bakers-bakery", ecosystem: "FINDMYBITES", city: "Hyderabad", country: "India", countryCode: "IN", continent: "Asia", tagline: "Fresh baked cakes delivered across Hyderabad", description: "Local bakery offering birthday cakes, wedding cakes, and eggless options.", currency: "INR", priceRange: "$", basePrice: 800, rating: 4.6, reviewCount: 52, heroImage: "", avatarImage: "", tags: "[\"birthday\",\"eggless\",\"delivery\"]", verified: false, featured: false },
    { id: "s4b", name: "The Cake Story", slug: "the-cake-story", category: "bakers-bakery", ecosystem: "FINDMYBITES", city: "Hyderabad", country: "India", countryCode: "IN", continent: "Asia", tagline: "Custom cakes that tell your story", description: "Designer cakes for weddings, birthdays, and corporate events in Hyderabad.", currency: "INR", priceRange: "$$", basePrice: 1100, rating: 4.8, reviewCount: 71, heroImage: "", avatarImage: "", tags: "[\"designer\",\"wedding\",\"corporate\"]", verified: true, featured: true },
    { id: "s4c", name: "Dessert Delight Bakery", slug: "dessert-delight-bakery", category: "bakers-bakery", ecosystem: "FINDMYBITES", city: "Dubai", country: "UAE", countryCode: "AE", continent: "Asia", tagline: "Dubai's favorite cake destination", description: "Custom cakes, cupcakes, and desserts for Dubai celebrations.", currency: "AED", priceRange: "$$", basePrice: 320, rating: 4.7, reviewCount: 93, heroImage: "", avatarImage: "", tags: "[\"custom\",\"cupcakes\",\"delivery\"]", verified: true, featured: false },
  ],
  caterers: [
    { id: "s5", name: "Royal Feast Catering", slug: "royal-feast-catering", category: "caterers", ecosystem: "FINDMYBITES", city: "Mumbai", country: "India", countryCode: "IN", continent: "Asia", tagline: "Authentic Indian catering for weddings and events", description: "Full-service catering with live counters and buffet options.", currency: "INR", priceRange: "$$", basePrice: 350, rating: 4.8, reviewCount: 156, heroImage: "", avatarImage: "", tags: "[\"wedding\",\"buffet\",\"live counters\"]", verified: true, featured: true },
    { id: "s6", name: "Desert Rose Catering", slug: "desert-rose-catering", category: "caterers", ecosystem: "FINDMYBITES", city: "Dubai", country: "UAE", countryCode: "AE", continent: "Asia", tagline: "Premium catering for Dubai's finest events", description: "International and Arabic cuisine catering for corporate and wedding events.", currency: "AED", priceRange: "$$$", basePrice: 120, rating: 4.9, reviewCount: 98, heroImage: "", avatarImage: "", tags: "[\"corporate\",\"wedding\",\"halal\"]", verified: true, featured: true },
  ],
  djs: [
    { id: "s7", name: "Neon Pulse DJs", slug: "neon-pulse-djs", category: "djs", ecosystem: "PIMPMYPARTY", city: "Mumbai", country: "India", countryCode: "IN", continent: "Asia", tagline: "Bollywood to EDM — we bring the party", description: "Professional DJs for weddings, corporate events, and club nights.", currency: "INR", priceRange: "$$", basePrice: 15000, rating: 4.9, reviewCount: 112, heroImage: "", avatarImage: "", tags: "[\"dj\",\"wedding\",\"edm\"]", verified: true, featured: true },
    { id: "s7b", name: "Mumbai Mix DJ", slug: "mumbai-mix-dj", category: "djs", ecosystem: "PIMPMYPARTY", city: "Mumbai", country: "India", countryCode: "IN", continent: "Asia", tagline: "Your party's soundtrack, sorted", description: "Open-format DJ for weddings, birthdays, and corporate events across Mumbai.", currency: "INR", priceRange: "$", basePrice: 12000, rating: 4.7, reviewCount: 58, heroImage: "", avatarImage: "", tags: "[\"dj\",\"bollywood\",\"party\"]", verified: false, featured: false },
    { id: "s8", name: "Dubai Mix Masters", slug: "dubai-mix-masters", category: "djs", ecosystem: "PIMPMYPARTY", city: "Dubai", country: "UAE", countryCode: "AE", continent: "Asia", tagline: "Dubai's premier DJ service", description: "Open-format, house, and Arabic DJs for all event types.", currency: "AED", priceRange: "$$$", basePrice: 2500, rating: 4.8, reviewCount: 67, heroImage: "", avatarImage: "", tags: "[\"dj\",\"wedding\",\"club\"]", verified: true, featured: false },
    { id: "s8b", name: "Desert Beats DJ", slug: "desert-beats-dj", category: "djs", ecosystem: "PIMPMYPARTY", city: "Dubai", country: "UAE", countryCode: "AE", continent: "Asia", tagline: "Spinning the perfect mix for your event", description: "Professional DJ with sound and lighting for Dubai events.", currency: "AED", priceRange: "$$", basePrice: 1800, rating: 4.6, reviewCount: 41, heroImage: "", avatarImage: "", tags: "[\"dj\",\"sound\",\"lighting\"]", verified: true, featured: false },
    { id: "s8c", name: "Hyderabad Sound Lab", slug: "hyderabad-sound-lab", category: "djs", ecosystem: "PIMPMYPARTY", city: "Hyderabad", country: "India", countryCode: "IN", continent: "Asia", tagline: "Telugu to EDM — we mix it all", description: "Wedding and party DJs serving Hyderabad and Secunderabad.", currency: "INR", priceRange: "$", basePrice: 10000, rating: 4.7, reviewCount: 49, heroImage: "", avatarImage: "", tags: "[\"dj\",\"telugu\",\"wedding\"]", verified: true, featured: true },
  ],
  photographers: [
    { id: "s9", name: "Frame & Story Photography", slug: "frame-and-story-photography", category: "photographers", ecosystem: "PIMPMYPARTY", city: "Mumbai", country: "India", countryCode: "IN", continent: "Asia", tagline: "Documentary-style wedding photography", description: "Candid wedding and event photography across India.", currency: "INR", priceRange: "$$", basePrice: 25000, rating: 4.8, reviewCount: 78, heroImage: "", avatarImage: "", tags: "[\"wedding\",\"candid\",\"event\"]", verified: true, featured: true },
    { id: "s9b", name: "Lens & Light Studios", slug: "lens-and-light-studios", category: "photographers", ecosystem: "PIMPMYPARTY", city: "Dubai", country: "UAE", countryCode: "AE", continent: "Asia", tagline: "Capturing Dubai's best moments", description: "Wedding, event, and corporate photography in Dubai.", currency: "AED", priceRange: "$$$", basePrice: 2000, rating: 4.9, reviewCount: 54, heroImage: "", avatarImage: "", tags: "[\"wedding\",\"corporate\",\"event\"]", verified: true, featured: false },
    { id: "s9c", name: "Hyderabad Captures", slug: "hyderabad-captures", category: "photographers", ecosystem: "PIMPMYPARTY", city: "Hyderabad", country: "India", countryCode: "IN", continent: "Asia", tagline: "Your story, beautifully captured", description: "Wedding and event photography across Hyderabad.", currency: "INR", priceRange: "$$", basePrice: 18000, rating: 4.7, reviewCount: 37, heroImage: "", avatarImage: "", tags: "[\"wedding\",\"event\",\"candid\"]", verified: false, featured: false },
  ],
  decorators: [
    { id: "s10", name: "Balloon & Bloom Decor", slug: "balloon-and-bloom-decor", category: "decorators", ecosystem: "PIMPMYPARTY", city: "Dubai", country: "UAE", countryCode: "AE", continent: "Asia", tagline: "Stunning balloon and floral decor for any occasion", description: "Balloon arches, floral installations, and themed party decor.", currency: "AED", priceRange: "$$", basePrice: 800, rating: 4.7, reviewCount: 45, heroImage: "", avatarImage: "", tags: "[\"balloons\",\"floral\",\"theme\"]", verified: true, featured: false },
    { id: "s10b", name: "Mumbai Decor Co.", slug: "mumbai-decor-co", category: "decorators", ecosystem: "PIMPMYPARTY", city: "Mumbai", country: "India", countryCode: "IN", continent: "Asia", tagline: "Transforming venues into dream spaces", description: "Balloon decor, floral arrangements, and themed setups for all events.", currency: "INR", priceRange: "$$", basePrice: 8000, rating: 4.6, reviewCount: 31, heroImage: "", avatarImage: "", tags: "[\"balloons\",\"floral\",\"theme\"]", verified: true, featured: false },
  ],
  "event-planners": [
    { id: "s11", name: "Blossom Events", slug: "blossom-events", category: "event-planners", ecosystem: "PIMPMYPARTY", city: "Dubai", country: "UAE", countryCode: "AE", continent: "Asia", tagline: "Luxury wedding planning in Dubai", description: "End-to-end wedding and event planning for luxury celebrations.", currency: "AED", priceRange: "$$$", basePrice: 25000, rating: 5.0, reviewCount: 45, heroImage: "", avatarImage: "", tags: "[\"planner\",\"luxury\",\"wedding\"]", verified: true, featured: true },
  ],
  venues: [
    { id: "s12", name: "Skyline Rooftop Hall", slug: "skyline-rooftop-hall", category: "venues", ecosystem: "PIMPMYPARTY", city: "Mumbai", country: "India", countryCode: "IN", continent: "Asia", tagline: "Stunning rooftop venue for 500 guests", description: "Rooftop event space with city views, perfect for weddings and corporate events.", currency: "INR", priceRange: "$$$", basePrice: 80000, rating: 4.8, reviewCount: 34, heroImage: "", avatarImage: "", tags: "[\"venue\",\"rooftop\",\"events\"]", verified: true, featured: false },
  ],
  entertainers: [
    { id: "s13", name: "Wonder Circus Co.", slug: "wonder-circus-co", category: "entertainers", ecosystem: "PIMPMYPARTY", city: "Mumbai", country: "India", countryCode: "IN", continent: "Asia", tagline: "Magicians, mascots & live entertainment", description: "Kids party entertainment including magicians, clowns, and character mascots.", currency: "INR", priceRange: "$", basePrice: 5000, rating: 4.6, reviewCount: 56, heroImage: "", avatarImage: "", tags: "[\"kids\",\"magic\",\"mascot\"]", verified: false, featured: false },
  ],
  "chef-staff": [
    { id: "s14", name: "Chef At Home", slug: "chef-at-home", category: "chef-staff", ecosystem: "FINDMYBITES", city: "Mumbai", country: "India", countryCode: "IN", continent: "Asia", tagline: "Fine dining in your kitchen", description: "Private chef service for intimate dinners and special occasions.", currency: "INR", priceRange: "$$", basePrice: 2500, rating: 4.8, reviewCount: 38, heroImage: "", avatarImage: "", tags: "[\"private chef\",\"fine dining\"]", verified: true, featured: false },
  ],
};

function getSampleVendors(categories: string[], city: string | undefined, limit: number): any[] {
  const cityLower = city?.toLowerCase();
  let pool: any[] = [];
  for (const cat of categories) {
    const samples = SAMPLE_VENDORS[cat] ?? [];
    pool = [...pool, ...samples];
  }
  // If no samples for the requested categories, use all samples
  if (pool.length === 0) {
    pool = Object.values(SAMPLE_VENDORS).flat();
  }
  // Filter by city if provided
  if (cityLower) {
    const cityMatches = pool.filter((v) => v.city.toLowerCase().includes(cityLower));
    if (cityMatches.length > 0) pool = cityMatches;
  }
  // Sort: featured first, then rating
  pool.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return b.rating - a.rating;
  });
  return pool.slice(0, limit).map((v) => ({
    ...v,
    gallery: "[]",
    tags: v.tags,
    approved: true,
    responseTime: "under 2 hours",
    yearsActive: 5,
    completedBookings: 100,
    subcategory: null,
    state: null,
    address: null,
    zipCode: null,
    instagram: null,
    website: null,
    whatsapp: null,
    openHours: null,
    deliveryAvailable: true,
    pickupAvailable: true,
    serviceAreas: null,
    metaTitle: null,
    metaDescription: null,
    latitude: null,
    longitude: null,
    serviceRadiusKm: null,
    userEmail: null,
    ownership_status: null,
    createdAt: new Date().toISOString(),
    distance: null,
  }));
}
