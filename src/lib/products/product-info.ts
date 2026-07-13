/**
 * Product Information System V2 — Final Architecture (Template-Engine Driven).
 * ─────────────────────────────────────────────────────────────────────────
 * NO hardcoded category logic. Every section is defined by the Template Engine.
 *
 * This file provides:
 *   1. Composable section BUILDER constants (templates mix-and-match these).
 *   2. The ProductInfo data shape (stored in extraFields JSON).
 *   3. Serialization helpers.
 *   4. FAQ generation + allergen warning helpers.
 *
 * Templates in product-templates.ts define: infoSections, customisationSections, faqSections.
 * React components read from templates — no `if (category === "bakery")` anywhere.
 *
 * Backward compatibility: when a template doesn't define sections, we fall back
 * to a GENERIC set (just Highlights + Occasion Tags). Existing products with
 * old productInfo continue to work.
 */

// ── ProductInfo data shape (stored in extraFields JSON) ────────────────────

export interface ProductInfo {
  // ── Ingredients ──
  ingredients?: string;
  dietaryBadges?: string[];

  // ── Allergens ──
  allergens?: string[];
  customAllergens?: string;
  facilityWarning?: string;

  // ── Nutrition ──
  nutritionEnabled?: boolean;
  calories?: string;
  protein?: string;
  fat?: string;
  carbohydrates?: string;
  sugar?: string;
  servingSize?: string;

  // ── Packaging ──
  packageType?: string;
  packageImages?: string[]; // multiple package photo URLs
  giftWrapping?: boolean;
  ecoFriendly?: boolean;
  customMessage?: string;
  packagingNotes?: string;

  // ── Storage ──
  storageType?: string[];
  storageInstructions?: string;

  // ── Shelf Life ──
  shelfLife?: string;
  customShelfLifeValue?: string;
  customShelfLifeUnit?: string;

  // ── Serving & Care (renamed from Care Instructions) ──
  servingCare?: string[];
  servingCareCustom?: string;

  // ── Product Highlights ──
  highlights?: string[];
  customHighlights?: string[];

  // ── Logistics ──
  deliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  sameDayDelivery?: boolean;
  nextDayDelivery?: boolean;
  expressDelivery?: boolean;
  deliveryRadius?: string;
  deliveryCharges?: string;
  minimumOrder?: string;
  deliverySlots?: string[];
  deliveryNotes?: string;

  // ── Customisation ──
  customisation?: string[];
  customisationNotes?: string;

  // ── Occasion Tags ──
  occasionTags?: string[];

  // ── FAQs (stored, editable) ──
  faqs?: { question: string; answer: string }[];

  // ── Recipe Cost Calculator (vendor-only, never public) ──
  recipeCost?: {
    ingredients?: { name: string; quantity: string; unitCost: string; totalCost: string }[];
    packagingCost?: string;
    labourCost?: string;
    electricityCost?: string;
    deliveryCost?: string;
    totalProductionCost?: string;
    profitPercent?: string;
    suggestedSellingPrice?: string;
  };

  // ── Legacy fields (kept for backward compat, not shown in wizard) ──
  midnightDelivery?: boolean;
  estimatedDeliveryTime?: string;
  packageContents?: string;
  packageWeight?: string;
  netWeight?: string;
  dimensions?: string;
  packageIncludes?: string;
  otherAllergens?: string;
  careInstructions?: string[];
  careInstructionsCustom?: string;
  servingSuggestion?: string;

  // ── Category-specific (legacy) ──
  flowerTypes?: string;
  careInstructionsFlorist?: string;
  freshnessGuarantee?: string;
  menuItems?: string;
  servingSizeCatering?: string;
  dietaryOptions?: string;
  setupTime?: string;
  cleanupTime?: string;
  materialsIncluded?: string;
  performanceDuration?: string;
  languagesSpoken?: string;
  travelDistance?: string;
  equipmentRequired?: string;
}

// ── Section / Field definitions ────────────────────────────────────────────

export type FieldType =
  | "text"
  | "richtext"
  | "textarea"
  | "select"
  | "checkboxes"
  | "checkbox"
  | "images"
  | "table";

export interface InfoField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  optional?: boolean;
  showWhen?: { field: string; equals: unknown };
  aiGeneratable?: boolean;
  /** For "table" type — column definitions. */
  columns?: { key: string; label: string; type: "text" | "number" }[];
  /** Vendor-only fields are never displayed publicly. */
  vendorOnly?: boolean;
}

export interface InfoSection {
  key: string;
  heading: string;
  icon: string;
  showWhen?: { field: string; truthy: boolean };
  fields: InfoField[];
}

// ── Composable section builders (templates reference these) ────────────────
// These are the building blocks. Templates mix-and-match them.
// NO category logic here — just reusable section definitions.

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
      aiGeneratable: true,
    },
    {
      key: "dietaryBadges",
      label: "Dietary Features",
      type: "checkboxes",
      options: ["Eggless", "Contains Eggs", "Vegetarian", "Vegan", "Jain Friendly", "Gluten Free", "Sugar Free", "Organic", "No Artificial Colours", "No Artificial Flavours", "No Preservatives"],
    },
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
      options: ["Milk", "Egg", "Nuts", "Soy", "Gluten", "Sesame", "Mustard", "Fish", "Shellfish"],
    },
    { key: "customAllergens", label: "Other", type: "text", placeholder: "e.g. Contains traces of peanuts", optional: true },
    { key: "facilityWarning", label: "Facility Warning (optional)", type: "textarea", placeholder: "Manufactured in a facility that also processes Dairy, Eggs, Peanuts and Tree Nuts.", optional: true },
  ],
};

export const NUTRITION_SECTION: InfoSection = {
  key: "nutrition",
  heading: "Nutritional Information",
  icon: "🍃",
  showWhen: { field: "nutritionEnabled", truthy: true },
  fields: [
    { key: "nutritionEnabled", label: "Show Nutrition Facts", type: "checkbox" },
    { key: "calories", label: "Calories", type: "text", placeholder: "250 kcal", showWhen: { field: "nutritionEnabled", equals: true } },
    { key: "protein", label: "Protein", type: "text", placeholder: "4g", showWhen: { field: "nutritionEnabled", equals: true } },
    { key: "fat", label: "Fat", type: "text", placeholder: "12g", showWhen: { field: "nutritionEnabled", equals: true } },
    { key: "carbohydrates", label: "Carbohydrates", type: "text", placeholder: "35g", showWhen: { field: "nutritionEnabled", equals: true } },
    { key: "sugar", label: "Sugar", type: "text", placeholder: "20g", showWhen: { field: "nutritionEnabled", equals: true } },
    { key: "servingSize", label: "Serving Size", type: "text", placeholder: "1 slice (100g)", showWhen: { field: "nutritionEnabled", equals: true } },
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
      options: ["", "Cake Box", "Cupcake Box", "Gift Box", "Tray", "Bottle", "Jar", "Custom"],
    },
    {
      key: "packageImages",
      label: "Package Photos",
      type: "images",
      optional: true,
    },
    { key: "giftWrapping", label: "Gift Wrapping Available", type: "checkbox" },
    { key: "ecoFriendly", label: "Eco Friendly Packaging", type: "checkbox" },
    { key: "customMessage", label: "Custom Message (optional)", type: "textarea", placeholder: "Happy Birthday!", optional: true },
    { key: "packagingNotes", label: "Packaging Notes (optional)", type: "textarea", placeholder: "Packed securely in a food-grade premium box.", optional: true },
  ],
};

export const STORAGE_SECTION: InfoSection = {
  key: "storage",
  heading: "Storage",
  icon: "🧊",
  fields: [
    {
      key: "storageType",
      label: "Storage Type",
      type: "checkboxes",
      options: ["Room Temperature", "Refrigerate", "Freeze"],
    },
    {
      key: "storageInstructions",
      label: "Storage Instructions",
      type: "richtext",
      placeholder: "Store refrigerated. Bring to room temperature for 30 minutes before serving.",
    },
  ],
};

export const SHELF_LIFE_SECTION: InfoSection = {
  key: "shelfLife",
  heading: "Shelf Life",
  icon: "⏰",
  fields: [
    {
      key: "shelfLife",
      label: "Shelf Life",
      type: "select",
      options: ["", "Same Day", "1 Day", "2 Days", "3 Days", "5 Days", "1 Week", "2 Weeks", "1 Month", "Custom"],
    },
    {
      key: "customShelfLifeValue",
      label: "Custom Shelf Life",
      type: "text",
      placeholder: "e.g. 45",
      showWhen: { field: "shelfLife", equals: "Custom" },
    },
    {
      key: "customShelfLifeUnit",
      label: "Unit",
      type: "select",
      options: ["", "Days", "Weeks", "Months"],
      showWhen: { field: "shelfLife", equals: "Custom" },
    },
  ],
};

export const SERVING_CARE_SECTION: InfoSection = {
  key: "servingCare",
  heading: "Serving & Care",
  icon: "💝",
  fields: [
    {
      key: "servingCare",
      label: "Serving & Care Instructions",
      type: "checkboxes",
      options: [
        "Serve after 30 minutes",
        "Keep refrigerated",
        "Freeze if required",
        "Use warm knife",
        "Handle fondant carefully",
        "Store below 5°C",
        "Do not expose to sunlight",
        "Consume within 48 hours",
        "Best served chilled",
        "Bring to room temperature before serving",
      ],
    },
    {
      key: "servingCareCustom",
      label: "Custom Instructions (optional)",
      type: "text",
      placeholder: "Any other serving or care tips",
      optional: true,
    },
  ],
};

export const HIGHLIGHTS_SECTION: InfoSection = {
  key: "highlights",
  heading: "Product Highlights",
  icon: "✨",
  fields: [
    {
      key: "highlights",
      label: "Built-in Highlights",
      type: "checkboxes",
      options: [
        "Eggless", "Vegan", "Sugar Free", "Gluten Free", "No Preservatives",
        "Handmade", "Freshly Baked", "Organic", "Premium Ingredients",
        "Customizable", "Kids Favorite", "Bestseller", "New",
      ],
    },
    {
      key: "customHighlights",
      label: "Custom Highlights (press Enter to add)",
      type: "text",
      placeholder: "e.g. Award Winning, Chef's Favourite, 100% Belgian Chocolate",
      optional: true,
    },
  ],
};

export const LOGISTICS_SECTION: InfoSection = {
  key: "logistics",
  heading: "Logistics",
  icon: "🚚",
  fields: [
    { key: "deliveryAvailable", label: "Delivery Available", type: "checkbox" },
    { key: "pickupAvailable", label: "Pickup Available", type: "checkbox" },
    { key: "sameDayDelivery", label: "Same Day Delivery", type: "checkbox" },
    { key: "nextDayDelivery", label: "Next Day Delivery", type: "checkbox" },
    { key: "expressDelivery", label: "Express Delivery", type: "checkbox" },
    { key: "deliveryRadius", label: "Delivery Radius", type: "text", placeholder: "Within 10 km" },
    { key: "deliveryCharges", label: "Delivery Charges", type: "text", placeholder: "Free above ₹999" },
    { key: "minimumOrder", label: "Minimum Order", type: "text", placeholder: "₹500" },
    {
      key: "deliverySlots",
      label: "Delivery Slots",
      type: "checkboxes",
      options: ["Morning", "Afternoon", "Evening"],
    },
    { key: "deliveryNotes", label: "Delivery Notes (optional)", type: "textarea", placeholder: "Custom delivery instructions or policies.", optional: true },
  ],
};

export const CUSTOMISATION_SECTION: InfoSection = {
  key: "customisation",
  heading: "Customisation",
  icon: "🎨",
  fields: [
    {
      key: "customisation",
      label: "Customisation Options",
      type: "checkboxes",
      options: [
        "Can change colour", "Can change flavour", "Can add name", "Can add photo",
        "Can add topper", "Can change size", "Can change theme",
        "Can make eggless", "Can make sugar free",
      ],
    },
    {
      key: "customisationNotes",
      label: "Customisation Notes (optional)",
      type: "textarea",
      placeholder: "Describe any customisation options or restrictions.",
      optional: true,
    },
  ],
};

export const OCCASION_TAGS_SECTION: InfoSection = {
  key: "occasionTags",
  heading: "Occasion Tags",
  icon: "🎉",
  fields: [
    {
      key: "occasionTags",
      label: "Occasions",
      type: "checkboxes",
      options: [
        "Birthday", "Wedding", "Anniversary", "Baby Shower",
        "Corporate", "Graduation", "Christmas", "Easter",
        "Valentine", "Mother's Day", "Father's Day", "Diwali",
      ],
    },
  ],
};

export const RECIPE_COST_SECTION: InfoSection = {
  key: "recipeCost",
  heading: "Recipe Cost Calculator",
  icon: "🧮",
  fields: [
    {
      key: "recipeCost",
      label: "Cost Breakdown",
      type: "table",
      columns: [
        { key: "name", label: "Ingredient", type: "text" },
        { key: "quantity", label: "Quantity", type: "text" },
        { key: "unitCost", label: "Unit Cost", type: "number" },
        { key: "totalCost", label: "Total Cost", type: "number" },
      ],
    },
    { key: "recipeCost.packagingCost", label: "Packaging Cost", type: "text", placeholder: "₹50", vendorOnly: true },
    { key: "recipeCost.labourCost", label: "Labour Cost", type: "text", placeholder: "₹100", vendorOnly: true },
    { key: "recipeCost.electricityCost", label: "Electricity Cost", type: "text", placeholder: "₹20", vendorOnly: true },
    { key: "recipeCost.deliveryCost", label: "Delivery Cost", type: "text", placeholder: "₹40", vendorOnly: true },
    { key: "recipeCost.totalProductionCost", label: "Total Production Cost", type: "text", placeholder: "₹350", vendorOnly: true },
    { key: "recipeCost.profitPercent", label: "Profit %", type: "text", placeholder: "60%", vendorOnly: true },
    { key: "recipeCost.suggestedSellingPrice", label: "Suggested Selling Price", type: "text", placeholder: "₹875", vendorOnly: true },
  ],
};

// ── Default sections (used when a template doesn't define its own) ─────────

const DEFAULT_INFO_SECTIONS: InfoSection[] = [
  HIGHLIGHTS_SECTION,
  OCCASION_TAGS_SECTION,
];

const DEFAULT_CUSTOMISATION_SECTIONS: InfoSection[] = [
  CUSTOMISATION_SECTION,
];

const DEFAULT_FAQ_SECTIONS: InfoSection[] = [];

/**
 * Get sections from a template's `infoSections` field.
 * Falls back to DEFAULT_INFO_SECTIONS (Highlights + Occasion Tags) — NOT a
 * category lookup. This is the backward-compatibility path.
 */
export function getSectionsForTemplate(
  template: { infoSections?: InfoSection[] } | null | undefined
): InfoSection[] {
  if (template?.infoSections && template.infoSections.length > 0) {
    return template.infoSections;
  }
  return DEFAULT_INFO_SECTIONS;
}

/**
 * Get customisation sections from a template.
 */
export function getCustomisationSectionsForTemplate(
  template: { customisationSections?: InfoSection[] } | null | undefined
): InfoSection[] {
  if (template?.customisationSections && template.customisationSections.length > 0) {
    return template.customisationSections;
  }
  return DEFAULT_CUSTOMISATION_SECTIONS;
}

/**
 * Get FAQ sections from a template.
 */
export function getFaqSectionsForTemplate(
  template: { faqSections?: InfoSection[] } | null | undefined
): InfoSection[] {
  if (template?.faqSections && template.faqSections.length > 0) {
    return template.faqSections;
  }
  return DEFAULT_FAQ_SECTIONS;
}

// ── Legacy backward-compat (kept for existing products, not used by wizard) ─

export function getLegacySectionsForCategory(_category: string | null | undefined): InfoSection[] {
  // V2: no category lookup. Return defaults.
  return DEFAULT_INFO_SECTIONS;
}

// ── Serialization helpers ──────────────────────────────────────────────────

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

export function getAllergenWarningText(info: ProductInfo): string | null {
  const standard: string[] = info.allergens ?? [];
  const custom = info.customAllergens?.trim() || info.otherAllergens?.trim();
  if (standard.length === 0 && !custom) return null;
  const all = custom
    ? [...standard, ...custom.split(",").map((s) => s.trim()).filter(Boolean)]
    : standard;
  return all.join(", ");
}

// ── Highlights helper (combines built-in + custom) ──────────────────────────

export function getAllHighlights(info: ProductInfo): string[] {
  const builtIn: string[] = info.highlights ?? [];
  const custom: string[] = Array.isArray(info.customHighlights) ? info.customHighlights : [];
  return [...builtIn, ...custom.filter(Boolean)];
}

// ── Shelf life helper (handles custom) ──────────────────────────────────────

export function getShelfLifeText(info: ProductInfo): string | null {
  if (!info.shelfLife) return null;
  if (info.shelfLife === "Custom" && info.customShelfLifeValue) {
    return `${info.customShelfLifeValue} ${info.customShelfLifeUnit || "Days"}`;
  }
  return info.shelfLife;
}

// ── FAQ helpers ─────────────────────────────────────────────────────────────

export interface GeneratedFAQ {
  question: string;
  answer: string;
}

/**
 * Deterministically generate FAQs from ProductInfo (instant, no API call).
 * Used as the default; vendors can regenerate with AI for richer FAQs.
 */
export function generateFAQsFromProductInfo(
  info: ProductInfo,
  productName: string
): GeneratedFAQ[] {
  // If the vendor has saved FAQs, use those.
  if (info.faqs?.length) {
    return info.faqs;
  }

  const faqs: GeneratedFAQ[] = [];

  if (info.ingredients?.trim()) {
    const dietary = info.dietaryBadges?.length
      ? ` This product is ${info.dietaryBadges.join(", ")}.`
      : "";
    faqs.push({
      question: `What are the ingredients in ${productName}?`,
      answer: `${info.ingredients.trim()}.${dietary}`,
    });
  }

  const shelfLifeText = getShelfLifeText(info);
  if (shelfLifeText) {
    faqs.push({
      question: `What is the shelf life of ${productName}?`,
      answer: `The shelf life is ${shelfLifeText}.`,
    });
  }

  if (info.storageType?.length || info.storageInstructions?.trim()) {
    const parts: string[] = [];
    if (info.storageType?.length) parts.push(`Storage: ${info.storageType.join(", ")}`);
    if (info.storageInstructions?.trim()) parts.push(info.storageInstructions.trim());
    faqs.push({
      question: `How should I store ${productName}?`,
      answer: parts.join(". ") + ".",
    });
  }

  if (info.servingCare?.length) {
    faqs.push({
      question: `How do I serve and care for ${productName}?`,
      answer: info.servingCare.join(". ") + ".",
    });
  }

  if (info.packageType || info.packagingNotes?.trim()) {
    const parts: string[] = [];
    if (info.packageType) parts.push(`Packaged in a ${info.packageType}`);
    if (info.giftWrapping) parts.push("Gift wrapping available");
    if (info.ecoFriendly) parts.push("Eco-friendly packaging");
    if (info.packagingNotes?.trim()) parts.push(info.packagingNotes.trim());
    faqs.push({
      question: `What is included in the packaging?`,
      answer: parts.join(". ") + ".",
    });
  }

  const allergenText = getAllergenWarningText(info);
  if (allergenText) {
    faqs.push({
      question: `Does ${productName} contain any allergens?`,
      answer: `Yes, this product contains: ${allergenText}.${info.facilityWarning?.trim() ? ` ${info.facilityWarning.trim()}` : ""}`,
    });
  }

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

  if (info.deliveryAvailable || info.pickupAvailable || info.deliveryRadius) {
    const parts: string[] = [];
    if (info.deliveryAvailable) parts.push("Delivery available");
    if (info.pickupAvailable) parts.push("pickup available");
    if (info.sameDayDelivery) parts.push("same-day delivery");
    if (info.nextDayDelivery) parts.push("next-day delivery");
    if (info.expressDelivery) parts.push("express delivery");
    if (info.deliveryRadius) parts.push(`delivery radius: ${info.deliveryRadius}`);
    if (info.deliveryCharges) parts.push(`delivery charges: ${info.deliveryCharges}`);
    if (info.minimumOrder) parts.push(`minimum order: ${info.minimumOrder}`);
    if (info.deliverySlots?.length) parts.push(`slots: ${info.deliverySlots.join(", ")}`);
    faqs.push({
      question: `What are the delivery options for ${productName}?`,
      answer: parts.join(". ") + ".",
    });
  }

  if (info.customisation?.length) {
    faqs.push({
      question: `Can I customise ${productName}?`,
      answer: `Yes, customisation options include: ${info.customisation.join(", ")}.${info.customisationNotes?.trim() ? ` ${info.customisationNotes.trim()}` : ""}`,
    });
  }

  const allHighlights = getAllHighlights(info);
  if (allHighlights.length > 0) {
    faqs.push({
      question: `What makes ${productName} special?`,
      answer: `This product is ${allHighlights.join(", ")}.`,
    });
  }

  if (info.occasionTags?.length) {
    faqs.push({
      question: `What occasions is ${productName} suitable for?`,
      answer: `This product is perfect for ${info.occasionTags.join(", ")}.`,
    });
  }

  // Legacy category-specific
  if (info.flowerTypes?.trim()) {
    faqs.push({ question: `What flowers are included?`, answer: info.flowerTypes.trim() });
  }
  if (info.menuItems?.trim()) {
    faqs.push({ question: `What is included in the menu?`, answer: info.menuItems.trim() });
  }
  if (info.setupTime?.trim()) {
    faqs.push({ question: `How long does setup take?`, answer: `Setup takes ${info.setupTime}.` });
  }
  if (info.performanceDuration?.trim()) {
    faqs.push({ question: `How long is the performance?`, answer: `The performance duration is ${info.performanceDuration}.` });
  }

  return faqs;
}
