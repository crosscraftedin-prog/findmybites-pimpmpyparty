/**
 * Josh LLM Payload Builder — V4
 *
 * Builds the structured JSON object the LLM receives. This is the ONLY
 * context the LLM gets. All business logic lives here, not in the prompt.
 *
 * The payload contains:
 *   - action            (the computed ConversationAction)
 *   - conversationState (the source-of-truth state)
 *   - vendors           (real vendors from the backend search)
 *   - products          (real products from the backend search)
 *   - filters           (active filter summary)
 *   - actionInstructions(per-action verbalization rules)
 */

import type { ConversationState } from "@/lib/conversation-state";
import {
  ConversationAction,
  getActionInstructions,
} from "@/lib/josh/conversation-action";
import type { JoshVendor, JoshProduct, JoshFilterSummary } from "@/lib/josh/josh-search";

export interface JoshLLMPayload {
  action: ConversationAction;
  conversationState: ConversationState;
  vendors: JoshVendor[];
  products: JoshProduct[];
  filters: JoshFilterSummary[];
  actionInstructions: string;
}

/**
 * Render a single vendor as a compact line for the LLM.
 */
function renderVendor(v: JoshVendor): string {
  const parts = [
    `${v.name} (slug: ${v.slug})`,
    `category: ${v.category}${v.subcategory ? ` / ${v.subcategory}` : ""}`,
    `location: ${v.city}, ${v.country}`,
    `rating: ${v.rating}/5 (${v.reviewCount} reviews)`,
    `price: from ${v.currency}${v.basePrice}`,
    `tagline: "${v.tagline}"`,
    `${v.featured ? "Featured " : ""}${v.verified ? "Verified" : ""}`.trim(),
  ];
  if (v.tags.length > 0) parts.push(`tags: ${v.tags.join(", ")}`);
  if (v.deliveryAvailable) parts.push("delivery: yes");
  if (v.pickupAvailable) parts.push("pickup: yes");
  return "- " + parts.join(" | ");
}

/**
 * Render a single product as a compact line for the LLM.
 * Includes Product Information (ingredients, allergens, storage, etc.) so
 * Josh AI can answer detailed customer questions about the product.
 */
function renderProduct(p: JoshProduct): string {
  const parts = [
    `${p.name}`,
    `vendor: ${p.vendorName}`,
    `price: ${p.currency}${p.price}`,
  ];
  if (p.productType) parts.push(`type: ${p.productType}`);
  if (p.eggless) parts.push("eggless: yes");
  if (p.featured) parts.push("featured: yes");
  if (p.description) parts.push(`desc: "${p.description.slice(0, 100)}"`);

  // ── Product Information System V2 ──
  // Give Josh AI access to ALL structured product details so it can answer
  // questions like "Does this contain eggs?", "Can I freeze this?",
  // "Do you deliver today?", "Can I customise the flavour?", etc.
  if (p.productInfo) {
    const info = p.productInfo;

    // Ingredients
    if (info.ingredients) parts.push(`ingredients: ${info.ingredients.slice(0, 200)}`);
    if (info.dietaryBadges?.length) parts.push(`dietary: ${info.dietaryBadges.join(", ")}`);

    // Allergens
    if (info.allergens?.length) parts.push(`allergens: ${info.allergens.join(", ")}`);
    if (info.customAllergens) parts.push(`other allergens: ${info.customAllergens}`);
    if (info.facilityWarning) parts.push(`facility warning: ${info.facilityWarning.slice(0, 100)}`);

    // Nutrition
    if (info.nutritionEnabled) {
      const nutrition = [];
      if (info.calories) nutrition.push(`${info.calories} cal`);
      if (info.protein) nutrition.push(`${info.protein} protein`);
      if (info.fat) nutrition.push(`${info.fat} fat`);
      if (info.carbohydrates) nutrition.push(`${info.carbohydrates} carbs`);
      if (info.sugar) nutrition.push(`${info.sugar} sugar`);
      if (info.servingSize) nutrition.push(`per ${info.servingSize}`);
      if (nutrition.length) parts.push(`nutrition: ${nutrition.join(", ")}`);
    }

    // Packaging
    if (info.packageType) parts.push(`packaging: ${info.packageType}`);
    if (info.giftWrapping) parts.push("gift wrapping: yes");
    if (info.ecoFriendly) parts.push("eco friendly: yes");
    if (info.packagingNotes) parts.push(`packaging notes: ${info.packagingNotes.slice(0, 100)}`);

    // Storage
    if (info.storageType?.length) parts.push(`storage type: ${info.storageType.join(", ")}`);
    if (info.storageInstructions) parts.push(`storage instructions: ${info.storageInstructions.slice(0, 150)}`);

    // Shelf Life (with custom support)
    if (info.shelfLife) {
      const shelfLifeText = info.shelfLife === "Custom" && info.customShelfLifeValue
        ? `${info.customShelfLifeValue} ${info.customShelfLifeUnit || "Days"}`
        : info.shelfLife;
      parts.push(`shelf life: ${shelfLifeText}`);
    }

    // Serving & Care
    if (info.servingCare?.length) parts.push(`serving & care: ${info.servingCare.join(", ")}`);
    if (info.servingCareCustom) parts.push(`care notes: ${info.servingCareCustom}`);
    // Legacy care instructions
    if (info.careInstructions?.length) parts.push(`care: ${info.careInstructions.join(", ")}`);

    // Highlights (built-in + custom)
    const allHighlights = [
      ...(info.highlights ?? []),
      ...(Array.isArray(info.customHighlights) ? info.customHighlights : []),
    ];
    if (allHighlights.length > 0) parts.push(`highlights: ${allHighlights.join(", ")}`);

    // Logistics
    if (info.deliveryAvailable) parts.push("delivery: yes");
    if (info.pickupAvailable) parts.push("pickup: yes");
    if (info.sameDayDelivery) parts.push("same day delivery: yes");
    if (info.nextDayDelivery) parts.push("next day delivery: yes");
    if (info.expressDelivery) parts.push("express delivery: yes");
    if (info.deliveryRadius) parts.push(`delivery radius: ${info.deliveryRadius}`);
    if (info.deliveryCharges) parts.push(`delivery charges: ${info.deliveryCharges}`);
    if (info.minimumOrder) parts.push(`minimum order: ${info.minimumOrder}`);
    if (info.deliverySlots?.length) parts.push(`delivery slots: ${info.deliverySlots.join(", ")}`);
    if (info.deliveryNotes) parts.push(`delivery notes: ${info.deliveryNotes.slice(0, 100)}`);

    // Customisation
    if (info.customisation?.length) parts.push(`customisation: ${info.customisation.join(", ")}`);
    if (info.customisationNotes) parts.push(`customisation notes: ${info.customisationNotes.slice(0, 100)}`);

    // Occasion Tags
    if (info.occasionTags?.length) parts.push(`occasions: ${info.occasionTags.join(", ")}`);

    // Stored FAQs
    if (info.faqs?.length) {
      const faqText = info.faqs.map((f) => `Q: ${f.question} A: ${f.answer}`).join(" | ");
      parts.push(`FAQs: ${faqText.slice(0, 300)}`);
    }

    // Category-specific fields
    if (info.flowerTypes) parts.push(`flowers: ${info.flowerTypes.slice(0, 100)}`);
    if (info.careInstructionsFlorist) parts.push(`flower care: ${info.careInstructionsFlorist.slice(0, 100)}`);
    if (info.menuItems) parts.push(`menu: ${info.menuItems.slice(0, 150)}`);
    if (info.setupTime) parts.push(`setup time: ${info.setupTime}`);
    if (info.performanceDuration) parts.push(`performance: ${info.performanceDuration}`);
    if (info.languagesSpoken) parts.push(`languages: ${info.languagesSpoken}`);
  }

  return "- " + parts.join(" | ");
}

/**
 * Render the ConversationState as a compact summary for the LLM.
 * Only includes fields that have values.
 */
function renderState(state: ConversationState): string {
  const lines: string[] = [];
  if (state.conversationMode !== "CUSTOMER") lines.push(`mode: ${state.conversationMode}`);
  if (state.eventType) lines.push(`event: ${state.eventType}`);
  if (state.category) lines.push(`category: ${state.category}`);
  if (state.subcategory) lines.push(`subcategory: ${state.subcategory}`);
  if (state.city) lines.push(`city: ${state.city}`);
  if (state.budget) lines.push(`budget: ${state.budget}`);
  if (state.guestCount) lines.push(`guests: ${state.guestCount}`);
  if (state.eventDate) lines.push(`date: ${state.eventDate}`);
  if (state.dietaryRequirements?.length) lines.push(`dietary: ${state.dietaryRequirements.join(", ")}`);
  if (state.deliveryRequired) lines.push("delivery: required");
  if (state.pickupRequired) lines.push("pickup: required");
  if (state.sortBy) lines.push(`sort: ${state.sortBy}`);
  if (state.onlyVerified) lines.push("verified-only: yes");
  if (state.onlyFeatured) lines.push("featured-only: yes");
  lines.push(`messageCount: ${state.messageCount}`);
  return lines.length > 0 ? lines.join("\n") : "(empty — first message)";
}

/**
 * Build the structured payload string that gets appended to the system prompt.
 * This is the ONLY dynamic context the LLM receives.
 */
export function buildLLMPayloadSection(payload: JoshLLMPayload): string {
  const { action, conversationState, vendors, products, filters, actionInstructions } = payload;

  const sections: string[] = [
    "",
    "═══════════════════════════════════════════════════════════════",
    "# BACKEND PAYLOAD (the only context you receive — execute it)",
    "═══════════════════════════════════════════════════════════════",
    "",
    `## ACTION: ${action}`,
    "",
    "## CONVERSATION STATE (source of truth — never re-ask any value here)",
    renderState(conversationState),
    "",
    "## VENDORS (use ONLY these — never invent)",
    vendors.length > 0
      ? vendors.map(renderVendor).join("\n")
      : "(empty — no vendors available. Do NOT invent any.)",
    "",
    "## PRODUCTS (use ONLY these — never invent)",
    products.length > 0
      ? products.map(renderProduct).join("\n")
      : "(empty — no products available)",
    "",
    "## ACTIVE FILTERS",
    filters.length > 0
      ? filters.map((f) => `- ${f.key}: ${f.value}`).join("\n")
      : "(none)",
    "",
    "## ACTION INSTRUCTIONS (execute exactly)",
    actionInstructions,
    "",
    "═══════════════════════════════════════════════════════════════",
  ];

  return sections.join("\n");
}

/**
 * Build the full payload object (for logging + for building the prompt section).
 */
export function buildLLMPayload(params: {
  action: ConversationAction;
  state: ConversationState;
  vendors: JoshVendor[];
  products: JoshProduct[];
  filters: JoshFilterSummary[];
}): JoshLLMPayload {
  const { action, state, vendors, products, filters } = params;
  return {
    action,
    conversationState: state,
    vendors,
    products,
    filters,
    actionInstructions: getActionInstructions(action, state),
  };
}

/**
 * A ready-to-render vendor card. The backend computes `matchReason` so the
 * frontend never has to parse AI text or re-fetch vendors.
 */
export interface JoshVendorCard {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string | null;
  city: string;
  country: string;
  countryCode: string;
  tagline: string;
  description: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  basePrice: number;
  currency: string;
  featured: boolean;
  verified: boolean;
  tags: string[];
  ecosystem: string;
  whatsapp: string | null;
  heroImage: string;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  responseTime: string;
  matchReason: string;   // backend-computed reason this vendor fits the state
}

/**
 * A next-step suggestion chip the frontend can render as a clickable button.
 */
export interface JoshSuggestion {
  label: string;   // button text, e.g. "Browse all bakers in Dubai"
  href?: string;   // optional link
  action?: string; // optional action hint for the frontend
}

/**
 * Build ready-to-render vendor cards from the backend search results.
 * The matchReason is computed deterministically from the ConversationState
 * (category, city, dietary, budget) — never by the LLM.
 */
export function buildVendorCards(
  vendors: JoshVendor[],
  state: ConversationState
): JoshVendorCard[] {
  return vendors.slice(0, 5).map((v) => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    category: v.category,
    subcategory: v.subcategory,
    city: v.city,
    country: v.country,
    countryCode: v.countryCode,
    tagline: v.tagline,
    description: v.description,
    rating: v.rating,
    reviewCount: v.reviewCount,
    priceRange: v.priceRange,
    basePrice: v.basePrice,
    currency: v.currency,
    featured: v.featured,
    verified: v.verified,
    tags: v.tags,
    ecosystem: v.ecosystem,
    whatsapp: v.whatsapp,
    heroImage: v.heroImage,
    deliveryAvailable: v.deliveryAvailable,
    pickupAvailable: v.pickupAvailable,
    responseTime: v.responseTime,
    matchReason: computeMatchReason(v, state),
  }));
}

/**
 * Deterministically compute why a vendor matches the current state.
 * Used by the frontend to display a "Why" line under each card.
 */
function computeMatchReason(v: JoshVendor, state: ConversationState): string {
  const parts: string[] = [];
  const catLabel = v.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  if (state.eventType) {
    parts.push(`${state.eventType} ${catLabel.toLowerCase()}`);
  } else {
    parts.push(`Top ${catLabel.toLowerCase()}`);
  }
  if (state.city && v.city.toLowerCase().includes(state.city.toLowerCase())) {
    parts.push(`in ${v.city}`);
  }
  if (state.dietaryRequirements?.length) {
    parts.push(`${state.dietaryRequirements.join(", ")} options`);
  }
  if (state.budget && v.basePrice <= state.budget) {
    parts.push(`within budget`);
  }
  if (v.featured) parts.push("featured");
  if (v.verified && v.reviewCount > 20) parts.push("highly rated");
  return parts.join(" · ");
}

/**
 * Build next-step suggestion chips for the frontend to render.
 * Deterministic — based on the action + state.
 */
export function buildSuggestions(
  action: ConversationAction,
  state: ConversationState
): JoshSuggestion[] {
  const suggestions: JoshSuggestion[] = [];
  const catLabel = state.category
    ? state.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  switch (action) {
    case ConversationAction.SEARCH_VENDORS:
    case ConversationAction.REFINE_RESULTS:
      if (state.category && state.city) {
        suggestions.push({
          label: `Browse all ${catLabel} in ${state.city}`,
          href: `/search?category=${state.category}&city=${encodeURIComponent(state.city)}`,
        });
      }
      if (!state.budget) {
        suggestions.push({ label: "Set a budget", action: "set_budget" });
      }
      if (!state.eventDate) {
        suggestions.push({ label: "Add event date", action: "set_date" });
      }
      break;
    case ConversationAction.NO_RESULTS:
      suggestions.push({
        label: `Browse all ${catLabel}`,
        href: state.category ? `/search?category=${state.category}` : "/search",
      });
      suggestions.push({ label: "Try a nearby city", action: "change_city" });
      break;
    case ConversationAction.ASK_CITY:
      // Quick city chips
      suggestions.push({ label: "Dubai", action: "city:Dubai" });
      suggestions.push({ label: "Mumbai", action: "city:Mumbai" });
      suggestions.push({ label: "London", action: "city:London" });
      break;
    case ConversationAction.STATE_NEED:
      suggestions.push({ label: "Wedding cake", action: "need:wedding cake" });
      suggestions.push({ label: "DJ", action: "need:DJ" });
      suggestions.push({ label: "Photographer", action: "need:photographer" });
      break;
    default:
      break;
  }
  return suggestions;
}

/**
 * The response object returned to the frontend (Step 4 structured JSON).
 * This makes every conversation reproducible — the frontend (and logs) can
 * see exactly what action was taken, what vendors were found, and whether
 * the LLM was involved.
 *
 * The frontend renders UI from `cards`, `vendors`, `suggestions`, and
 * `action` — it NEVER parses JSON from the `message` text.
 */
export interface JoshChatResponse {
  conversationId: string | null;
  message: string;                  // natural-language message (deterministic or LLM)
  action: ConversationAction;       // the computed action
  conversationState: ConversationState; // the final state
  vendors: JoshVendor[];            // raw vendor objects from backend search
  cards: JoshVendorCard[];          // ready-to-render vendor cards (with matchReason)
  products: JoshProduct[];          // products from matched vendors
  filters: JoshFilterSummary[];     // active filters
  suggestions: JoshSuggestion[];    // next-step suggestion chips
  requiresLLM: boolean;             // whether the LLM was invoked for this response
  fallback?: boolean;               // true if the LLM was tried but failed
  usage?: any;                      // LLM token usage (only if requiresLLM)
}
