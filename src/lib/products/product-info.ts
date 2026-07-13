/**
 * Product Information System — template-engine driven.
 * ─────────────────────────────────────────────────────────────────────────
 * Provides structured product information (Ingredients, Packaging, Storage,
 * Allergens, Nutrition, Highlights, etc.) for product pages.
 *
 * Storage: all productInfo is stored as a JSON string in the existing
 * `Product.extraFields` column — NO schema migration required.
 *
 * Template-driven: sections are NOT hardcoded by category. Every template
 * in the Template Engine defines its own `infoSections` array. The wizard
 * and display components read from the template, not from a category lookup.
 *
 * Backward compatibility: existing products with the old category-based
 * productInfo continue to work — the display component falls back to
 * `getLegacySectionsForCategory()` when no template is active.
 */

// ── ProductInfo data shape (stored in extraFields JSON) ────────────────────

export interface ProductInfo {
  // ── Ingredients ──
  ingredients?: string; // rich text (newline-separated)
  dietaryBadges?: string[];

  // ── Packaging ──
  packageType?: string;
  netWeight?: string;
  dimensions?: string;
  packageIncludes?: string;
  giftWrapping?: boolean;
  ecoFriendly?: boolean;
  customMessage?: string;
  packagingNotes?: string;

  // ── Storage ──
  shelfLife?: string;
  storageType?: string;
  storageInstructions?: string; // rich text (newline-separated)
  servingSuggestion?: string;

  // ── Allergens ──
  allergens?: string[];
  customAllergens?: string; // comma-separated free-text allergens
  facilityWarning?: string;

  // ── Nutrition (optional — hidden unless enabled) ──
  nutritionEnabled?: boolean;
  calories?: string;
  protein?: string;
  fat?: string;
  carbohydrates?: string;
  sugar?: string;
  servingSize?: string;

  // ── Product Highlights ──
  highlights?: string[];

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

  // ── Legacy Delivery fields (kept for backward compat, not shown in wizard) ──
  sameDayDelivery?: boolean;
  midnightDelivery?: boolean;
  expressDelivery?: boolean;
  deliveryRadius?: string;
  estimatedDeliveryTime?: string;
  deliveryNotes?: string;

  // ── Legacy packaging fields (kept for backward compat) ──
  packageContents?: string;
  packageWeight?: string;
}

// ── Section / Field definitions (template-driven) ──────────────────────────

export type FieldType = "text" | "richtext" | "textarea" | "select" | "checkboxes" | "checkbox";

export interface InfoField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  optional?: boolean;
  /** Show this field only when another field has a truthy value. */
  showWhen?: { field: string; equals: unknown };
}

export interface InfoSection {
  key: string;
  heading: string;
  icon: string; // emoji
  /** Show this section only when this condition is met. */
  showWhen?: { field: string; truthy: boolean };
  fields: InfoField[];
}

// ── Reusable section builders ──────────────────────────────────────────────
// These are composable building blocks templates can mix-and-match.
// Templates don't HAVE to use these — they can define fully custom sections.

export const INGREDIENTS_SECTION: InfoSection = {
  key: "ingredients",
  heading: "Ingredients",
  icon: "🥣",
  fields: [
    {
      key: "ingredients",
      label: "Ingredients",
      type: "richtext",
      placeholder: "Refined Wheat Flour, Butter, Cocoa Powder, Dark Chocolate, Fresh Cream, Sugar, Baking Powder…",
    },
    {
      key: "dietaryBadges",
      label: "Dietary Features",
      type: "checkboxes",
      options: ["Eggless", "Contains Eggs", "Vegetarian", "Vegan", "Jain Friendly", "Gluten Free", "Sugar Free", "Organic", "No Artificial Colours", "No Artificial Flavours", "No Preservatives"],
    },
  ],
};

export const PACKAGING_SECTION: InfoSection = {
  key: "packaging",
  heading: "Packaging",
  icon: "📦",
  fields: [
    {
      key: "packageType",
      label: "Package Type",
      type: "select",
      options: ["", "Cake Box", "Gift Box", "Window Box", "Jar", "Bottle", "Cup", "Tray", "Eco Friendly", "Custom"],
    },
    { key: "netWeight", label: "Net Weight", type: "text", placeholder: "500g" },
    { key: "dimensions", label: "Dimensions", type: "text", placeholder: "20 × 20 × 15 cm" },
    { key: "packageIncludes", label: "Package Includes", type: "text", placeholder: "1 Cake, 6 Cupcakes" },
    { key: "giftWrapping", label: "Gift Wrapping Available", type: "checkbox" },
    { key: "ecoFriendly", label: "Eco Friendly Packaging", type: "checkbox" },
    { key: "customMessage", label: "Custom Message (optional)", type: "text", placeholder: "Happy Birthday!" , optional: true },
    { key: "packagingNotes", label: "Packaging Notes (optional)", type: "textarea", placeholder: "Packed securely in a food-grade premium box.", optional: true },
  ],
};

export const STORAGE_SECTION: InfoSection = {
  key: "storage",
  heading: "Storage Instructions",
  icon: "🧊",
  fields: [
    {
      key: "shelfLife",
      label: "Shelf Life",
      type: "select",
      options: ["", "1 Day", "2 Days", "3 Days", "5 Days", "7 Days", "15 Days", "30 Days"],
    },
    {
      key: "storageType",
      label: "Storage Type",
      type: "select",
      options: ["", "Room Temperature", "Refrigerate", "Freeze"],
    },
    {
      key: "storageInstructions",
      label: "Storage Instructions",
      type: "richtext",
      placeholder: "Store refrigerated. Bring to room temperature for 30 minutes before serving.",
    },
    { key: "servingSuggestion", label: "Serving Suggestion", type: "text", placeholder: "Serve chilled." },
  ],
};

export const ALLERGENS_SECTION: InfoSection = {
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
    {
      key: "customAllergens",
      label: "Custom Allergens",
      type: "text",
      placeholder: "e.g. Corn, Yeast, Cashew (comma-separated)",
      optional: true,
    },
    {
      key: "facilityWarning",
      label: "Facility Warning (optional)",
      type: "textarea",
      placeholder: "Manufactured in a facility that also processes Dairy, Eggs, Peanuts and Tree Nuts.",
      optional: true,
    },
  ],
};

export const NUTRITION_SECTION: InfoSection = {
  key: "nutrition",
  heading: "Nutritional Information",
  icon: "🍃",
  showWhen: { field: "nutritionEnabled", truthy: true },
  fields: [
    { key: "nutritionEnabled", label: "Enable Nutrition Information", type: "checkbox" },
    { key: "calories", label: "Calories", type: "text", placeholder: "250 kcal", showWhen: { field: "nutritionEnabled", equals: true } },
    { key: "protein", label: "Protein", type: "text", placeholder: "4g", showWhen: { field: "nutritionEnabled", equals: true } },
    { key: "fat", label: "Fat", type: "text", placeholder: "12g", showWhen: { field: "nutritionEnabled", equals: true } },
    { key: "carbohydrates", label: "Carbohydrates", type: "text", placeholder: "35g", showWhen: { field: "nutritionEnabled", equals: true } },
    { key: "sugar", label: "Sugar", type: "text", placeholder: "20g", showWhen: { field: "nutritionEnabled", equals: true } },
    { key: "servingSize", label: "Serving Size", type: "text", placeholder: "1 slice (100g)", showWhen: { field: "nutritionEnabled", equals: true } },
  ],
};

export const HIGHLIGHTS_SECTION_BAKERY: InfoSection = {
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
};

// ── Template-driven section registry ───────────────────────────────────────
//
// Templates define their own `infoSections` array. But for convenience, we
// provide pre-built section SETS per category that templates can reference
// or override. This keeps backward compatibility with the old approach.

const BAKERY_SECTIONS: InfoSection[] = [
  INGREDIENTS_SECTION,
  PACKAGING_SECTION,
  STORAGE_SECTION,
  ALLERGENS_SECTION,
  NUTRITION_SECTION,
  HIGHLIGHTS_SECTION_BAKERY,
];

const FLORIST_SECTIONS: InfoSection[] = [
  {
    key: "flowers",
    heading: "Flower Information",
    icon: "🌸",
    fields: [
      { key: "flowerTypes", label: "Flower Types", type: "richtext", placeholder: "Roses, Lilies, Carnations, Baby Breath…" },
      { key: "careInstructions", label: "Care Instructions", type: "richtext", placeholder: "Change water daily. Keep away from direct sunlight." },
      { key: "freshnessGuarantee", label: "Freshness Guarantee", type: "text", placeholder: "Fresh for 5-7 days with proper care" },
    ],
  },
  {
    key: "packaging",
    heading: "Packaging",
    icon: "📦",
    fields: [
      { key: "packageType", label: "Package Type", type: "select", options: ["", "Gift Box", "Window Box", "Bouquet Wrap", "Vase", "Basket", "Custom"] },
      { key: "netWeight", label: "Size", type: "text", placeholder: "12 stems" },
      { key: "dimensions", label: "Dimensions", type: "text", placeholder: "Bouquet: 40 cm tall" },
      { key: "packageIncludes", label: "Package Includes", type: "text", placeholder: "1 Bouquet, Vase (optional)" },
      { key: "giftWrapping", label: "Gift Wrapping Available", type: "checkbox" },
      { key: "ecoFriendly", label: "Eco Friendly Packaging", type: "checkbox" },
      { key: "customMessage", label: "Custom Message (optional)", type: "text", placeholder: "Happy Anniversary!", optional: true },
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

const CATERING_SECTIONS: InfoSection[] = [
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
  {
    key: "packaging",
    heading: "Packaging",
    icon: "📦",
    fields: [
      { key: "packageType", label: "Package Type", type: "select", options: ["", "Buffet Setup", "Individual Boxes", "Chafing Dishes", "Trays", "Custom"] },
      { key: "packageIncludes", label: "Package Includes", type: "text", placeholder: "Main course + 2 sides + dessert" },
      { key: "ecoFriendly", label: "Eco Friendly Packaging", type: "checkbox" },
      { key: "packagingNotes", label: "Packaging Notes (optional)", type: "textarea", placeholder: "Food-grade containers with disposable serving spoons.", optional: true },
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

const DECORATOR_SECTIONS: InfoSection[] = [
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

const ENTERTAINER_SECTIONS: InfoSection[] = [
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

const GENERIC_SECTIONS: InfoSection[] = [
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

// ── Legacy category → sections lookup (backward compatibility) ──────────────
// Used when a template doesn't define its own infoSections.

const LEGACY_SECTION_REGISTRY: Record<string, InfoSection[]> = {
  "bakers-bakery": BAKERY_SECTIONS,
  "florists": FLORIST_SECTIONS,
  "caterers": CATERING_SECTIONS,
  "decorators": DECORATOR_SECTIONS,
  "entertainers": ENTERTAINER_SECTIONS,
};

/**
 * Get sections for a category — legacy fallback when no template is active.
 * Delivery is intentionally NOT included (single source of truth elsewhere).
 */
export function getLegacySectionsForCategory(category: string | null | undefined): InfoSection[] {
  if (!category) return GENERIC_SECTIONS;
  return LEGACY_SECTION_REGISTRY[category] ?? GENERIC_SECTIONS;
}

/**
 * Get sections from a template's `infoSections` field.
 * Falls back to legacy category lookup if the template doesn't define sections.
 */
export function getSectionsForTemplate(
  template: { infoSections?: InfoSection[] } | null | undefined,
  category: string | null | undefined
): InfoSection[] {
  if (template?.infoSections && template.infoSections.length > 0) {
    return template.infoSections;
  }
  return getLegacySectionsForCategory(category);
}

// ── Serialization helpers (unchanged) ──────────────────────────────────────

export function serializeProductInfo(info: ProductInfo | null | undefined): string | null {
  if (!info) return null;
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(info)) {
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    cleaned[k] = v;
  }
  if (Object.keys(cleaned).length === 0) return null;
  return JSON.stringify(cleaned);
}

export function parseProductInfo(stored: string | null | undefined): ProductInfo {
  if (!stored) return {};
  try {
    const parsed = JSON.parse(stored);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

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

// ── Allergen warning text helper ────────────────────────────────────────────

/**
 * Build the human-readable allergen warning text.
 * Combines standard allergens + custom allergens.
 */
export function getAllergenWarningText(info: ProductInfo): string | null {
  const standard: string[] = info.allergens ?? [];
  const custom = info.customAllergens?.trim();
  if (standard.length === 0 && !custom) return null;
  const all = custom
    ? [...standard, ...custom.split(",").map((s) => s.trim()).filter(Boolean)]
    : standard;
  return all.join(", ");
}

// ── FAQ generation from ProductInfo ─────────────────────────────────────────

export interface GeneratedFAQ {
  question: string;
  answer: string;
}

/**
 * Generate SEO-friendly FAQs from product information.
 * Only generates FAQs for sections that have data.
 * Used on the product page for SEO structured data.
 */
export function generateFAQsFromProductInfo(
  info: ProductInfo,
  productName: string
): GeneratedFAQ[] {
  const faqs: GeneratedFAQ[] = [];

  // Ingredients FAQ
  if (info.ingredients?.trim()) {
    const dietary = info.dietaryBadges?.length
      ? ` This product is ${info.dietaryBadges.join(", ")}.`
      : "";
    faqs.push({
      question: `What are the ingredients in ${productName}?`,
      answer: `${info.ingredients.trim()}.${dietary}`,
    });
  }

  // Storage FAQ
  if (info.shelfLife || info.storageType || info.storageInstructions?.trim()) {
    const parts: string[] = [];
    if (info.shelfLife) parts.push(`Shelf life: ${info.shelfLife}`);
    if (info.storageType) parts.push(`Storage: ${info.storageType}`);
    if (info.storageInstructions?.trim()) parts.push(info.storageInstructions.trim());
    faqs.push({
      question: `How should I store ${productName}?`,
      answer: parts.join(". ") + ".",
    });
  }

  // Packaging FAQ
  if (info.packageType || info.netWeight || info.packageIncludes) {
    const parts: string[] = [];
    if (info.packageType) parts.push(`Packaged in a ${info.packageType}`);
    if (info.netWeight) parts.push(`Net weight: ${info.netWeight}`);
    if (info.packageIncludes) parts.push(`Includes: ${info.packageIncludes}`);
    if (info.giftWrapping) parts.push("Gift wrapping available");
    if (info.ecoFriendly) parts.push("Eco-friendly packaging");
    faqs.push({
      question: `What is included in the packaging?`,
      answer: parts.join(". ") + ".",
    });
  }

  // Allergen FAQ
  const allergenText = getAllergenWarningText(info);
  if (allergenText) {
    faqs.push({
      question: `Does ${productName} contain any allergens?`,
      answer: `Yes, this product contains: ${allergenText}.${info.facilityWarning?.trim() ? ` ${info.facilityWarning.trim()}` : ""}`,
    });
  }

  // Nutrition FAQ
  if (info.nutritionEnabled && info.calories) {
    const parts: string[] = [];
    if (info.servingSize) parts.push(`Per ${info.servingSize}:`);
    parts.push(`${info.calories} calories`);
    if (info.protein) parts.push(`${info.protein} protein`);
    if (info.fat) parts.push(`${info.fat} fat`);
    if (info.carbohydrates) parts.push(`${info.carbohydrates} carbs`);
    if (info.sugar) parts.push(`${info.sugar} sugar`);
    faqs.push({
      question: `What is the nutritional information for ${productName}?`,
      answer: parts.join(", ") + ".",
    });
  }

  // Highlights FAQ
  if (info.highlights?.length) {
    faqs.push({
      question: `What makes ${productName} special?`,
      answer: `This product is ${info.highlights.join(", ")}.`,
    });
  }

  // Florist-specific
  if (info.flowerTypes?.trim()) {
    faqs.push({
      question: `What flowers are included?`,
      answer: info.flowerTypes.trim(),
    });
  }
  if (info.careInstructions?.trim()) {
    faqs.push({
      question: `How do I care for the flowers?`,
      answer: info.careInstructions.trim(),
    });
  }

  // Catering-specific
  if (info.menuItems?.trim()) {
    faqs.push({
      question: `What is included in the menu?`,
      answer: info.menuItems.trim(),
    });
  }

  // Decorator-specific
  if (info.setupTime?.trim() || info.cleanupTime?.trim()) {
    const parts: string[] = [];
    if (info.setupTime) parts.push(`Setup takes ${info.setupTime}`);
    if (info.cleanupTime) parts.push(`cleanup takes ${info.cleanupTime}`);
    faqs.push({
      question: `How long does setup take?`,
      answer: parts.join(" and ") + ".",
    });
  }

  // Entertainer-specific
  if (info.performanceDuration?.trim()) {
    faqs.push({
      question: `How long is the performance?`,
      answer: `The performance duration is ${info.performanceDuration}.`,
    });
  }
  if (info.languagesSpoken?.trim()) {
    faqs.push({
      question: `What languages does the performer speak?`,
      answer: info.languagesSpoken.trim(),
    });
  }

  return faqs;
}
