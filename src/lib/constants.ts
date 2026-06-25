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
  label: string;
  description: string;
  icon: string; // lucide icon name
  image: string;
  accent: string; // tailwind gradient classes
}

export const CATEGORIES: CategoryDef[] = [
  // ---- FindMyBites (Food) — 6 categories (NEW ARCHITECTURE) ----
  {
    id: "bakers-bakery",
    ecosystem: "FINDMYBITES",
    label: "Bakers & Bakery",
    description: "Cakes, cupcakes, chocolates, desserts — all baked goods in one place.",
    icon: "Cake",
    image: "/vendors/cake-artist.png",
    accent: "from-orange-400 to-rose-500",
  },
  {
    id: "caterers",
    ecosystem: "FINDMYBITES",
    label: "Caterers",
    description: "Full-service catering for weddings, corporate events, and gatherings.",
    icon: "UtensilsCrossed",
    image: "/vendors/catering.png",
    accent: "from-rose-400 to-red-500",
  },
  {
    id: "chef-staff",
    ecosystem: "FINDMYBITES",
    label: "Chef & Staff",
    description: "Private chefs, pastry chefs, bartenders, waiters, and event crew.",
    icon: "ChefHat",
    image: "/vendors/private-chef.png",
    accent: "from-lime-400 to-emerald-500",
  },
  {
    id: "food-trucks",
    ecosystem: "FINDMYBITES",
    label: "Food Trucks",
    description: "Mobile kitchens serving street food, BBQ, pizza, and global bites.",
    icon: "Truck",
    image: "/vendors/food-truck.png",
    accent: "from-yellow-400 to-amber-500",
  },
  {
    id: "beverage-specialists",
    ecosystem: "FINDMYBITES",
    label: "Beverage Specialists",
    description: "Coffee, tea, mocktail, juice, smoothie, and bubble tea catering.",
    icon: "Coffee",
    image: "/vendors/catering.png",
    accent: "from-teal-400 to-cyan-500",
  },
  {
    id: "specialty-food",
    ecosystem: "FINDMYBITES",
    label: "Specialty Food",
    description: "Organic, keto, vegan, gluten-free, halal, kosher, sugar-free, dairy-free.",
    icon: "UtensilsCrossed",
    image: "/vendors/catering.png",
    accent: "from-green-400 to-teal-500",
  },
  // ---- PimpMyParty (Events) — 15 categories ----
  {
    id: "event-planners",
    ecosystem: "PIMPMYPARTY",
    label: "Event Planners",
    description: "End-to-end planning for weddings, milestones, and brand activations.",
    icon: "ClipboardList",
    image: "/vendors/event-planner.png",
    accent: "from-fuchsia-400 to-purple-500",
  },
  {
    id: "decorators",
    ecosystem: "PIMPMYPARTY",
    label: "Decorators",
    description: "Balloon art, florals, tablescapes, and immersive themed decor.",
    icon: "Flower2",
    image: "/vendors/decorator.png",
    accent: "from-purple-400 to-pink-500",
  },
  {
    id: "photographers",
    ecosystem: "PIMPMYPARTY",
    label: "Photographers",
    description: "Wedding, event, and corporate photography services.",
    icon: "Camera",
    image: "/vendors/photographer.png",
    accent: "from-pink-400 to-purple-500",
  },
  {
    id: "videographers",
    ecosystem: "PIMPMYPARTY",
    label: "Videographers",
    description: "Cinematic video, films, and drone videography for events.",
    icon: "Video",
    image: "/vendors/photographer.png",
    accent: "from-indigo-400 to-purple-500",
  },
  {
    id: "djs",
    ecosystem: "PIMPMYPARTY",
    label: "DJs",
    description: "DJs, live bands, and sound engineers to keep your party moving.",
    icon: "Music",
    image: "/vendors/dj.png",
    accent: "from-fuchsia-500 to-rose-500",
  },
  {
    id: "entertainers",
    ecosystem: "PIMPMYPARTY",
    label: "Entertainers",
    description: "Magicians, clowns, mascots, performers, and live acts for all ages.",
    icon: "Drama",
    image: "/vendors/entertainer.png",
    accent: "from-violet-400 to-fuchsia-500",
  },
  {
    id: "venues",
    ecosystem: "PIMPMYPARTY",
    label: "Venues",
    description: "Banquet halls, rooftops, gardens, and unique event spaces worldwide.",
    icon: "Building2",
    image: "/vendors/venue.png",
    accent: "from-purple-500 to-indigo-500",
  },
  {
    id: "florists",
    ecosystem: "PIMPMYPARTY",
    label: "Florists",
    description: "Wedding flowers, bouquets, centerpieces, and floral installations.",
    icon: "Flower2",
    image: "/vendors/decorator.png",
    accent: "from-rose-400 to-pink-500",
  },
  {
    id: "rental-services",
    ecosystem: "PIMPMYPARTY",
    label: "Rental Services",
    description: "Tents, furniture, tableware, and equipment rentals for events.",
    icon: "Package",
    image: "/vendors/venue.png",
    accent: "from-slate-400 to-gray-500",
  },
  {
    id: "makeup-artists",
    ecosystem: "PIMPMYPARTY",
    label: "Makeup Artists",
    description: "Bridal, party, and editorial makeup services.",
    icon: "Sparkles",
    image: "/vendors/entertainer.png",
    accent: "from-pink-500 to-rose-500",
  },
  {
    id: "beauty-services",
    ecosystem: "PIMPMYPARTY",
    label: "Beauty Services",
    description: "Hair styling, mehndi, spa, and grooming services for events.",
    icon: "Sparkles",
    image: "/vendors/entertainer.png",
    accent: "from-rose-400 to-fuchsia-500",
  },
  {
    id: "transportation",
    ecosystem: "PIMPMYPARTY",
    label: "Transportation",
    description: "Limousines, party buses, and guest transport for events.",
    icon: "Car",
    image: "/vendors/venue.png",
    accent: "from-blue-400 to-slate-500",
  },
  {
    id: "invitation-printing",
    ecosystem: "PIMPMYPARTY",
    label: "Invitation & Printing",
    description: "Custom invitations, cards, and printing for all occasions.",
    icon: "Mail",
    image: "/vendors/event-planner.png",
    accent: "from-amber-400 to-yellow-500",
  },
  {
    id: "kids-party-services",
    ecosystem: "PIMPMYPARTY",
    label: "Kids Party Services",
    description: "Bounce houses, mascots, games, and themed kids entertainment.",
    icon: "PartyPopper",
    image: "/vendors/entertainer.png",
    accent: "from-cyan-400 to-blue-500",
  },
  {
    id: "audio-visual-services",
    ecosystem: "PIMPMYPARTY",
    label: "Audio Visual Services",
    description: "Sound systems, lighting, LED walls, and AV production.",
    icon: "Speaker",
    image: "/vendors/dj.png",
    accent: "from-slate-500 to-zinc-600",
  },
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
