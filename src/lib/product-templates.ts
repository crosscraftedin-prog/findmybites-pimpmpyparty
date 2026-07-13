import type { Ecosystem } from "./types";
import type { ProductInfo, InfoSection } from "./products/product-info";
import {
  INGREDIENTS_SECTION,
  ALLERGENS_SECTION,
  NUTRITION_SECTION,
  PACKAGING_SECTION,
  STORAGE_SECTION,
  SHELF_LIFE_SECTION,
  SERVING_CARE_SECTION,
  HIGHLIGHTS_SECTION,
  LOGISTICS_SECTION,
  CUSTOMISATION_SECTION,
  OCCASION_TAGS_SECTION,
  RECIPE_COST_SECTION,
} from "./products/product-info";

export interface ProductTemplate {
  name: string;
  packageType: "basic" | "standard" | "premium";
  description: string;
  suggestedPrice: number;
  capacity?: number;
  duration?: string;
  includes: string[];
  dietaryTags?: string[];
  productInfo?: ProductInfo;
  /** Product Information sections (Step 6). Template-driven — no category logic. */
  infoSections?: InfoSection[];
  /** Customisation sections (Step 7). */
  customisationSections?: InfoSection[];
  /** FAQ sections — templates can define custom FAQ-generating sections. */
  faqSections?: InfoSection[];
}

// ── Template-defined section sets ──────────────────────────────────────────
// Each category's templates define their OWN sections. No category lookup.

// Bakery: full set
const BAKERY_INFO: InfoSection[] = [
  INGREDIENTS_SECTION,
  ALLERGENS_SECTION,
  NUTRITION_SECTION,
  PACKAGING_SECTION,
  STORAGE_SECTION,
  SHELF_LIFE_SECTION,
  SERVING_CARE_SECTION,
  HIGHLIGHTS_SECTION,
  LOGISTICS_SECTION,
  OCCASION_TAGS_SECTION,
];

const BAKERY_CUSTOMISATION: InfoSection[] = [CUSTOMISATION_SECTION];
const BAKERY_FAQ: InfoSection[] = []; // FAQs generated from productInfo

// Caterer / Chef: menu-focused
const CATERING_INFO: InfoSection[] = [
  {
    key: "menu",
    heading: "Menu Details",
    icon: "🍽️",
    fields: [
      { key: "menuItems", label: "Menu Items", type: "richtext", placeholder: "Starter: Paneer Tikka\nMain: Butter Paneer, Dal Makhani\nDessert: Gulab Jamun" },
      { key: "servingSizeCatering", label: "Serving Size", type: "text", placeholder: "Serves 50 guests" },
      { key: "dietaryOptions", label: "Dietary Options", type: "text", placeholder: "Veg, Non-Veg, Jain options available" },
    ],
  },
  ALLERGENS_SECTION,
  PACKAGING_SECTION,
  HIGHLIGHTS_SECTION,
  LOGISTICS_SECTION,
  OCCASION_TAGS_SECTION,
];

// Florist: flower care
const FLORIST_INFO: InfoSection[] = [
  {
    key: "flowers",
    heading: "Flower Information",
    icon: "🌸",
    fields: [
      { key: "flowerTypes", label: "Flower Types", type: "richtext", placeholder: "Roses, Lilies, Carnations, Baby Breath…" },
      { key: "careInstructionsFlorist", label: "Care Instructions", type: "richtext", placeholder: "Change water daily. Keep away from direct sunlight." },
      { key: "freshnessGuarantee", label: "Freshness Guarantee", type: "text", placeholder: "Fresh for 5-7 days with proper care" },
    ],
  },
  PACKAGING_SECTION,
  SHELF_LIFE_SECTION,
  HIGHLIGHTS_SECTION,
  OCCASION_TAGS_SECTION,
];

// Decorator: setup-focused
const DECORATOR_INFO: InfoSection[] = [
  {
    key: "setup",
    heading: "Setup Information",
    icon: "🎨",
    fields: [
      { key: "setupTime", label: "Setup Time", type: "text", placeholder: "2-3 hours" },
      { key: "cleanupTime", label: "Cleanup Time", type: "text", placeholder: "1 hour" },
      { key: "materialsIncluded", label: "Materials Included", type: "richtext", placeholder: "Balloon arch, backdrop, table centerpieces, lighting" },
    ],
  },
  HIGHLIGHTS_SECTION,
  OCCASION_TAGS_SECTION,
];

// Entertainer: performance-focused
const ENTERTAINER_INFO: InfoSection[] = [
  {
    key: "performance",
    heading: "Performance Details",
    icon: "🎭",
    fields: [
      { key: "performanceDuration", label: "Performance Duration", type: "text", placeholder: "1 hour / 2 hours" },
      { key: "languagesSpoken", label: "Languages", type: "text", placeholder: "English, Hindi, Telugu" },
      { key: "travelDistance", label: "Travel Distance", type: "text", placeholder: "Within 30 km" },
      { key: "equipmentRequired", label: "Equipment Required", type: "richtext", placeholder: "Sound system, microphone, stage space (10x10 ft)" },
    ],
  },
  HIGHLIGHTS_SECTION,
  OCCASION_TAGS_SECTION,
];

// Generic (event planners, photographers, DJs, venues, videographers)
const GENERIC_INFO: InfoSection[] = [
  HIGHLIGHTS_SECTION,
  LOGISTICS_SECTION,
  OCCASION_TAGS_SECTION,
];

const GENERIC_CUSTOMISATION: InfoSection[] = [CUSTOMISATION_SECTION];

const TEMPLATES: Record<string, ProductTemplate[]> = {
  // ── FINDMYBITES ──
  "bakers-bakery": [
    {
      name: "Custom Wedding Cake",
      packageType: "premium",
      description: "3-tier custom wedding cake, feeds 80 guests. Your choice of flavours and design.",
      suggestedPrice: 850, capacity: 80,
      includes: ["3 tiers", "Custom design", "Tasting session", "Delivery included"],
      productInfo: {
        ingredients: "Refined Wheat Flour, Butter, Sugar, Eggs, Cocoa Powder, Vanilla Extract, Baking Powder",
        dietaryBadges: ["Customizable"],
        packageType: "Cake Box",
        packagingNotes: "Packed securely in a premium food-grade cake box with sturdy base.",
        shelfLife: "2 Days",
        storageType: ["Refrigerate"],
        storageInstructions: "Store refrigerated. Bring to room temperature for 30 minutes before serving.",
        servingCare: ["Keep refrigerated", "Remove 30 minutes before serving", "Use warm knife", "Handle fondant carefully"],
        allergens: ["Milk", "Eggs", "Wheat", "Gluten"],
        facilityWarning: "Manufactured in a facility that also processes Dairy, Eggs, Peanuts and Tree Nuts.",
        highlights: ["Made to Order", "Premium Ingredients", "Handcrafted", "Customizable", "Bestseller"],
      },
      infoSections: BAKERY_INFO,
      customisationSections: BAKERY_CUSTOMISATION,
      faqSections: BAKERY_FAQ,
    },
    {
      name: "Birthday Cake",
      packageType: "standard",
      description: "Custom birthday cake design, feeds 20 guests.",
      suggestedPrice: 120, capacity: 20,
      includes: ["Custom design", "Choice of flavours", "Candles included"],
      productInfo: {
        ingredients: "Refined Wheat Flour, Butter, Sugar, Eggs, Cocoa Powder, Vanilla Extract, Baking Powder",
        dietaryBadges: ["Customizable"],
        packageType: "Cake Box",
        packagingNotes: "Packed in a premium food-grade cake box.",
        shelfLife: "3 Days",
        storageType: ["Refrigerate"],
        storageInstructions: "Store refrigerated. Bring to room temperature for 30 minutes before serving.",
        servingCare: ["Keep refrigerated", "Serve after 30 minutes", "Use warm knife"],
        allergens: ["Milk", "Eggs", "Wheat", "Gluten"],
        facilityWarning: "Manufactured in a facility that also processes Dairy, Eggs and Tree Nuts.",
        highlights: ["Freshly Baked", "Made to Order", "Customizable", "Bestseller"],
      },
      infoSections: BAKERY_INFO,
      customisationSections: BAKERY_CUSTOMISATION,
      faqSections: BAKERY_FAQ,
    },
    {
      name: "Cupcake Tower",
      packageType: "standard",
      description: "50 assorted cupcakes with decorative display.",
      suggestedPrice: 150, capacity: 50,
      includes: ["50 cupcakes", "Assorted flavours", "Display stand", "Decorative toppings"],
      productInfo: {
        ingredients: "Refined Wheat Flour, Butter, Sugar, Eggs, Cocoa Powder, Vanilla Extract, Baking Powder, Cream Cheese",
        dietaryBadges: ["Customizable"],
        packageType: "Tray",
        packagingNotes: "Packed in food-grade cupcake trays with protective covers.",
        shelfLife: "2 Days",
        storageType: ["Room Temperature"],
        storageInstructions: "Store in a cool, dry place. Best consumed within 24 hours.",
        servingCare: ["Best served chilled", "Do not expose to sunlight"],
        allergens: ["Milk", "Eggs", "Wheat", "Gluten"],
        facilityWarning: "Manufactured in a facility that also processes Dairy, Eggs and Tree Nuts.",
        highlights: ["Freshly Baked", "Made to Order", "Customizable", "Bestseller"],
      },
      infoSections: BAKERY_INFO,
      customisationSections: BAKERY_CUSTOMISATION,
      faqSections: BAKERY_FAQ,
    },
  ],
  "caterers": [
    { name: "Wedding Buffet Package", packageType: "standard", description: "Per head buffet catering, minimum 50 guests.", suggestedPrice: 45, capacity: 50, includes: ["3-course buffet", "Serving staff", "Setup and cleanup", "Customizable menu"], infoSections: CATERING_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Corporate Lunch Box", packageType: "basic", description: "Per person lunch box delivery, minimum 20.", suggestedPrice: 15, capacity: 20, includes: ["Main course", "Side dish", "Dessert", "Delivered to office"], infoSections: CATERING_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Full Wedding Catering", packageType: "premium", description: "Complete wedding catering with starter, main and dessert.", suggestedPrice: 85, capacity: 200, includes: ["5-course meal", "Welcome drinks", "Live stations", "Dessert table", "Full staff"], infoSections: CATERING_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
  ],
  "chef-staff": [
    { name: "Private Dinner Experience", packageType: "premium", description: "3-course private dinner for 2-8 guests in your home.", suggestedPrice: 250, capacity: 8, includes: ["3-course menu", "Ingredient sourcing", "Cooking on-site", "Cleanup"], infoSections: CATERING_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Cooking Class for Groups", packageType: "standard", description: "Interactive cooking class for up to 10 people.", suggestedPrice: 80, capacity: 10, includes: ["Hands-on cooking", "All ingredients", "Recipe cards", "Take home what you cook"], infoSections: CATERING_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Private Chef for Events", packageType: "premium", description: "Full event catering for up to 50 guests.", suggestedPrice: 500, capacity: 50, includes: ["Custom menu", "Full service", "All equipment", "Staff included"], infoSections: CATERING_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
  ],
  "food-trucks": [
    { name: "2-Hour Street Food Service", packageType: "basic", description: "Food truck service for up to 50 guests, 2 hours.", suggestedPrice: 400, capacity: 50, duration: "2 hours", includes: ["Street food menu", "Food truck", "Server", "Biodegradable packaging"], infoSections: CATERING_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Half Day Event Package", packageType: "standard", description: "4-hour food truck service for up to 100 guests.", suggestedPrice: 800, capacity: 100, duration: "4 hours", includes: ["Extended menu", "2 servers", "Drinks station", "Setup included"], infoSections: CATERING_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Full Day Festival Package", packageType: "premium", description: "8-hour food truck for festivals, up to 200 guests.", suggestedPrice: 1500, capacity: 200, duration: "8 hours", includes: ["Full menu", "3 staff members", "Drinks and dessert", "Power generator"], infoSections: CATERING_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
  ],
  // ── PIMPMYPARTY ──
  "event-planners": [
    { name: "Full Wedding Planning Package", packageType: "premium", description: "12 months of full wedding planning support.", suggestedPrice: 5000, duration: "12 months", includes: ["Venue sourcing", "Vendor coordination", "Timeline management", "Day-of coordination", "Budget planning"], infoSections: GENERIC_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Day-of Coordination Package", packageType: "standard", description: "Coordination on the day of your event.", suggestedPrice: 800, duration: "1 day", includes: ["Timeline management", "Vendor liaison", "Setup oversight", "Emergency kit"], infoSections: GENERIC_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Birthday Party Planning", packageType: "standard", description: "Full service birthday party planning.", suggestedPrice: 600, includes: ["Theme concept", "Vendor booking", "Decor coordination", "Day-of management"], infoSections: GENERIC_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
  ],
  "decorators": [
    { name: "Basic Room Decoration", packageType: "basic", description: "Standard room decoration for small events.", suggestedPrice: 300, includes: ["Balloon arch", "Table centerpieces", "Backdrop", "Lighting"], infoSections: DECORATOR_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Standard Wedding Decoration", packageType: "standard", description: "Ceremony and reception decoration.", suggestedPrice: 1500, includes: ["Ceremony arch", "Reception centerpieces", "Lighting design", "Table setup", "Chair covers"], infoSections: DECORATOR_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Premium Full Venue Transformation", packageType: "premium", description: "Complete venue transformation for luxury events.", suggestedPrice: 5000, includes: ["Full venue design", "Custom floral arrangements", "Premium lighting", "Lounge furniture", "Dance floor decor"], infoSections: DECORATOR_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
  ],
  "photographers": [
    { name: "2-Hour Event Photography", packageType: "basic", description: "2 hours of event coverage with 50 edited photos.", suggestedPrice: 300, duration: "2 hours", includes: ["2-hour coverage", "50 edited photos", "Online gallery", "Print release"], infoSections: GENERIC_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Half Day Coverage", packageType: "standard", description: "4 hours coverage with 100 edited photos.", suggestedPrice: 600, duration: "4 hours", includes: ["4-hour coverage", "100 edited photos", "Online gallery", "Print release", "Second shooter"], infoSections: GENERIC_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Full Day Wedding Photography", packageType: "premium", description: "8 hours coverage with album.", suggestedPrice: 1200, duration: "8 hours", includes: ["8-hour coverage", "300+ edited photos", "Premium album", "Online gallery", "Second shooter", "Engagement session"], infoSections: GENERIC_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
  ],
  "djs": [
    { name: "3-Hour Party DJ Package", packageType: "basic", description: "3-hour DJ set with equipment included.", suggestedPrice: 400, duration: "3 hours", includes: ["3-hour DJ set", "Sound system", "Lighting", "Microphone"], infoSections: GENERIC_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Wedding DJ Package", packageType: "premium", description: "6-hour DJ with MC services.", suggestedPrice: 900, duration: "6 hours", includes: ["6-hour DJ set", "MC services", "Premium sound system", "Dance floor lighting", "Custom playlist"], infoSections: GENERIC_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Corporate Event DJ", packageType: "standard", description: "4-hour professional DJ for corporate events.", suggestedPrice: 600, duration: "4 hours", includes: ["4-hour DJ set", "Professional sound system", "Background music during breaks", "Microphone for speeches"], infoSections: GENERIC_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
  ],
  "venues": [
    { name: "Half Day Venue Hire", packageType: "basic", description: "Half day venue for up to 50 guests.", suggestedPrice: 800, capacity: 50, duration: "4 hours", includes: ["4-hour venue hire", "Tables and chairs", "Basic AV equipment", "Parking"], infoSections: GENERIC_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Full Day Venue Hire", packageType: "standard", description: "Full day venue for up to 100 guests.", suggestedPrice: 1500, capacity: 100, duration: "8 hours", includes: ["8-hour venue hire", "Tables and chairs", "Full AV equipment", "Kitchen access", "Dedicated coordinator"], infoSections: GENERIC_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Weekend Wedding Package", packageType: "premium", description: "Full weekend venue for ceremony and reception.", suggestedPrice: 5000, capacity: 150, duration: "Weekend", includes: ["2-day venue hire", "Ceremony and reception spaces", "Bridal suite", "Full AV equipment", "On-site coordinator", "Setup and cleanup"], infoSections: GENERIC_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
  ],
  "florists": [
    { name: "Bridal Bouquet + Buttonholes", packageType: "basic", description: "Bridal bouquet with matching buttonholes.", suggestedPrice: 250, includes: ["Bridal bouquet", "5 buttonholes", "2 bridesmaid bouquets", "Ribbon and wrapping"], infoSections: FLORIST_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Wedding Ceremony Flowers", packageType: "standard", description: "Complete ceremony flower package.", suggestedPrice: 800, includes: ["Ceremony arch flowers", "Aisle decorations", "Table centerpieces", "Bridal bouquet"], infoSections: FLORIST_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Full Wedding Flowers", packageType: "premium", description: "Complete wedding flowers for ceremony and reception.", suggestedPrice: 2000, includes: ["Ceremony and reception flowers", "Bridal party bouquets", "Table centerpieces", "Flower wall", "Cake flowers"], infoSections: FLORIST_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
  ],
  "videographers": [
    { name: "2-Hour Event Video", packageType: "basic", description: "2-hour event coverage with highlight reel.", suggestedPrice: 400, duration: "2 hours", includes: ["2-hour coverage", "3-minute highlight reel", "Digital delivery", "Background music"], infoSections: GENERIC_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Full Day Wedding Video", packageType: "premium", description: "Full day wedding videography with edited film.", suggestedPrice: 1500, duration: "8 hours", includes: ["8-hour coverage", "10-minute wedding film", "Highlight reel", "Raw footage", "Drone shots"], infoSections: GENERIC_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Corporate Promo Video", packageType: "standard", description: "1-minute professionally edited promo video.", suggestedPrice: 600, includes: ["Half-day shoot", "1-minute edited video", "Background music", "2 rounds of revisions"], infoSections: GENERIC_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
  ],
  "entertainers": [
    { name: "1-Hour Magic Show", packageType: "basic", description: "Interactive magic show for up to 30 kids.", suggestedPrice: 200, capacity: 30, duration: "1 hour", includes: ["1-hour magic show", "Audience participation", "Balloon animals", "Photo opportunity"], infoSections: ENTERTAINER_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Face Painting Session", packageType: "basic", description: "2-hour face painting for up to 40 kids.", suggestedPrice: 180, capacity: 40, duration: "2 hours", includes: ["2-hour face painting", "30+ designs", "Hypoallergenic paint", "Glitter tattoos"], infoSections: ENTERTAINER_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
    { name: "Full Kids Party Package", packageType: "premium", description: "Complete kids party with entertainer, decor and activities.", suggestedPrice: 600, capacity: 30, duration: "3 hours", includes: ["3-hour entertainment", "Magic show", "Face painting", "Balloon twisting", "Party games", "Small decor package"], infoSections: ENTERTAINER_INFO, customisationSections: GENERIC_CUSTOMISATION, faqSections: [] },
  ],
};

export function getTemplates(ecosystem: Ecosystem, category: string): ProductTemplate[] {
  // V2: no category lookup. Templates define their own sections.
  // If a template doesn't define sections, they default to undefined and
  // the component falls back to DEFAULT_INFO_SECTIONS.
  return TEMPLATES[category] ?? [];
}

export function getAllTemplates(): Record<string, ProductTemplate[]> {
  return TEMPLATES;
}

/**
 * Find a template by name within a category.
 */
export function findTemplate(category: string, templateName: string): ProductTemplate | null {
  const list = TEMPLATES[category] ?? [];
  return list.find((t) => t.name === templateName) ?? null;
}

// Export RECIPE_COST_SECTION so the wizard can include it as a vendor-only step.
export { RECIPE_COST_SECTION };
