/**
 * Global Attribute System — canonical attribute definitions.
 * ─────────────────────────────────────────────────────────────────────────
 * This is the single source of truth for seeded attributes. Admin can add
 * more via the Attribute Manager UI — these are just the defaults.
 *
 * Adding a new attribute here + re-running the seed is the ONLY way to get
 * canonical attributes without the admin UI. No code changes required.
 */

export type AttributeGroup =
  | "dietary"
  | "service"
  | "product_feature"
  | "business";

export type AttributeEcosystem = "FINDMYBITES" | "PIMPMYPARTY" | "BOTH";

export interface SeedAttribute {
  slug: string;
  name: string;
  group: AttributeGroup;
  icon?: string;
  color?: string;
  description?: string;
  ecosystem?: AttributeEcosystem;
}

/**
 * Dietary attributes — apply to food products & vendors.
 * Cross-category: Sugar Free on cakes, cupcakes, cookies, etc.
 */
export const DIETARY_ATTRIBUTES: SeedAttribute[] = [
  { slug: "sugar-free", name: "Sugar Free", group: "dietary", icon: "Candy", color: "emerald", description: "No added refined sugar" },
  { slug: "gluten-free", name: "Gluten Free", group: "dietary", icon: "Wheat", color: "amber", description: "Contains no gluten" },
  { slug: "keto", name: "Keto", group: "dietary", icon: "Flame", color: "rose", description: "Low-carb, high-fat friendly" },
  { slug: "vegan", name: "Vegan", group: "dietary", icon: "Leaf", color: "green", description: "No animal products" },
  { slug: "eggless", name: "Eggless", group: "dietary", icon: "Egg", color: "yellow", description: "Contains no eggs" },
  { slug: "dairy-free", name: "Dairy Free", group: "dietary", icon: "MilkOff", color: "sky", description: "No dairy products" },
  { slug: "nut-free", name: "Nut Free", group: "dietary", icon: "Nut", color: "orange", description: "Processed in a nut-free facility" },
  { slug: "organic", name: "Organic", group: "dietary", icon: "Sprout", color: "lime", description: "Certified organic ingredients" },
  { slug: "halal", name: "Halal", group: "dietary", icon: "CheckCircle2", color: "teal", description: "Halal-certified" },
  { slug: "jain-friendly", name: "Jain Friendly", group: "dietary", icon: "Leaf", color: "emerald", description: "No root vegetables, compliant with Jain diet" },
  { slug: "diabetic-friendly", name: "Diabetic Friendly", group: "dietary", icon: "HeartPulse", color: "blue", description: "Low glycemic index, suitable for diabetics" },
  { slug: "high-protein", name: "High Protein", group: "dietary", icon: "Dumbbell", color: "violet", description: "Protein-enriched" },
  { slug: "low-carb", name: "Low Carb", group: "dietary", icon: "Flame", color: "rose", description: "Reduced carbohydrates" },
  { slug: "no-preservatives", name: "No Preservatives", group: "dietary", icon: "ShieldCheck", color: "emerald", description: "Free from artificial preservatives" },
  { slug: "no-artificial-colors", name: "No Artificial Colors", group: "dietary", icon: "Palette", color: "emerald", description: "No synthetic food coloring" },
];

/**
 * Service attributes — delivery/order capabilities.
 */
export const SERVICE_ATTRIBUTES: SeedAttribute[] = [
  { slug: "same-day-delivery", name: "Same Day Delivery", group: "service", icon: "Truck", color: "blue", description: "Delivered the same day" },
  { slug: "midnight-delivery", name: "Midnight Delivery", group: "service", icon: "Moon", color: "indigo", description: "Midnight delivery available" },
  { slug: "pickup-available", name: "Pickup Available", group: "service", icon: "Store", color: "teal", description: "Customer pickup option" },
  { slug: "home-delivery", name: "Home Delivery", group: "service", icon: "Home", color: "sky", description: "Door-to-door delivery" },
  { slug: "custom-orders", name: "Custom Orders", group: "service", icon: "Palette", color: "violet", description: "Bespoke/customized orders accepted" },
  { slug: "corporate-orders", name: "Corporate Orders", group: "service", icon: "Building2", color: "slate", description: "Bulk corporate catering" },
  { slug: "bulk-orders", name: "Bulk Orders", group: "service", icon: "Package", color: "amber", description: "Large quantity orders" },
  { slug: "gift-wrapping", name: "Gift Wrapping", group: "service", icon: "Gift", color: "pink", description: "Gift wrapping available" },
];

/**
 * Product feature attributes — marketing badges for products.
 */
export const PRODUCT_FEATURE_ATTRIBUTES: SeedAttribute[] = [
  { slug: "bestseller", name: "Bestseller", group: "product_feature", icon: "Star", color: "amber", description: "Customer favorite" },
  { slug: "premium", name: "Premium", group: "product_feature", icon: "Crown", color: "yellow", description: "Premium quality tier" },
  { slug: "handmade", name: "Handmade", group: "product_feature", icon: "Hand", color: "rose", description: "Crafted by hand" },
  { slug: "fresh-daily", name: "Fresh Daily", group: "product_feature", icon: "Sunrise", color: "orange", description: "Made fresh every day" },
  { slug: "chef-recommended", name: "Chef Recommended", group: "product_feature", icon: "ChefHat", color: "violet", description: "Recommended by our chefs" },
  { slug: "seasonal", name: "Seasonal", group: "product_feature", icon: "Calendar", color: "teal", description: "Limited seasonal offering" },
  { slug: "limited-edition", name: "Limited Edition", group: "product_feature", icon: "Sparkles", color: "fuchsia", description: "Limited time only" },
];

/**
 * Business feature attributes — vendor-level credentials.
 */
export const BUSINESS_ATTRIBUTES: SeedAttribute[] = [
  { slug: "verified-vendor", name: "Verified Vendor", group: "business", icon: "BadgeCheck", color: "blue", description: "Identity & business verified" },
  { slug: "gst-registered", name: "GST Registered", group: "business", icon: "Receipt", color: "slate", description: "GST-registered business" },
  { slug: "fssai-certified", name: "FSSAI Certified", group: "business", icon: "ShieldCheck", color: "green", description: "Food safety certified (India)" },
  { slug: "home-baker", name: "Home Baker", group: "business", icon: "Home", color: "amber", description: "Home-based bakery" },
  { slug: "commercial-kitchen", name: "Commercial Kitchen", group: "business", icon: "Building", color: "slate", description: "Licensed commercial kitchen" },
  { slug: "women-owned", name: "Women Owned", group: "business", icon: "Heart", color: "pink", description: "Women-owned business" },
  { slug: "family-business", name: "Family Business", group: "business", icon: "Users", color: "teal", description: "Family-run establishment" },
];

/**
 * PimpMyParty-specific attributes (party/event vendors).
 * ecosystem = "PIMPMYPARTY" — only shown on the party marketplace.
 */
export const PARTY_ATTRIBUTES: SeedAttribute[] = [
  { slug: "outdoor-events", name: "Outdoor Events", group: "service", icon: "Trees", color: "green", description: "Outdoor event specialist", ecosystem: "PIMPMYPARTY" },
  { slug: "luxury-events", name: "Luxury Events", group: "product_feature", icon: "Crown", color: "yellow", description: "High-end luxury events", ecosystem: "PIMPMYPARTY" },
  { slug: "destination-wedding", name: "Destination Wedding", group: "service", icon: "Plane", color: "sky", description: "Destination wedding planning", ecosystem: "PIMPMYPARTY" },
  { slug: "budget-friendly", name: "Budget Friendly", group: "product_feature", icon: "Wallet", color: "emerald", description: "Affordable pricing", ecosystem: "PIMPMYPARTY" },
  { slug: "corporate-events", name: "Corporate Events", group: "service", icon: "Building2", color: "slate", description: "Corporate event specialist", ecosystem: "PIMPMYPARTY" },
  { slug: "kids-friendly", name: "Kids Friendly", group: "service", icon: "Baby", color: "pink", description: "Kid-friendly events", ecosystem: "PIMPMYPARTY" },
  { slug: "indoor-venue", name: "Indoor Venue", group: "service", icon: "Home", color: "teal", description: "Indoor venue available", ecosystem: "PIMPMYPARTY" },
  { slug: "live-music", name: "Live Music", group: "service", icon: "Music", color: "violet", description: "Live music/performances", ecosystem: "PIMPMYPARTY" },
  { slug: "photography-included", name: "Photography Included", group: "service", icon: "Camera", color: "rose", description: "Photography in package", ecosystem: "PIMPMYPARTY" },
];

export const ALL_SEED_ATTRIBUTES: SeedAttribute[] = [
  ...DIETARY_ATTRIBUTES,
  ...SERVICE_ATTRIBUTES,
  ...PRODUCT_FEATURE_ATTRIBUTES,
  ...BUSINESS_ATTRIBUTES,
  ...PARTY_ATTRIBUTES,
];

/**
 * Group metadata for display.
 */
export const ATTRIBUTE_GROUPS: {
  key: AttributeGroup;
  label: string;
  description: string;
}[] = [
  { key: "dietary", label: "Dietary", description: "Dietary preferences & restrictions" },
  { key: "service", label: "Service", description: "Delivery & service capabilities" },
  { key: "product_feature", label: "Product Features", description: "Product marketing badges" },
  { key: "business", label: "Business Features", description: "Vendor credentials & business type" },
];
