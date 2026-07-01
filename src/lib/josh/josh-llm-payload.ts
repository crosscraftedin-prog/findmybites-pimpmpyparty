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
 * The response object returned to the frontend (Step 11 structured JSON).
 * This makes every conversation reproducible — the frontend (and logs) can
 * see exactly what action was taken and what vendors were found.
 */
export interface JoshChatResponse {
  conversationId: string | null;
  message: string;            // the LLM's verbalized response
  action: ConversationAction; // the computed action
  state: ConversationState;   // the final state
  vendors: JoshVendor[];      // the vendors found by the backend
  products: JoshProduct[];    // the products found
  filters: JoshFilterSummary[];
  fallback?: boolean;
  usage?: any;
}
