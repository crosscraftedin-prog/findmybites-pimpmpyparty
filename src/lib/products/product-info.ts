/**
 * Product Information System — template-engine driven.
 * ─────────────────────────────────────────────────────────────────────────
 * Provides structured product information for product pages.
 *
 * Sections (bakery): Ingredients, Allergens, Nutrition, Packaging, Storage,
 * Shelf Life, Care Instructions, Product Highlights, Logistics, Occasion Tags.
 *
 * Storage: all productInfo is stored as a JSON string in the existing
 * `Product.extraFields` column — NO schema migration required.
 *
 * Template-driven: sections come from the template's `infoSections` field.
 * Falls back to legacy category lookup when no template is active.
 */

// ── ProductInfo data shape (stored in extraFields JSON) ────────────────────

export interface ProductInfo {
  // ── Ingredients ──
  ingredients?: string; // rich text (newline-separated)
  dietaryBadges?: string[];

  // ── Allergens ──
  allergens?: string[];
  customAllergens?: string; // comma-separated free-text
  facilityWarning?: string;

  // ── Nutrition (optional — hidden unless enabled) ──
  nutritionEnabled?: boolean;
  calories?: string;
  protein?: string;
  fat?: string;
  carbohydrates?: string;
  sugar?: string;
  servingSize?: string;

  // ── Packaging (simplified) ──
  packageType?: string;
  giftWrapping?: boolean;
  ecoFriendly?: boolean;
  customMessage?: string;
  packagingNotes?: string;

  // ── Storage ──
  storageType?: string; // Room Temperature | Refrigerate | Freeze
  storageInstructions?: string; // rich text
  servingSuggestion?: string;

  // ── Shelf Life (own section) ──
  shelfLife?: string;

  // ── Care Instructions (bakery) ──
  careInstructions?: string[];
  careInstructionsCustom?: string;

  // ── Product Highlights ──
  highlights?: string[];

  // ── Logistics ──
  deliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  sameDayDelivery?: boolean;
  deliveryRadius?: string;
  deliveryCharges?: string;
  minimumOrder?: string;

  // ── Customisation ──
  customisation?: string[];
  customisationNotes?: string;

  // ── Occasion Tags ──
  occasionTags?: string[];

  // ── Legacy fields (kept for backward compat, not shown in wizard) ──
  midnightDelivery?: boolean;
  expressDelivery?: boolean;
  estimatedDeliveryTime?: string;
  deliveryNotes?: string;
  packageContents?: string;
  packageWeight?: string;
  netWeight?: string;
  dimensions?: string;
  packageIncludes?: string;
  otherAllergens?: string;

  // ── Florist-specific ──
  flowerTypes?: string;
  careInstructionsFlorist?: string;
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

// ── Section / Field definitions ────────────────────────────────────────────

export type FieldType = "text" | "richtext" | "textarea" | "select" | "checkboxes" | "checkbox";

export interface InfoField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  optional?: boolean;
  showWhen?: { field: string; equals: unknown };
  /** Supports AI generation (shows a "Generate with AI" button). */
  aiGeneratable?: boolean;
}

export interface InfoSection {
  key: string;
  heading: string;
  icon: string;
  showWhen?: { field: string; truthy: boolean };
  fields: InfoField[];
}

// ── Reusable section builders ──────────────────────────────────────────────

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
    {
      key: "customAllergens",
      label: "Other",
      type: "text",
      placeholder: "e.g. Contains traces of peanuts",
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
      options: ["", "Same Day", "1 Day", "2 Days", "3 Days", "5 Days", "1 Week", "2 Weeks", "1 Month", "Other"],
    },
  ],
};

export const CARE_INSTRUCTIONS_SECTION: InfoSection = {
  key: "careInstructions",
  heading: "Care Instructions",
  icon: "💝",
  fields: [
    {
      key: "careInstructions",
      label: "Care Instructions",
      type: "checkboxes",
      options: [
        "Keep refrigerated",
        "Remove 30 minutes before serving",
        "Cut using warm knife",
        "Do not expose to sunlight",
        "Consume within 48 hours",
        "Handle fondant carefully",
        "Keep away from heat",
        "Store in airtight container",
        "Do not freeze",
        "Best served chilled",
      ],
    },
    {
      key: "careInstructionsCustom",
      label: "Additional Care Instructions (optional)",
      type: "text",
      placeholder: "Any other care tips",
      optional: true,
    },
  ],
};

export const PRODUCT_HIGHLIGHTS_SECTION: InfoSection = {
  key: "highlights",
  heading: "Product Highlights",
  icon: "✨",
  fields: [
    {
      key: "highlights",
      label: "Highlights",
      type: "checkboxes",
      options: [
        "Eggless", "Vegan", "Sugar Free", "Gluten Free", "No Preservatives",
        "Handmade", "Freshly Baked", "Organic", "Premium Ingredients",
        "Customizable", "Kids Favorite", "Bestseller", "New",
      ],
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
    { key: "deliveryRadius", label: "Delivery Radius", type: "text", placeholder: "Within 10 km" },
    { key: "deliveryCharges", label: "Delivery Charges", type: "text", placeholder: "Free above ₹999" },
    { key: "minimumOrder", label: "Minimum Order", type: "text", placeholder: "₹500" },
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
        "Can change colour",
        "Can change flavour",
        "Can add name",
        "Can add photo",
        "Can add topper",
        "Can change size",
        "Can change theme",
        "Can make eggless",
        "Can make sugar free",
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

// ── Category-specific section sets ─────────────────────────────────────────

const BAKERY_INFO_SECTIONS: InfoSection[] = [
  INGREDIENTS_SECTION,
  ALLERGENS_SECTION,
  NUTRITION_SECTION,
  PACKAGING_SECTION,
  STORAGE_SECTION,
  SHELF_LIFE_SECTION,
  CARE_INSTRUCTIONS_SECTION,
  PRODUCT_HIGHLIGHTS_SECTION,
];

const BAKERY_CUSTOMISATION_SECTIONS: InfoSection[] = [
  CUSTOMISATION_SECTION,
];

const FLORIST_SECTIONS: InfoSection[] = [
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
  PRODUCT_HIGHLIGHTS_SECTION,
  OCCASION_TAGS_SECTION,
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
  PACKAGING_SECTION,
  PRODUCT_HIGHLIGHTS_SECTION,
  OCCASION_TAGS_SECTION,
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
  PRODUCT_HIGHLIGHTS_SECTION,
  OCCASION_TAGS_SECTION,
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
  PRODUCT_HIGHLIGHTS_SECTION,
  OCCASION_TAGS_SECTION,
];

const GENERIC_SECTIONS: InfoSection[] = [
  PRODUCT_HIGHLIGHTS_SECTION,
  OCCASION_TAGS_SECTION,
];

// ── Legacy category lookup (backward compatibility) ────────────────────────

const LEGACY_SECTION_REGISTRY: Record<string, InfoSection[]> = {
  "bakers-bakery": BAKERY_INFO_SECTIONS,
  "florists": FLORIST_SECTIONS,
  "caterers": CATERING_SECTIONS,
  "decorators": DECORATOR_SECTIONS,
  "entertainers": ENTERTAINER_SECTIONS,
};

export function getLegacySectionsForCategory(category: string | null | undefined): InfoSection[] {
  if (!category) return GENERIC_SECTIONS;
  return LEGACY_SECTION_REGISTRY[category] ?? GENERIC_SECTIONS;
}

export function getSectionsForTemplate(
  template: { infoSections?: InfoSection[] } | null | undefined,
  category: string | null | undefined
): InfoSection[] {
  if (template?.infoSections && template.infoSections.length > 0) {
    return template.infoSections;
  }
  return getLegacySectionsForCategory(category);
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

// ── FAQ generation from ProductInfo ─────────────────────────────────────────

export interface GeneratedFAQ {
  question: string;
  answer: string;
}

export function generateFAQsFromProductInfo(
  info: ProductInfo,
  productName: string
): GeneratedFAQ[] {
  const faqs: GeneratedFAQ[] = [];

  // Ingredients
  if (info.ingredients?.trim()) {
    const dietary = info.dietaryBadges?.length
      ? ` This product is ${info.dietaryBadges.join(", ")}.`
      : "";
    faqs.push({
      question: `What are the ingredients in ${productName}?`,
      answer: `${info.ingredients.trim()}.${dietary}`,
    });
  }

  // Shelf Life
  if (info.shelfLife) {
    faqs.push({
      question: `What is the shelf life of ${productName}?`,
      answer: `The shelf life is ${info.shelfLife}.`,
    });
  }

  // Storage
  if (info.storageType || info.storageInstructions?.trim()) {
    const parts: string[] = [];
    if (info.storageType) parts.push(`Storage: ${info.storageType}`);
    if (info.storageInstructions?.trim()) parts.push(info.storageInstructions.trim());
    faqs.push({
      question: `How should I store ${productName}?`,
      answer: parts.join(". ") + ".",
    });
  }

  // Care Instructions
  if (info.careInstructions?.length) {
    faqs.push({
      question: `How do I care for ${productName}?`,
      answer: info.careInstructions.join(". ") + ".",
    });
  }

  // Packaging
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

  // Allergens
  const allergenText = getAllergenWarningText(info);
  if (allergenText) {
    faqs.push({
      question: `Does ${productName} contain any allergens?`,
      answer: `Yes, this product contains: ${allergenText}.${info.facilityWarning?.trim() ? ` ${info.facilityWarning.trim()}` : ""}`,
    });
  }

  // Nutrition
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

  // Logistics
  if (info.deliveryAvailable || info.pickupAvailable || info.deliveryRadius) {
    const parts: string[] = [];
    if (info.deliveryAvailable) parts.push("Delivery available");
    if (info.pickupAvailable) parts.push("pickup available");
    if (info.sameDayDelivery) parts.push("same-day delivery available");
    if (info.deliveryRadius) parts.push(`delivery radius: ${info.deliveryRadius}`);
    if (info.deliveryCharges) parts.push(`delivery charges: ${info.deliveryCharges}`);
    if (info.minimumOrder) parts.push(`minimum order: ${info.minimumOrder}`);
    faqs.push({
      question: `What are the delivery options for ${productName}?`,
      answer: parts.join(". ") + ".",
    });
  }

  // Customisation
  if (info.customisation?.length) {
    faqs.push({
      question: `Can I customise ${productName}?`,
      answer: `Yes, customisation options include: ${info.customisation.join(", ")}.${info.customisationNotes?.trim() ? ` ${info.customisationNotes.trim()}` : ""}`,
    });
  }

  // Highlights
  if (info.highlights?.length) {
    faqs.push({
      question: `What makes ${productName} special?`,
      answer: `This product is ${info.highlights.join(", ")}.`,
    });
  }

  // Occasion Tags
  if (info.occasionTags?.length) {
    faqs.push({
      question: `What occasions is ${productName} suitable for?`,
      answer: `This product is perfect for ${info.occasionTags.join(", ")}.`,
    });
  }

  // Florist-specific
  if (info.flowerTypes?.trim()) {
    faqs.push({ question: `What flowers are included?`, answer: info.flowerTypes.trim() });
  }

  // Catering-specific
  if (info.menuItems?.trim()) {
    faqs.push({ question: `What is included in the menu?`, answer: info.menuItems.trim() });
  }

  // Decorator-specific
  if (info.setupTime?.trim()) {
    faqs.push({ question: `How long does setup take?`, answer: `Setup takes ${info.setupTime}.` });
  }

  // Entertainer-specific
  if (info.performanceDuration?.trim()) {
    faqs.push({ question: `How long is the performance?`, answer: `The performance duration is ${info.performanceDuration}.` });
  }

  return faqs;
}
