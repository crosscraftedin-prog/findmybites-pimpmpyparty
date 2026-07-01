/**
 * ConversationAction — V4 Backend-Controlled Conversation Engine
 *
 * The backend is the single source of truth. The LLM NEVER decides:
 *   - what question to ask
 *   - whether to recommend vendors
 *   - whether to continue the conversation
 *   - what state the conversation is in
 *
 * The backend computes one deterministic ConversationAction per message.
 * The LLM only converts the action (+ structured context) into natural language.
 */

import type { ConversationState } from "@/lib/conversation-state";

export enum ConversationAction {
  /** No category and no city yet — ask the user what they need (greeting allowed only on msg #1). */
  STATE_NEED = "STATE_NEED",
  /** Category known, city missing — ask ONLY for the city. */
  ASK_CITY = "ASK_CITY",
  /** City known, category missing — ask ONLY for the category. */
  ASK_CATEGORY = "ASK_CATEGORY",
  /** Category + city both known, vendors available — recommend the top vendors. */
  SEARCH_VENDORS = "SEARCH_VENDORS",
  /** Category + city already known, user added an optional filter (budget/dietary/date/guests/sort) — re-recommend filtered. */
  REFINE_RESULTS = "REFINE_RESULTS",
  /** Category + city both known but zero matching vendors — say so honestly, offer alternatives. */
  NO_RESULTS = "NO_RESULTS",
  /** Vendor dashboard user — answer their listing/dashboard question. */
  VENDOR_MODE = "VENDOR_MODE",
  /** Admin user — answer their marketplace insights question. */
  ADMIN_MODE = "ADMIN_MODE",
  /** Customer browsing a specific vendor storefront — answer about that vendor. */
  STOREFRONT_MODE = "STOREFRONT_MODE",
  /** Non-marketplace message that doesn't map to a vendor flow (used as a last resort). */
  GENERAL_CHAT = "GENERAL_CHAT",
}

/**
 * The set of actions that are FULLY DETERMINISTIC and must NOT call the LLM.
 * The backend generates the response + structured cards directly in TypeScript.
 *
 * Marketplace conversations work correctly even if the LLM is offline.
 */
export const DETERMINISTIC_ACTIONS: ReadonlySet<ConversationAction> = new Set([
  ConversationAction.STATE_NEED,
  ConversationAction.ASK_CITY,
  ConversationAction.ASK_CATEGORY,
  ConversationAction.SEARCH_VENDORS,
  ConversationAction.REFINE_RESULTS,
  ConversationAction.NO_RESULTS,
]);

/**
 * Returns true if the given action requires the LLM (i.e. it is NOT in the
 * deterministic set). The LLM is only invoked for:
 *   - GENERAL_CHAT
 *   - VENDOR_MODE (vendor coaching, listing audits, SEO, product descriptions)
 *   - ADMIN_MODE (admin insights)
 *   - STOREFRONT_MODE (explaining specific vendor offerings)
 */
export function requiresLLM(action: ConversationAction): boolean {
  return !DETERMINISTIC_ACTIONS.has(action);
}

/**
 * Determine whether the current message just added an optional filter.
 * "Optional filters" = budget, dietary, eventDate, guestCount, delivery,
 * pickup, onlyVerified, onlyFeatured, onlyAvailable, sortBy.
 * We detect this by inspecting the partial extraction returned by
 * extractFromMessage() — if it contains any optional field AND the
 * pre-existing state already had both required slots, this is a refinement.
 */
export function didFiltersJustChange(
  extracted: Partial<ConversationState>,
  stateBeforeMerge: ConversationState
): boolean {
  const hadRequiredSlots =
    !!stateBeforeMerge.category && !!stateBeforeMerge.city;

  if (!hadRequiredSlots) return false;

  return (
    extracted.budget !== undefined ||
    (extracted.dietaryRequirements !== undefined &&
      (extracted.dietaryRequirements?.length ?? 0) > 0) ||
    extracted.eventDate !== undefined ||
    extracted.guestCount !== undefined ||
    extracted.deliveryRequired === true ||
    extracted.pickupRequired === true ||
    extracted.onlyVerified === true ||
    extracted.onlyFeatured === true ||
    extracted.onlyAvailable === true ||
    extracted.sortBy !== undefined
  );
}

/**
 * computeConversationAction — the deterministic heart of the V4 engine.
 *
 * Inputs:
 *   - state: the merged ConversationState (after this message was merged in)
 *   - vendorCount: number of real vendors the backend search returned
 *   - filtersJustChanged: whether the current message added an optional filter
 *   - isFirstMessage: whether this is message #1 (greeting allowed)
 *
 * The LLM is NEVER allowed to infer the action. This function is the only
 * place the action is decided.
 */
export function computeConversationAction(params: {
  state: ConversationState;
  vendorCount: number;
  filtersJustChanged: boolean;
}): ConversationAction {
  const { state, vendorCount, filtersJustChanged } = params;
  const hasCategory = !!state.category;
  const hasCity = !!state.city;
  const mode = state.conversationMode;

  // ── Non-customer modes take priority ──
  if (mode === "VENDOR") return ConversationAction.VENDOR_MODE;
  if (mode === "ADMIN") return ConversationAction.ADMIN_MODE;
  if (mode === "STOREFRONT") return ConversationAction.STOREFRONT_MODE;

  // ── Customer mode: deterministic slot-driven flow ──

  // 1. Both required slots filled → either refine or search
  if (hasCategory && hasCity) {
    if (filtersJustChanged) {
      // User just added an optional filter to an already-complete state.
      // (Note: vendorCount may be 0 here if the DB is down — we still call it
      // REFINE_RESULTS because the user's intent is to narrow, not to start
      // over. The LLM will honestly report whether any vendors matched.)
      return ConversationAction.REFINE_RESULTS;
    }
    // Fresh "both slots filled" — recommend (or report no results)
    return vendorCount > 0
      ? ConversationAction.SEARCH_VENDORS
      : ConversationAction.NO_RESULTS;
  }

  // 2. Category known, city missing → ask ONLY for city
  if (hasCategory && !hasCity) {
    return ConversationAction.ASK_CITY;
  }

  // 3. City known, category missing → ask ONLY for category
  if (!hasCategory && hasCity) {
    return ConversationAction.ASK_CATEGORY;
  }

  // 4. Neither slot known
  return ConversationAction.STATE_NEED;
}

/**
 * Per-action verbalization instructions sent to the LLM.
 * These tell the LLM exactly how to phrase the response for each action.
 * The LLM must NOT deviate from these.
 */
export function getActionInstructions(
  action: ConversationAction,
  state: ConversationState
): string {
  switch (action) {
    case ConversationAction.STATE_NEED:
      return [
        "ACTION: STATE_NEED",
        "This is the start of the conversation (or the user hasn't given a category or city yet).",
        state.messageCount > 1
          ? "- Do NOT greet. The conversation already started."
          : "- You may greet ONCE (one short line), then ask what they're planning.",
        '- Ask naturally what type of vendor they need (cake, DJ, photographer, decorator, etc.).',
        '- Example: "What are you planning — a wedding, birthday, or something else? Tell me what you need and I\'ll find the best vendors."',
        "- Do NOT ask for the city yet (we don't have a category).",
      ].join("\n");

    case ConversationAction.ASK_CITY:
      return [
        "ACTION: ASK_CITY",
        `The user wants "${state.category}"${state.eventType ? ` for a ${state.eventType.toLowerCase()}` : ""}. The ONLY missing required slot is the city.`,
        `- Ask ONLY for the city. One natural question.`,
        state.eventType
          ? `- Example: "Which city is your ${state.eventType.toLowerCase()} in?"`
          : `- Example: "Which city are you in?"`,
        "- Do NOT ask what they need (category is already known).",
        "- Do NOT greet. Do NOT restart. Do NOT mention budget/date/guests.",
      ].join("\n");

    case ConversationAction.ASK_CATEGORY:
      return [
        "ACTION: ASK_CATEGORY",
        `The user is in "${state.city}". The ONLY missing required slot is the category.`,
        "- Ask ONLY what type of vendor/service they need.",
        `- Example: "What type of service are you looking for in ${state.city}?"`,
        "- Do NOT ask for the city. Do NOT greet. Do NOT restart.",
      ].join("\n");

    case ConversationAction.SEARCH_VENDORS:
      return [
        "ACTION: SEARCH_VENDORS",
        `Both required slots are filled (category="${state.category}", city="${state.city}"). Real vendors are available in the VENDORS list.`,
        "- Recommend the top 2-3 vendors from the VENDORS list IMMEDIATELY.",
        "- Explain WHY each vendor fits (category match, city, dietary, budget, rating).",
        "- Output a vendor_suggestions JSON line first:",
        `  {"type":"vendor_suggestions","categories":["${state.category}"],"city":"${state.city}","summary":"friendly recap"}`,
        "- Then 2-3 vendor cards: name, rating, city, price, 1-line reason.",
        "- Use ONLY vendor names from the VENDORS list. NEVER invent vendors.",
        "- Do NOT ask any questions. Do NOT greet. Do NOT restart.",
      ].join("\n");

    case ConversationAction.REFINE_RESULTS:
      return [
        "ACTION: REFINE_RESULTS",
        `Both required slots were already filled (category="${state.category}", city="${state.city}"). The user just added an optional filter.`,
        "- Acknowledge the new filter in ONE short sentence.",
        "- Re-recommend vendors from the VENDORS list, filtered by the new criteria.",
        "- If the VENDORS list is empty (no matches after filtering), say so honestly and offer to broaden the search.",
        "- Use ONLY vendor names from the VENDORS list. NEVER invent vendors.",
        "- Do NOT ask any questions. Do NOT greet. Do NOT restart the conversation.",
      ].join("\n");

    case ConversationAction.NO_RESULTS:
      return [
        "ACTION: NO_RESULTS",
        `Both required slots are filled (category="${state.category}", city="${state.city}"), but the backend search returned ZERO matching vendors.`,
        '- Say honestly: "I couldn\'t find vendors matching those filters."',
        "- Offer alternatives: try a nearby city, a broader category, or remove a filter.",
        "- Do NOT invent, fabricate, or hallucinate vendor names, ratings, or prices.",
        "- Do NOT output a vendor_suggestions JSON block.",
        "- Do NOT greet. Do NOT restart.",
      ].join("\n");

    case ConversationAction.VENDOR_MODE:
      return [
        "ACTION: VENDOR_MODE",
        "The user is a vendor using their dashboard. Answer their question about their listing, products, analytics, SEO, or pricing.",
        "- Use the VENDOR PROFILE context if provided.",
        "- Be specific and actionable. Do NOT run customer slot-filling.",
      ].join("\n");

    case ConversationAction.ADMIN_MODE:
      return [
        "ACTION: ADMIN_MODE",
        "The user is an admin. Answer their marketplace insights question.",
        "- Be data-driven and concise. Do NOT run customer slot-filling.",
      ].join("\n");

    case ConversationAction.STOREFRONT_MODE:
      return [
        "ACTION: STOREFRONT_MODE",
        `The customer is viewing a specific vendor storefront. Answer their question about THIS vendor's products, pricing, availability, or policies.`,
        "- Use the STOREFRONT context (vendor + products) if provided.",
        "- Do NOT recommend competing vendors.",
      ].join("\n");

    case ConversationAction.GENERAL_CHAT:
    default:
      return [
        "ACTION: GENERAL_CHAT",
        "The message does not map to a marketplace flow. Respond briefly and steer toward marketplace help (finding vendors, products, or planning).",
        "- Keep it to 1-2 sentences. Do NOT greet if the conversation already started.",
      ].join("\n");
  }
}
