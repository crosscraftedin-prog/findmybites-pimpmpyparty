import type { Vendor, Ecosystem } from "./types";

/**
 * Generates 10 placeholder vendor cards for display when the database
 * returns 0 vendors. Uses the EXACT same VendorCard component as real
 * vendors — no new card styles.
 *
 * Placeholders are marked with featured=false, approved=true so they
 * render normally but don't link to real profiles (slug = "demo-*").
 */

const FOOD_PLACEHOLDERS = [
  { name: "Sugar & Bloom Bakery", category: "bakers-bakery", subcategory: "Wedding Cakes", city: "Mumbai", country: "India", countryCode: "IN", continent: "Asia", currency: "INR", tagline: "Custom wedding cakes since 2015", basePrice: 5000, rating: 4.9, reviewCount: 127, tags: ["wedding", "fondant", "custom"] },
  { name: "The Sourdough Co.", category: "bakers-bakery", subcategory: "Sourdough", city: "Bengaluru", country: "India", countryCode: "IN", continent: "Asia", currency: "INR", tagline: "Artisan sourdough & breads", basePrice: 300, rating: 4.8, reviewCount: 89, tags: ["sourdough", "bread", "artisan"] },
  { name: "Cupcake Couture", category: "bakers-bakery", subcategory: "Custom Cupcakes", city: "Delhi", country: "India", countryCode: "IN", continent: "Asia", currency: "INR", tagline: "Gourmet cupcakes for every occasion", basePrice: 150, rating: 4.7, reviewCount: 64, tags: ["cupcakes", "desserts"] },
  { name: "Choco Art Studio", category: "bakers-bakery", subcategory: "Handmade Chocolates", city: "Hyderabad", country: "India", countryCode: "IN", continent: "Asia", currency: "INR", tagline: "Handcrafted chocolates & truffles", basePrice: 800, rating: 5.0, reviewCount: 42, tags: ["chocolates", "truffles", "gifts"] },
  { name: "Spice Route Catering", category: "caterers", subcategory: "Wedding Catering", city: "Chennai", country: "India", countryCode: "IN", continent: "Asia", currency: "INR", tagline: "Authentic South Indian catering", basePrice: 350, rating: 4.9, reviewCount: 156, tags: ["catering", "wedding", "south-indian"] },
  { name: "Chef At Home", category: "chef-staff", subcategory: "Private Chef", city: "Pune", country: "India", countryCode: "IN", continent: "Asia", currency: "INR", tagline: "Fine dining in your kitchen", basePrice: 2500, rating: 4.8, reviewCount: 38, tags: ["private chef", "fine dining"] },
  { name: "Street Bites Truck", category: "food-trucks", subcategory: "Street Food", city: "Goa", country: "India", countryCode: "IN", continent: "Asia", currency: "INR", tagline: "Beachside street food & BBQ", basePrice: 200, rating: 4.6, reviewCount: 73, tags: ["food truck", "bbq", "street food"] },
  { name: "Maison Levain", category: "bakers-bakery", subcategory: "Sourdough", city: "Paris", country: "France", countryCode: "FR", continent: "Europe", currency: "EUR", tagline: "Parisian sourdough masters", basePrice: 12, rating: 4.9, reviewCount: 211, tags: ["sourdough", "paris", "artisan"] },
  { name: "Brooklyn Bake House", category: "bakers-bakery", subcategory: "Custom Cakes", city: "New York", country: "USA", countryCode: "US", continent: "North America", currency: "USD", tagline: "Custom cakes & pastries", basePrice: 85, rating: 4.7, reviewCount: 98, tags: ["cakes", "pastries", "custom"] },
  { name: "Dessert Lab", category: "bakers-bakery", subcategory: "Cheesecakes", city: "London", country: "UK", countryCode: "GB", continent: "Europe", currency: "GBP", tagline: "Experimental desserts & cheesecakes", basePrice: 18, rating: 4.8, reviewCount: 67, tags: ["desserts", "cheesecake", "modern"] },
];

const PARTY_PLACEHOLDERS = [
  { name: "Neon Pulse DJs", category: "djs", subcategory: "Open-Format", city: "Mumbai", country: "India", countryCode: "IN", continent: "Asia", currency: "INR", tagline: "Bollywood to EDM — we bring the party", basePrice: 15000, rating: 4.9, reviewCount: 112, tags: ["dj", "wedding", "edm"] },
  { name: "Frame & Story", category: "photographers", subcategory: "Wedding Photography", city: "Melbourne", country: "Australia", countryCode: "AU", continent: "Oceania", currency: "AUD", tagline: "Documentary-style wedding photography", basePrice: 4200, rating: 4.8, reviewCount: 67, tags: ["photography", "wedding", "documentary"] },
  { name: "Blossom Events", category: "event-planners", subcategory: "Weddings", city: "Dubai", country: "UAE", countryCode: "AE", continent: "Asia", currency: "AED", tagline: "Luxury wedding planning in Dubai", basePrice: 25000, rating: 5.0, reviewCount: 45, tags: ["planner", "luxury", "wedding"] },
  { name: "Balloon & Bloom", category: "decorators", subcategory: "Balloon Decor", city: "Hyderabad", country: "India", countryCode: "IN", continent: "Asia", currency: "INR", tagline: "Balloon arches & floral decor", basePrice: 8000, rating: 4.7, reviewCount: 89, tags: ["decor", "balloons", "flowers"] },
  { name: "Skyline Rooftop Hall", category: "venues", subcategory: "Banquet Halls", city: "Bengaluru", country: "India", countryCode: "IN", continent: "Asia", currency: "INR", tagline: "Stunning rooftop venue for 500 guests", basePrice: 80000, rating: 4.8, reviewCount: 34, tags: ["venue", "rooftop", "events"] },
  { name: "Wonder Circus Co.", category: "entertainers", subcategory: "Magicians", city: "Delhi", country: "India", countryCode: "IN", continent: "Asia", currency: "INR", tagline: "Magicians, mascots & live entertainment", basePrice: 5000, rating: 4.6, reviewCount: 56, tags: ["entertainment", "kids", "magic"] },
  { name: "Petal & Posy", category: "florists", subcategory: "Wedding Flowers", city: "London", country: "UK", countryCode: "GB", continent: "Europe", currency: "GBP", tagline: "Bespoke floral arrangements", basePrice: 350, rating: 4.9, reviewCount: 78, tags: ["flowers", "wedding", "bouquets"] },
  { name: "Lumière Films", category: "videographers", subcategory: "Wedding Films", city: "Goa", country: "India", countryCode: "IN", continent: "Asia", currency: "INR", tagline: "Cinematic wedding films & same-day edits", basePrice: 45000, rating: 4.8, reviewCount: 43, tags: ["video", "cinematic", "wedding"] },
  { name: "Glam Squad", category: "makeup-artists", subcategory: "Bridal Makeup", city: "Chennai", country: "India", countryCode: "IN", continent: "Asia", currency: "INR", tagline: "HD & airbrush bridal makeup", basePrice: 12000, rating: 4.7, reviewCount: 92, tags: ["makeup", "bridal", "hd"] },
  { name: "Party Bus Express", category: "transportation", subcategory: "Party Buses", city: "Pune", country: "India", countryCode: "IN", continent: "Asia", currency: "INR", tagline: "Luxury party buses for celebrations", basePrice: 18000, rating: 4.5, reviewCount: 28, tags: ["transport", "party bus", "luxury"] },
];

export function getPlaceholderVendors(ecosystem: Ecosystem): Vendor[] {
  const data = ecosystem === "FINDMYBITES" ? FOOD_PLACEHOLDERS : PARTY_PLACEHOLDERS;
  return data.map((p, i) => ({
    id: `demo-${ecosystem}-${i}`,
    name: p.name,
    slug: `demo-${i}`,
    ecosystem,
    category: p.category,
    tagline: p.tagline,
    description: "",
    city: p.city,
    country: p.country,
    countryCode: p.countryCode,
    continent: p.continent,
    currency: p.currency,
    priceRange: "$$",
    basePrice: p.basePrice,
    rating: p.rating,
    reviewCount: p.reviewCount,
    heroImage: "",
    avatarImage: "",
    gallery: [],
    tags: p.tags,
    featured: false,
    verified: true,
    approved: true,
    responseTime: "Under 2 hours",
    yearsActive: 3,
    completedBookings: p.reviewCount,
    subcategory: p.subcategory,
    createdAt: new Date().toISOString(),
  } as Vendor));
}
