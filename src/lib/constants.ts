import type { Ecosystem } from "./types";

/**
 * Email addresses that have super-admin access. Anyone who signs in with one
 * of these gets the admin panel (the shield button in the header + the admin
 * dialog). Add more emails here as needed.
 */
export const ADMIN_EMAILS: string[] = [
  "bookingjosh@gmail.com",
];

/** Returns true if the given email is an admin. Case-insensitive. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some((a) => a.toLowerCase() === email.toLowerCase());
}

export interface CategoryDef {
  id: string;
  ecosystem: Ecosystem;
  // ALL metadata (label, description, icon, image, accent, seoTitle, seoDescription)
  // now lives in the database Category table. These fields are kept as optional
  // only for backward compatibility with backend code that hasn't been migrated.
  // They should NEVER be used for display — use useCategoryLabels() (client) or
  // getCategoryInfo() (server) instead.
  label?: string;
  description?: string;
  icon?: string;
  image?: string;
  accent?: string;
}

// This array is ONLY a slug → ecosystem mapping for backward compatibility.
// It is used by:
//   - migrateCategory() to resolve old slugs to new slugs
//   - Backend APIs for slug validation
// It does NOT contain labels, icons, images, or accent colors.
// All visual metadata is in the Category database table.
export const CATEGORIES: CategoryDef[] = [
  { id: "bakers-bakery", ecosystem: "FINDMYBITES" },
  { id: "caterers", ecosystem: "FINDMYBITES" },
  { id: "chef-staff", ecosystem: "FINDMYBITES" },
  { id: "food-trucks", ecosystem: "FINDMYBITES" },
  { id: "beverage-specialists", ecosystem: "FINDMYBITES" },
  { id: "specialty-food", ecosystem: "FINDMYBITES" },
  { id: "event-planners", ecosystem: "PIMPMYPARTY" },
  { id: "decorators", ecosystem: "PIMPMYPARTY" },
  { id: "photographers", ecosystem: "PIMPMYPARTY" },
  { id: "videographers", ecosystem: "PIMPMYPARTY" },
  { id: "djs", ecosystem: "PIMPMYPARTY" },
  { id: "entertainers", ecosystem: "PIMPMYPARTY" },
  { id: "venues", ecosystem: "PIMPMYPARTY" },
  { id: "florists", ecosystem: "PIMPMYPARTY" },
  { id: "rental-services", ecosystem: "PIMPMYPARTY" },
  { id: "makeup-artists", ecosystem: "PIMPMYPARTY" },
  { id: "beauty-services", ecosystem: "PIMPMYPARTY" },
  { id: "transportation", ecosystem: "PIMPMYPARTY" },
  { id: "invitation-printing", ecosystem: "PIMPMYPARTY" },
  { id: "kids-party-services", ecosystem: "PIMPMYPARTY" },
  { id: "audio-visual-services", ecosystem: "PIMPMYPARTY" },
  { id: "party-supplies", ecosystem: "PIMPMYPARTY" },
];

export function categoriesFor(ecosystem: Ecosystem): CategoryDef[] {
  return CATEGORIES.filter((c) => c.ecosystem === ecosystem);
}

export function getCategory(id: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export const CONTINENTS = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
  "Middle East",
] as const;

export const PRICE_RANGES = [
  { id: "$", label: "$ — Affordable", description: "Budget-friendly" },
  { id: "$$", label: "$$ — Moderate", description: "Mid-range pricing" },
  { id: "$$$", label: "$$$ — Premium", description: "Higher-end" },
  { id: "$$$$", label: "$$$$ — Luxury", description: "Top-tier luxury" },
] as const;

export const SORT_OPTIONS = [
  { id: "featured", label: "Featured first" },
  { id: "rating", label: "Top rated" },
  { id: "reviews", label: "Most reviewed" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "newest", label: "Newest" },
] as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  AED: "د.إ",
  AUD: "A$",
  CAD: "C$",
  JPY: "¥",
  SGD: "S$",
  BRL: "R$",
  ZAR: "R",
  NGN: "₦",
};

export const ECOSYSTEM_META: Record<
  Ecosystem,
  { label: string; short: string; tagline: string; gradient: string }
> = {
  FINDMYBITES: {
    label: "FindMyBites",
    short: "Food",
    tagline: "Discover exceptional food artisans, bakers & caterers across the globe.",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
  },
  PIMPMYPARTY: {
    label: "PimpMyParty",
    short: "Events",
    tagline: "Find the planners, decorators & entertainers to throw an unforgettable party.",
    gradient: "from-fuchsia-500 via-purple-500 to-pink-500",
  },
};

export interface CountryDef {
  code: string;
  name: string;
  continent: string;
  currency: string;
}

/** A curated list of countries across all continents for the vendor sign-up
 *  form. Selecting a country auto-derives countryCode + continent + a
 *  suggested currency (the user can still override the currency). */
export const COUNTRIES: CountryDef[] = [
  // Africa
  { code: "NG", name: "Nigeria", continent: "Africa", currency: "NGN" },
  { code: "ZA", name: "South Africa", continent: "Africa", currency: "ZAR" },
  { code: "KE", name: "Kenya", continent: "Africa", currency: "USD" },
  { code: "EG", name: "Egypt", continent: "Africa", currency: "USD" },
  { code: "MA", name: "Morocco", continent: "Africa", currency: "USD" },
  { code: "GH", name: "Ghana", continent: "Africa", currency: "USD" },
  // Asia
  { code: "IN", name: "India", continent: "Asia", currency: "INR" },
  { code: "JP", name: "Japan", continent: "Asia", currency: "JPY" },
  { code: "SG", name: "Singapore", continent: "Asia", currency: "SGD" },
  { code: "CN", name: "China", continent: "Asia", currency: "USD" },
  { code: "TH", name: "Thailand", continent: "Asia", currency: "USD" },
  { code: "ID", name: "Indonesia", continent: "Asia", currency: "USD" },
  { code: "PH", name: "Philippines", continent: "Asia", currency: "USD" },
  { code: "KR", name: "South Korea", continent: "Asia", currency: "USD" },
  // Europe
  { code: "GB", name: "United Kingdom", continent: "Europe", currency: "GBP" },
  { code: "FR", name: "France", continent: "Europe", currency: "EUR" },
  { code: "DE", name: "Germany", continent: "Europe", currency: "EUR" },
  { code: "IT", name: "Italy", continent: "Europe", currency: "EUR" },
  { code: "ES", name: "Spain", continent: "Europe", currency: "EUR" },
  { code: "PT", name: "Portugal", continent: "Europe", currency: "EUR" },
  { code: "NL", name: "Netherlands", continent: "Europe", currency: "EUR" },
  { code: "GR", name: "Greece", continent: "Europe", currency: "EUR" },
  { code: "IE", name: "Ireland", continent: "Europe", currency: "EUR" },
  // Middle East
  { code: "AE", name: "United Arab Emirates", continent: "Middle East", currency: "AED" },
  { code: "SA", name: "Saudi Arabia", continent: "Middle East", currency: "USD" },
  { code: "QA", name: "Qatar", continent: "Middle East", currency: "USD" },
  { code: "IL", name: "Israel", continent: "Middle East", currency: "USD" },
  { code: "TR", name: "Türkiye", continent: "Middle East", currency: "USD" },
  // North America
  { code: "US", name: "United States", continent: "North America", currency: "USD" },
  { code: "CA", name: "Canada", continent: "North America", currency: "CAD" },
  { code: "MX", name: "Mexico", continent: "North America", currency: "USD" },
  // South America
  { code: "BR", name: "Brazil", continent: "South America", currency: "BRL" },
  { code: "AR", name: "Argentina", continent: "South America", currency: "USD" },
  { code: "CO", name: "Colombia", continent: "South America", currency: "USD" },
  { code: "CL", name: "Chile", continent: "South America", currency: "USD" },
  { code: "PE", name: "Peru", continent: "South America", currency: "USD" },
  // Oceania
  { code: "AU", name: "Australia", continent: "Oceania", currency: "AUD" },
  { code: "NZ", name: "New Zealand", continent: "Oceania", currency: "USD" },
];

export function getCountry(code: string): CountryDef | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

/** Currencies the user can choose (keys of CURRENCY_SYMBOLS, sorted). */
export const CURRENCY_OPTIONS = Object.keys(CURRENCY_SYMBOLS).sort();

export const RESPONSE_TIME_OPTIONS = [
  "under 1 hour",
  "under 2 hours",
  "under 3 hours",
  "under 4 hours",
  "under 6 hours",
  "under 8 hours",
  "under 24 hours",
] as const;

/** Subcategory options keyed by category id. Helps customers filter more
 *  precisely and gives vendors a more specific positioning. */
export const SUBCATEGORIES: Record<string, string[]> = {
  // ── FindMyBites (Food) — NEW 6-category architecture ──
  "bakers-bakery": [
    // CAKES
    "Wedding Cakes", "Birthday Cakes", "Anniversary Cakes", "Baby Shower Cakes",
    "Engagement Cakes", "Corporate Cakes", "Theme Cakes", "Fondant Cakes",
    "Buttercream Cakes", "Custom Cakes", "Designer Cakes", "Vegan Cakes",
    "Eggless Cakes",
    // CUPCAKES
    "Wedding Cupcakes", "Birthday Cupcakes", "Mini Cupcakes", "Custom Cupcakes",
    // CHOCOLATES
    "Handmade Chocolates", "Truffles", "Chocolate Bouquets", "Chocolate Boxes",
    // DESSERTS
    "Cheesecakes", "Dessert Cups", "Tiramisu", "Mousse", "Puddings",
    // OTHER
    "Custom Vendor Entry",
  ],
  caterers: [
    "Live Counters", "Wedding Catering", "Corporate Catering", "Private Dining",
    "BBQ & Grill", "Buffet Catering", "Canapés & Cocktails",
    "Vegetarian Catering", "Vegan Catering", "Halal Catering",
    "Custom Vendor Entry",
  ],
  "chef-staff": [
    "Private Chef", "Wedding Chef", "Corporate Chef", "Pastry Chef",
    "Bartender", "Cocktail Maker", "Mixologist", "Bar Staff",
    "Waiters", "Waitresses", "Hosts", "Hostesses", "Serving Staff",
    "Event Crew", "Kitchen Assistants", "Cleaners",
    "Custom Vendor Entry",
  ],
  "food-trucks": [
    "Burgers", "Pizza", "BBQ", "Street Food", "Desserts", "Ice Cream", "Coffee",
    "Vendor Types What They Sell",
  ],
  "beverage-specialists": [
    "Coffee Catering", "Tea Catering", "Mocktail Bar", "Juice Bar",
    "Smoothie Bar", "Bubble Tea",
    "Vendor Types What They Sell",
  ],
  "specialty-food": [
    "Organic", "Keto & Low-Carb", "Vegan & Plant-Based", "Gluten-Free",
    "Halal", "Kosher", "Sugar-Free", "Dairy-Free",
    "Custom Vendor Entry",
  ],
  // ── PimpMyParty (Events) — unchanged ──
  "event-planners": [
    "Weddings", "Corporate Events", "Birthdays", "Brand Activations",
    "Destination Events", "Festivals", "Other",
  ],
  decorators: [
    "Wedding Decor", "Balloon Decor", "Floral Decor", "Stage Decor",
    "Table Styling", "Lighting", "Themed Decor", "Other",
  ],
  photographers: [
    "Wedding Photography", "Event Photography", "Drone Photography",
    "Corporate Photography", "Pre-Wedding Shoot", "Product Photography", "Other",
  ],
  videographers: [
    "Wedding Films", "Event Coverage", "Drone Videography",
    "Promotional Videos", "Live Streaming", "Documentary", "Other",
  ],
  djs: [
    "Open-Format", "House / EDM", "Bollywood", "Latin", "Afrobeats",
    "Hip-Hop", "Techno", "Other",
  ],
  entertainers: [
    "Magicians", "Clowns & Mascots", "Stilt Walkers", "Fire Performers",
    "Aerialists", "Live Bands", "Stand-up Comedy", "Other",
  ],
  venues: [
    "Banquet Halls", "Rooftops", "Gardens & Outdoor", "Beach / Waterfront",
    "Hotels & Resorts", "Industrial / Loft", "Farmhouses", "Other",
  ],
  florists: [
    "Wedding Flowers", "Bridal Bouquets", "Centerpieces",
    "Floral Installations", "Event Florals", "Other",
  ],
  "rental-services": [
    "Tents & Canopies", "Furniture Rental", "Tableware & Linens",
    "Stage & Lighting", "Power Generators", "Other",
  ],
  "makeup-artists": [
    "Bridal Makeup", "Party Makeup", "Editorial Makeup",
    "HD Makeup", "Airbrush Makeup", "Other",
  ],
  "beauty-services": [
    "Hair Styling", "Mehndi / Henna", "Spa & Massage", "Nail Art",
    "Grooming", "Other",
  ],
  transportation: [
    "Limousines", "Party Buses", "Guest Shuttles", "Vintage Cars",
    "Luxury Sedans", "Other",
  ],
  "invitation-printing": [
    "Wedding Invitations", "Birthday Cards", "Corporate Stationery",
    "Digital Invites", "Save the Dates", "Other",
  ],
  "kids-party-services": [
    "Bounce Houses", "Mascots & Characters", "Games & Activities",
    "Face Painting", "Themed Decor", "Other",
  ],
  "audio-visual-services": [
    "Sound Systems", "Stage Lighting", "LED Walls", "AV Production",
    "Live Streaming Setup", "Other",
  ],
  // ── New categories ──
  "party-supplies": [
    "Balloons & Helium", "Cake Toppers", "Party Props", "Disposable Tableware",
    "Banners & Confetti", "Goodie Bags & Gift Wrapping", "Party Hats & Accessories",
    "Piñatas & Party Poppers", "Custom Party Supplies", "Other",
  ],
  // ── Backward compatibility aliases (old category IDs map to new subcats) ──
  // These ensure existing vendors with old category slugs still render.
  "cake-artists": ["Wedding Cakes", "Birthday Cakes", "Custom Cakes", "Designer Cakes", "Vegan Cakes", "Eggless Cakes", "Other"],
  bakers: ["Wedding Cakes", "Custom Cakes", "Other"],
  "cupcake-specialists": ["Wedding Cupcakes", "Birthday Cupcakes", "Mini Cupcakes", "Custom Cupcakes", "Other"],
  chocolatiers: ["Handmade Chocolates", "Truffles", "Chocolate Boxes", "Other"],
  "dessert-makers": ["Cheesecakes", "Tiramisu", "Mousse", "Puddings", "Other"],
  catering: ["Wedding Catering", "Corporate Catering", "Buffet Catering", "BBQ & Grill", "Other"],
  "private-chefs": ["Private Chef", "Pastry Chef", "Other"],
  "specialty-foods": ["Organic", "Vegan & Plant-Based", "Gluten-Free", "Halal", "Kosher", "Other"],
};

export function subcategoriesFor(category: string): string[] {
  return SUBCATEGORIES[category] ?? ["Other"];
}

/**
 * Migration map: old FindMyBites category slugs → new category slugs.
 * Used to migrate existing vendors/products to the new 6-category architecture.
 *
 * Old (10) → New (6) mapping:
 *   cake-artists         → bakers-bakery
 *   bakers               → bakers-bakery
 *   cupcake-specialists  → bakers-bakery
 *   chocolatiers         → bakers-bakery
 *   dessert-makers       → bakers-bakery
 *   catering             → caterers
 *   private-chefs        → chef-staff
 *   food-trucks          → food-trucks (unchanged slug)
 *   beverage-specialists → beverage-specialists (unchanged slug)
 *   specialty-foods      → specialty-food
 */
export const CATEGORY_MIGRATION_MAP: Record<string, string> = {
  "cake-artists": "bakers-bakery",
  bakers: "bakers-bakery",
  "cupcake-specialists": "bakers-bakery",
  chocolatiers: "bakers-bakery",
  "dessert-makers": "bakers-bakery",
  catering: "caterers",
  "private-chefs": "chef-staff",
  "food-trucks": "food-trucks",
  "beverage-specialists": "beverage-specialists",
  "specialty-foods": "specialty-food",
};

/**
 * Returns the migrated category slug for a given (possibly old) category id.
 * If the category is already a new one (or a PimpMyParty category), it's
 * returned unchanged. Old FindMyBites slugs are remapped via
 * CATEGORY_MIGRATION_MAP.
 */
export function migrateCategory(category: string): string {
  return CATEGORY_MIGRATION_MAP[category] ?? category;
}

/**
 * Returns the category definition for a given id, applying the migration map
 * first so that old category slugs still resolve to their new definition.
 */
export function getCategoryMigrated(id: string): CategoryDef | undefined {
  return getCategory(migrateCategory(id));
}
