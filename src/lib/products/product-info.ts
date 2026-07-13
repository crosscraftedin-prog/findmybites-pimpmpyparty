/**
 * Product Information System — category-specific field definitions.
 * ─────────────────────────────────────────────────────────────────────────
 * Provides structured product information (Ingredients, Packaging, Storage,
 * Delivery, Allergens, Nutrition, Highlights) for product pages.
 *
 * Storage: all productInfo is stored as a JSON string in the existing
 * `Product.extraFields` column — NO schema migration required.
 *
 * Category-aware: bakery products get the full bakery section set;
 * florists get Flower Types / Care Instructions / etc.
 */

export interface ProductInfo {
  // ── Ingredients (bakery) ──
  ingredients?: string;
  dietaryBadges?: string[]; // eggless, vegetarian, vegan, jain, glutenFree, sugarFree, organic, noArtificialColours, noArtificialFlavours, noPreservatives

  // ── Packaging ──
  packageType?: string; // Cake Box, Gift Box, Window Box, Jar, Bottle, Cup, Tray, Eco Friendly, Custom
  packageContents?: string;
  packageWeight?: string;
  packagingNotes?: string;

  // ── Storage ──
  shelfLife?: string; // 1 Day, 2 Days, 3 Days, 5 Days, 7 Days, 15 Days, 30 Days
  storageType?: string; // Room Temperature, Refrigerate, Freeze
  storageInstructions?: string;
  servingSuggestion?: string;

  // ── Delivery ──
  sameDayDelivery?: boolean;
  midnightDelivery?: boolean;
  expressDelivery?: boolean;
  deliveryRadius?: string;
  estimatedDeliveryTime?: string;
  deliveryNotes?: string;

  // ── Allergens ──
  allergens?: string[]; // milk, eggs, wheat, gluten, soy, peanuts, treeNuts, sesame, sulphites, mustard, coconut, oats
  otherAllergens?: string;
  facilityWarning?: string;

  // ── Nutrition (optional) ──
  calories?: string;
  protein?: string;
  fat?: string;
  carbohydrates?: string;
  sugar?: string;
  servingSize?: string;

  // ── Product Highlights ──
  highlights?: string[]; // freshlyBaked, madeToOrder, 100percentVegetarian, premiumIngredients, handcrafted, customizable, noPreservatives, bestSeller, chefRecommended, limitedEdition

  // ── Florist-specific ──
  flowerTypes?: string;
  careInstructions?: string;
  freshnessGuarantee?: string;

  // ── Catering-specific ──
  menuItems?: string;
  servingSizeCatering?: string;
  dietaryOptions?: string;

  // ── Decorator-specific ──
  setupTime?: string;
  cleanupTime?: string;
  materialsIncluded?: string;

  // ── Entertainer-specific ──
  performanceDuration?: string;
  languagesSpoken?: string;
  travelDistance?: string;
  equipmentRequired?: string;
}

// ── Category → Section definitions ─────────────────────────────────────────

export interface InfoSection {
  key: string;
  heading: string;
  icon: string; // emoji
  fields: InfoField[];
}

export interface InfoField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkboxes" | "checkbox";
  options?: string[];
  placeholder?: string;
  optional?: boolean;
}

// ── Bakery sections (full set) ──
const BAKERY_SECTIONS: InfoSection[] = [
  {
    key: "ingredients",
    heading: "Ingredients",
    icon: "🥣",
    fields: [
      { key: "ingredients", label: "Ingredients", type: "textarea", placeholder: "Refined Wheat Flour, Butter, Cocoa Powder, Dark Chocolate, Fresh Cream, Sugar, Baking Powder…" },
      {
        key: "dietaryBadges",
        label: "Dietary Features",
        type: "checkboxes",
        options: ["Eggless", "Contains Eggs", "Vegetarian", "Vegan", "Jain Friendly", "Gluten Free", "Sugar Free", "Organic", "No Artificial Colours", "No Artificial Flavours", "No Preservatives"],
      },
    ],
  },
  {
    key: "packaging",
    heading: "Packaging",
    icon: "📦",
    fields: [
      { key: "packageType", label: "Package Type", type: "select", options: ["", "Cake Box", "Gift Box", "Window Box", "Jar", "Bottle", "Cup", "Tray", "Eco Friendly", "Custom"] },
      { key: "packageContents", label: "Package Contents", type: "text", placeholder: "1 Cake / 6 Cupcakes / 12 Cookies" },
      { key: "packageWeight", label: "Weight", type: "text", placeholder: "500g" },
      { key: "packagingNotes", label: "Packaging Notes", type: "textarea", placeholder: "Packed securely in a food-grade premium box." },
    ],
  },
  {
    key: "storage",
    heading: "Storage Instructions",
    icon: "🧊",
    fields: [
      { key: "shelfLife", label: "Shelf Life", type: "select", options: ["", "1 Day", "2 Days", "3 Days", "5 Days", "7 Days", "15 Days", "30 Days"] },
      { key: "storageType", label: "Storage Type", type: "select", options: ["", "Room Temperature", "Refrigerate", "Freeze"] },
      { key: "storageInstructions", label: "Storage Instructions", type: "textarea", placeholder: "Store refrigerated. Bring to room temperature for 30 minutes before serving." },
      { key: "servingSuggestion", label: "Serving Suggestion", type: "text", placeholder: "Serve chilled." },
    ],
  },
  {
    key: "delivery",
    heading: "Delivery Information",
    icon: "🚚",
    fields: [
      { key: "sameDayDelivery", label: "Same Day Delivery", type: "checkbox" },
      { key: "midnightDelivery", label: "Midnight Delivery", type: "checkbox" },
      { key: "expressDelivery", label: "Express Delivery", type: "checkbox" },
      { key: "deliveryRadius", label: "Delivery Radius", type: "text", placeholder: "Within 10 km" },
      { key: "estimatedDeliveryTime", label: "Estimated Delivery Time", type: "text", placeholder: "2-4 hours" },
      { key: "deliveryNotes", label: "Delivery Notes", type: "textarea", placeholder: "Available across Hyderabad. Orders above ₹999 receive free delivery." },
    ],
  },
  {
    key: "allergens",
    heading: "Allergens",
    icon: "⚠️",
    fields: [
      {
        key: "allergens",
        label: "Contains",
        type: "checkboxes",
        options: ["Milk", "Eggs", "Wheat", "Gluten", "Soy", "Peanuts", "Tree Nuts", "Sesame", "Sulphites", "Mustard", "Coconut", "Oats"],
      },
      { key: "otherAllergens", label: "Other Allergens", type: "text", placeholder: "List any other allergens" },
      { key: "facilityWarning", label: "Facility Warning (optional)", type: "textarea", placeholder: "Manufactured in a facility that also processes Dairy, Eggs, Peanuts and Tree Nuts.", optional: true },
    ],
  },
  {
    key: "nutrition",
    heading: "Nutritional Information",
    icon: "🍃",
    fields: [
      { key: "calories", label: "Calories", type: "text", placeholder: "250 kcal" },
      { key: "protein", label: "Protein", type: "text", placeholder: "4g" },
      { key: "fat", label: "Fat", type: "text", placeholder: "12g" },
      { key: "carbohydrates", label: "Carbohydrates", type: "text", placeholder: "35g" },
      { key: "sugar", label: "Sugar", type: "text", placeholder: "20g" },
      { key: "servingSize", label: "Serving Size", type: "text", placeholder: "1 slice (100g)" },
    ],
  },
  {
    key: "highlights",
    heading: "Product Highlights",
    icon: "✨",
    fields: [
      {
        key: "highlights",
        label: "Highlights",
        type: "checkboxes",
        options: ["Freshly Baked", "Made to Order", "100% Vegetarian", "Premium Ingredients", "Handcrafted", "Customizable", "No Preservatives", "Best Seller", "Chef Recommended", "Limited Edition"],
      },
    ],
  },
];

// ── Florist sections ──
const FLORIST_SECTIONS: InfoSection[] = [
  {
    key: "flowers",
    heading: "Flower Information",
    icon: "🌸",
    fields: [
      { key: "flowerTypes", label: "Flower Types", type: "textarea", placeholder: "Roses, Lilies, Carnations, Baby Breath…" },
      { key: "careInstructions", label: "Care Instructions", type: "textarea", placeholder: "Change water daily. Keep away from direct sunlight." },
      { key: "freshnessGuarantee", label: "Freshness Guarantee", type: "text", placeholder: "Fresh for 5-7 days with proper care" },
    ],
  },
  {
    key: "packaging",
    heading: "Packaging",
    icon: "📦",
    fields: [
      { key: "packageType", label: "Package Type", type: "select", options: ["", "Gift Box", "Window Box", "Bouquet Wrap", "Vase", "Basket", "Custom"] },
      { key: "packageContents", label: "Package Contents", type: "text", placeholder: "1 Bouquet / 12 Roses" },
      { key: "packagingNotes", label: "Packaging Notes", type: "textarea", placeholder: "Wrapped in premium tissue paper with ribbon." },
    ],
  },
  {
    key: "delivery",
    heading: "Delivery Information",
    icon: "🚚",
    fields: [
      { key: "sameDayDelivery", label: "Same Day Delivery", type: "checkbox" },
      { key: "midnightDelivery", label: "Midnight Delivery", type: "checkbox" },
      { key: "expressDelivery", label: "Express Delivery", type: "checkbox" },
      { key: "deliveryRadius", label: "Delivery Radius", type: "text", placeholder: "Within 15 km" },
      { key: "estimatedDeliveryTime", label: "Estimated Delivery Time", type: "text", placeholder: "2-4 hours" },
      { key: "deliveryNotes", label: "Delivery Notes", type: "textarea", placeholder: "Free delivery on orders above ₹1500." },
    ],
  },
  {
    key: "highlights",
    heading: "Product Highlights",
    icon: "✨",
    fields: [
      {
        key: "highlights",
        label: "Highlights",
        type: "checkboxes",
        options: ["Fresh Flowers", "Handcrafted", "Customizable", "Premium Quality", "Same Day Available", "Best Seller", "Seasonal", "Imported Flowers"],
      },
    ],
  },
];

// ── Catering sections ──
const CATERING_SECTIONS: InfoSection[] = [
  {
    key: "menu",
    heading: "Menu Details",
    icon: "🍽️",
    fields: [
      { key: "menuItems", label: "Menu Items", type: "textarea", placeholder: "Starter: Paneer Tikka\nMain: Butter Paneer, Dal Makhani\nDessert: Gulab Jamun" },
      { key: "servingSizeCatering", label: "Serving Size", type: "text", placeholder: "Serves 50 guests" },
      { key: "dietaryOptions", label: "Dietary Options", type: "text", placeholder: "Veg, Non-Veg, Jain options available" },
    ],
  },
  {
    key: "packaging",
    heading: "Packaging",
    icon: "📦",
    fields: [
      { key: "packageType", label: "Package Type", type: "select", options: ["", "Buffet Setup", "Individual Boxes", "Chafing Dishes", "Trays", "Custom"] },
      { key: "packageContents", label: "Package Contents", type: "text", placeholder: "Main course + 2 sides + dessert" },
      { key: "packagingNotes", label: "Packaging Notes", type: "textarea", placeholder: "Food-grade containers with disposable serving spoons." },
    ],
  },
  {
    key: "delivery",
    heading: "Delivery Information",
    icon: "🚚",
    fields: [
      { key: "sameDayDelivery", label: "Same Day Available", type: "checkbox" },
      { key: "expressDelivery", label: "Express Setup", type: "checkbox" },
      { key: "deliveryRadius", label: "Service Area", type: "text", placeholder: "Across Hyderabad" },
      { key: "estimatedDeliveryTime", label: "Setup Time", type: "text", placeholder: "45 minutes setup" },
      { key: "deliveryNotes", label: "Delivery Notes", type: "textarea", placeholder: "Free setup and cleanup for events above 100 guests." },
    ],
  },
  {
    key: "highlights",
    heading: "Product Highlights",
    icon: "✨",
    fields: [
      {
        key: "highlights",
        label: "Highlights",
        type: "checkboxes",
        options: ["Custom Menu", "Live Stations", "Professional Staff", "Premium Ingredients", "Bulk Orders", "Best Seller", "Chef Recommended", "Customizable"],
      },
    ],
  },
];

// ── Decorator sections ──
const DECORATOR_SECTIONS: InfoSection[] = [
  {
    key: "setup",
    heading: "Setup Information",
    icon: "🎨",
    fields: [
      { key: "setupTime", label: "Setup Time", type: "text", placeholder: "2-3 hours" },
      { key: "cleanupTime", label: "Cleanup Time", type: "text", placeholder: "1 hour" },
      { key: "materialsIncluded", label: "Materials Included", type: "textarea", placeholder: "Balloon arch, backdrop, table centerpieces, lighting" },
    ],
  },
  {
    key: "delivery",
    heading: "Delivery Information",
    icon: "🚚",
    fields: [
      { key: "deliveryRadius", label: "Service Area", type: "text", placeholder: "Across Hyderabad" },
      { key: "estimatedDeliveryTime", label: "Setup Window", type: "text", placeholder: "Day before or morning of event" },
      { key: "deliveryNotes", label: "Notes", type: "textarea", placeholder: "Free delivery within 20 km. Travel charges apply beyond." },
    ],
  },
  {
    key: "highlights",
    heading: "Product Highlights",
    icon: "✨",
    fields: [
      {
        key: "highlights",
        label: "Highlights",
        type: "checkboxes",
        options: ["Custom Themes", "Premium Materials", "On-Time Setup", "Customizable", "Best Seller", "Trending Design", "Budget Friendly", "Luxury Decor"],
      },
    ],
  },
];

// ── Entertainer sections ──
const ENTERTAINER_SECTIONS: InfoSection[] = [
  {
    key: "performance",
    heading: "Performance Details",
    icon: "🎭",
    fields: [
      { key: "performanceDuration", label: "Performance Duration", type: "text", placeholder: "1 hour / 2 hours" },
      { key: "languagesSpoken", label: "Languages", type: "text", placeholder: "English, Hindi, Telugu" },
      { key: "travelDistance", label: "Travel Distance", type: "text", placeholder: "Within 30 km" },
      { key: "equipmentRequired", label: "Equipment Required", type: "textarea", placeholder: "Sound system, microphone, stage space (10x10 ft)" },
    ],
  },
  {
    key: "delivery",
    heading: "Booking Information",
    icon: "🚚",
    fields: [
      { key: "deliveryRadius", label: "Travel Area", type: "text", placeholder: "Across Hyderabad" },
      { key: "estimatedDeliveryTime", label: "Setup Time", type: "text", placeholder: "30 minutes" },
      { key: "deliveryNotes", label: "Notes", type: "textarea", placeholder: "Travel charges may apply for locations beyond 20 km." },
    ],
  },
  {
    key: "highlights",
    heading: "Product Highlights",
    icon: "✨",
    fields: [
      {
        key: "highlights",
        label: "Highlights",
        type: "checkboxes",
        options: ["Interactive", "Kid-Friendly", "Professional", "Customizable", "Best Seller", "Audience Participation", "Multi-Language", "Award Winning"],
      },
    ],
  },
];

// ── Section registry by category ──
const SECTION_REGISTRY: Record<string, InfoSection[]> = {
  "bakers-bakery": BAKERY_SECTIONS,
  "florists": FLORIST_SECTIONS,
  "caterers": CATERING_SECTIONS,
  "decorators": DECORATOR_SECTIONS,
  "entertainers": ENTERTAINER_SECTIONS,
};

// Fallback for categories without specific sections — use a generic set
const GENERIC_SECTIONS: InfoSection[] = [
  {
    key: "delivery",
    heading: "Delivery Information",
    icon: "🚚",
    fields: [
      { key: "sameDayDelivery", label: "Same Day Available", type: "checkbox" },
      { key: "expressDelivery", label: "Express Available", type: "checkbox" },
      { key: "deliveryRadius", label: "Service Area", type: "text", placeholder: "Within 15 km" },
      { key: "estimatedDeliveryTime", label: "Estimated Time", type: "text", placeholder: "2-4 hours" },
      { key: "deliveryNotes", label: "Notes", type: "textarea", placeholder: "Delivery details and policies." },
    ],
  },
  {
    key: "highlights",
    heading: "Product Highlights",
    icon: "✨",
    fields: [
      {
        key: "highlights",
        label: "Highlights",
        type: "checkboxes",
        options: ["Made to Order", "Premium Quality", "Customizable", "Best Seller", "Handcrafted", "Professional Service"],
      },
    ],
  },
];

/**
 * Get the product info sections for a given category.
 * Falls back to generic sections if no category-specific set exists.
 */
export function getSectionsForCategory(category: string | null | undefined): InfoSection[] {
  if (!category) return GENERIC_SECTIONS;
  return SECTION_REGISTRY[category] ?? GENERIC_SECTIONS;
}

/**
 * Check if a category has bakery-style sections (ingredients, allergens, etc.)
 */
export function isBakeryCategory(category: string | null | undefined): boolean {
  return category === "bakers-bakery";
}

// ── Serialization helpers ──────────────────────────────────────────────────

/**
 * Serialize a ProductInfo object into a JSON string for DB storage.
 * Returns null if the object is empty (so we don't waste column space).
 */
export function serializeProductInfo(info: ProductInfo | null | undefined): string | null {
  if (!info) return null;
  // Remove empty/falsy values to keep the JSON compact
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(info)) {
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    cleaned[k] = v;
  }
  if (Object.keys(cleaned).length === 0) return null;
  return JSON.stringify(cleaned);
}

/**
 * Parse a stored JSON string back into a ProductInfo object.
 * Defensive: returns {} on any parse error (never throws).
 */
export function parseProductInfo(stored: string | null | undefined): ProductInfo {
  if (!stored) return {};
  try {
    const parsed = JSON.parse(stored);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Merge productInfo into an existing extraFields JSON object.
 * Preserves any non-productInfo keys already in extraFields.
 */
export function mergeIntoExtraFields(
  existingExtra: string | null | undefined,
  info: ProductInfo | null | undefined
): string | null {
  let extra: Record<string, unknown> = {};
  if (existingExtra) {
    try {
      const parsed = JSON.parse(existingExtra);
      if (typeof parsed === "object" && parsed !== null) extra = parsed;
    } catch { /* ignore corrupt JSON */ }
  }
  const infoStr = serializeProductInfo(info);
  if (infoStr) {
    extra.productInfo = JSON.parse(infoStr);
  } else {
    delete extra.productInfo;
  }
  return Object.keys(extra).length > 0 ? JSON.stringify(extra) : null;
}

/**
 * Extract productInfo from an extraFields JSON string.
 */
export function extractFromExtraFields(stored: string | null | undefined): ProductInfo {
  if (!stored) return {};
  try {
    const parsed = JSON.parse(stored);
    if (typeof parsed === "object" && parsed !== null && parsed.productInfo) {
      return parsed.productInfo as ProductInfo;
    }
  } catch { /* ignore */ }
  return {};
}
