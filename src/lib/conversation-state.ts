/**
 * ConversationState — Structured intent state for Josh AI
 *
 * This is the deterministic source of truth for marketplace logic.
 * It's updated after every message (extract → merge) and never reparsed
 * from full conversation history.
 *
 * The LLM receives both the conversation history (for natural language
 * context) AND the ConversationState (for deterministic facts).
 */

export interface ConversationState {
  // ── Event context ──
  eventType: string | null;          // "Wedding", "Birthday", "Corporate", etc.
  category: string | null;           // "bakers-bakery", "djs", etc.
  subcategory: string | null;        // "Wedding Cakes", "Open-Format", etc.

  // ── Location ──
  city: string | null;
  state: string | null;
  country: string | null;

  // ── Requirements ──
  budget: number | null;             // in local currency
  guestCount: number | null;
  eventDate: string | null;          // ISO date string
  dietaryRequirements: string[];     // ["Eggless", "Vegan", "Gluten-Free"]
  deliveryRequired: boolean | null;
  pickupRequired: boolean | null;

  // ── Vendor/Product tracking ──
  vendorIdsDiscussed: string[];      // vendor IDs mentioned in conversation
  productIdsDiscussed: string[];     // product IDs mentioned
  selectedVendor: string | null;     // currently selected vendor ID
  selectedProduct: string | null;    // currently selected product ID

  // ── Preferences ──
  preferredLanguage: string | null;  // "English", "Hindi", "Arabic"
  sortBy: string | null;             // "rating", "price-asc", "price-desc", "reviews", "newest"

  // ── Mode ──
  conversationMode: "CUSTOMER" | "VENDOR" | "ADMIN" | "STOREFRONT";

  // ── Storefront context (when browsing a specific vendor) ──
  storefrontVendorId: string | null;

  // ── Vendor dashboard context ──
  vendorDashboardSection: string | null; // "products", "analytics", "listing", etc.

  // ── Admin context ──
  adminReportType: string | null;       // "insights", "leads", "vendors"

  // ── Search refinement ──
  filterOverrides: Record<string, string[]>; // e.g. {"Dietary Options": ["Eggless"]}
  // Global Attribute System — slugs extracted from natural language
  // e.g. "sugar free cake" → ["sugar-free"], "keto vegan cookies" → ["keto","vegan"]
  attributeSlugs: string[];
  onlyVerified: boolean;
  onlyFeatured: boolean;
  onlyAvailable: boolean;

  // ── Metadata ──
  lastUpdated: string | null;         // ISO timestamp
  messageCount: number;               // total messages in conversation
}

export const DEFAULT_STATE: ConversationState = {
  eventType: null,
  category: null,
  subcategory: null,
  city: null,
  state: null,
  country: null,
  budget: null,
  guestCount: null,
  eventDate: null,
  dietaryRequirements: [],
  deliveryRequired: null,
  pickupRequired: null,
  vendorIdsDiscussed: [],
  productIdsDiscussed: [],
  selectedVendor: null,
  selectedProduct: null,
  preferredLanguage: null,
  sortBy: null,
  conversationMode: "CUSTOMER",
  storefrontVendorId: null,
  vendorDashboardSection: null,
  adminReportType: null,
  filterOverrides: {},
  attributeSlugs: [],
  onlyVerified: false,
  onlyFeatured: false,
  onlyAvailable: false,
  lastUpdated: null,
  messageCount: 0,
};

// ── Category keywords for intent extraction ──
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "bakers-bakery": ["cake", "baker", "bakery", "cupcake", "dessert", "chocolate", "pastry", "wedding cake", "birthday cake", "brownie", "cookie", "bread", "truffle"],
  caterers: ["catering", "caterer", "buffet", "meal", "dinner", "lunch"],
  "chef-staff": ["chef", "private chef", "bartender", "waiter", "staff", "mixologist"],
  "food-trucks": ["food truck", "street food", "truck"],
  "beverage-specialists": ["coffee", "tea", "mocktail", "juice", "smoothie", "bubble tea"],
  "specialty-food": ["halal", "vegan", "gluten", "organic", "keto", "sugar-free"],
  "event-planners": ["planner", "planning", "coordination", "organise"],
  decorators: ["decor", "decoration", "balloon", "floral", "theme", "stage"],
  photographers: ["photo", "photographer", "photography"],
  videographers: ["video", "videographer", "film", "cinema"],
  djs: ["dj", "music", "band", "sound"],
  entertainers: ["entertainment", "magician", "clown", "mascot", "performer"],
  venues: ["venue", "hall", "place", "location", "space", "rooftop", "garden"],
  florists: ["florist", "flowers", "bouquet"],
  "rental-services": ["rental", "rent", "furniture", "tent", "tableware"],
  "makeup-artists": ["makeup", "make up", "beauty"],
  "beauty-services": ["hair", "mehndi", "henna", "spa", "nail"],
  transportation: ["transport", "limo", "limousine", "party bus", "car"],
  "invitation-printing": ["invitation", "invite", "card", "printing", "banner"],
  "kids-party-services": ["kids", "children", "bouncy", "bounce house", "face paint"],
  "audio-visual-services": ["sound system", "lighting", "led", "av", "audio visual"],
  "party-supplies": ["party supplies", "balloons", "confetti", "party props", "tableware"],
};

const KNOWN_CITIES = [
  "dubai", "abu dhabi", "london", "mumbai", "delhi", "hyderabad", "bangalore",
  "bengaluru", "riyadh", "jeddah", "lagos", "nairobi", "cape town", "johannesburg",
  "tokyo", "singapore", "sydney", "melbourne", "new york", "toronto", "paris",
  "berlin", "amsterdam", "pune", "chennai", "goa", "kolkata",
];

const EVENT_KEYWORDS: Record<string, string[]> = {
  "Wedding": ["wedding", "bride", "groom", "engagement", "nikah", "shaadi"],
  "Birthday": ["birthday", "bday"],
  "Corporate": ["corporate", "conference", "seminar", "office", "company"],
  "Baby Shower": ["baby shower", "baby"],
  "Anniversary": ["anniversary"],
  "Engagement": ["engagement", "ring ceremony"],
  "Graduation": ["graduation"],
  "Housewarming": ["housewarming", "house warming"],
};

const DIETARY_KEYWORDS: Record<string, string[]> = {
  "Eggless": ["eggless", "egg free"],
  "Vegan": ["vegan"],
  "Vegetarian": ["vegetarian", "veg "],
  "Gluten-Free": ["gluten free", "gluten-free"],
  "Nut-Free": ["nut free", "nut-free"],
  "Dairy-Free": ["dairy free", "dairy-free"],
  "Halal": ["halal"],
  "Kosher": ["kosher"],
};

/**
 * Global Attribute System — keyword → slug mapping for NL extraction.
 * This powers Josh AI's ability to understand "sugar free birthday cake"
 * → attribute=sugar-free + category=bakers-bakery + occasion=birthday.
 *
 * Keys are natural-language phrases the user might type; values are the
 * canonical attribute slugs from the seed data.
 */
const ATTRIBUTE_KEYWORDS: Record<string, string> = {
  // Dietary
  "sugar free": "sugar-free",
  "sugarless": "sugar-free",
  "no sugar": "sugar-free",
  "gluten free": "gluten-free",
  "gluten-free": "gluten-free",
  "keto": "keto",
  "ketogenic": "keto",
  "low carb": "low-carb",
  "vegan": "vegan",
  "eggless": "eggless",
  "egg less": "eggless",
  "egg free": "eggless",
  "dairy free": "dairy-free",
  "dairy-free": "dairy-free",
  "lactose free": "dairy-free",
  "nut free": "nut-free",
  "nut-free": "nut-free",
  "organic": "organic",
  "halal": "halal",
  "jain": "jain-friendly",
  "jain friendly": "jain-friendly",
  "diabetic": "diabetic-friendly",
  "diabetic friendly": "diabetic-friendly",
  "diabetes friendly": "diabetic-friendly",
  "high protein": "high-protein",
  "no preservatives": "no-preservatives",
  "preservative free": "no-preservatives",
  "no artificial colors": "no-artificial-colors",
  "no artificial colours": "no-artificial-colors",
  // Service
  "same day delivery": "same-day-delivery",
  "same day": "same-day-delivery",
  "midnight delivery": "midnight-delivery",
  "midnight": "midnight-delivery",
  "pickup": "pickup-available",
  "pick up": "pickup-available",
  "home delivery": "home-delivery",
  "custom order": "custom-orders",
  "customized": "custom-orders",
  "bespoke": "custom-orders",
  "corporate": "corporate-orders",
  "bulk order": "bulk-orders",
  "bulk": "bulk-orders",
  "gift wrap": "gift-wrapping",
  "gift wrapping": "gift-wrapping",
  // Product features
  "bestseller": "bestseller",
  "best seller": "bestseller",
  "premium": "premium",
  "handmade": "handmade",
  "hand made": "handmade",
  "fresh daily": "fresh-daily",
  "chef recommended": "chef-recommended",
  "seasonal": "seasonal",
  "limited edition": "limited-edition",
  // Business
  "gst registered": "gst-registered",
  "gst": "gst-registered",
  "fssai": "fssai-certified",
  "fssai certified": "fssai-certified",
  "home baker": "home-baker",
  "home bakery": "home-baker",
  "commercial kitchen": "commercial-kitchen",
  "women owned": "women-owned",
  "woman owned": "women-owned",
  "family business": "family-business",
  // Party attributes
  "outdoor": "outdoor-events",
  "luxury": "luxury-events",
  "destination wedding": "destination-wedding",
  "budget friendly": "budget-friendly",
  "affordable": "budget-friendly",
  "corporate event": "corporate-events",
  "kids friendly": "kids-friendly",
  "kid friendly": "kids-friendly",
  "indoor venue": "indoor-venue",
  "live music": "live-music",
  "photography included": "photography-included",
};

const SORT_KEYWORDS: Record<string, string[]> = {
  "rating": ["best rated", "top rated", "highest rated", "best reviews"],
  "price-asc": ["cheaper", "cheapest", "lowest price", "most affordable", "budget"],
  "price-desc": ["most expensive", "premium", "luxury"],
  "reviews": ["most reviewed", "most reviews"],
  "newest": ["newest", "latest", "new "],
};

/**
 * Extract new intent information from a single message.
 * Only returns fields that are DETECTED — does not include fields that are null.
 * This is merged into the existing ConversationState.
 */
export function extractFromMessage(message: string): Partial<ConversationState> {
  const lower = message.toLowerCase();
  const updates: Partial<ConversationState> = {};

  // Category
  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      updates.category = catId;
      break;
    }
  }

  // City
  for (const c of KNOWN_CITIES) {
    if (lower.includes(c)) {
      updates.city = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  // Event type
  for (const [eventType, keywords] of Object.entries(EVENT_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      updates.eventType = eventType;
      break;
    }
  }

  // Budget
  const budgetMatch = message.match(/(?:budget|under|₹|\$|£|€)\s*(\d[\d,]*)/i);
  if (budgetMatch) {
    updates.budget = parseInt(budgetMatch[1].replace(/,/g, ""), 10);
  }

  // Guest count
  const guestMatch = message.match(/(\d+)\s*(?:guest|people|person|attendee)/i);
  if (guestMatch) {
    updates.guestCount = parseInt(guestMatch[1], 10);
  }

  // Event date
  const dateMatch = message.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/);
  if (dateMatch) {
    updates.eventDate = dateMatch[0];
  }

  // Dietary (legacy — maps to human-readable labels)
  const dietary: string[] = [];
  for (const [label, keywords] of Object.entries(DIETARY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      dietary.push(label);
    }
  }
  if (dietary.length > 0) {
    updates.dietaryRequirements = dietary;
  }

  // Global Attribute System — extract attribute slugs from natural language.
  // This powers ?attribute=sugar-free,keto filtering in the search API.
  // Sort keywords by length (longest first) so "sugar free" matches before "free".
  const attrSlugs = new Set<string>();
  const sortedKeys = Object.keys(ATTRIBUTE_KEYWORDS).sort((a, b) => b.length - a.length);
  for (const keyword of sortedKeys) {
    if (lower.includes(keyword)) {
      attrSlugs.add(ATTRIBUTE_KEYWORDS[keyword]);
    }
  }
  if (attrSlugs.size > 0) {
    updates.attributeSlugs = Array.from(attrSlugs);
  }

  // Delivery / Pickup
  if (lower.includes("delivery") || lower.includes("deliver")) {
    updates.deliveryRequired = true;
  }
  if (lower.includes("pickup") || lower.includes("pick up") || lower.includes("self pick")) {
    updates.pickupRequired = true;
  }

  // Sort preferences
  for (const [sortKey, keywords] of Object.entries(SORT_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      updates.sortBy = sortKey;
      break;
    }
  }

  // Verified / Featured / Available filters
  if (lower.includes("verified") || lower.includes("trusted")) {
    updates.onlyVerified = true;
  }
  if (lower.includes("featured") || lower.includes("elite") || lower.includes("premium vendor")) {
    updates.onlyFeatured = true;
  }
  if (lower.includes("available") || lower.includes("in stock")) {
    updates.onlyAvailable = true;
  }

  return updates;
}

/**
 * Merge extracted updates into existing state.
 * Only overwrites fields that are present in the updates object.
 * Array fields (dietaryRequirements, vendorIdsDiscussed) are merged, not replaced.
 */
export function mergeState(
  current: ConversationState,
  updates: Partial<ConversationState>
): ConversationState {
  const merged: ConversationState = { ...current };

  // Simple field updates (only overwrite if the update has a value)
  const simpleFields: (keyof ConversationState)[] = [
    "eventType", "category", "subcategory", "city", "state", "country",
    "budget", "guestCount", "eventDate", "preferredLanguage", "sortBy",
    "selectedVendor", "selectedProduct", "storefrontVendorId",
    "vendorDashboardSection", "adminReportType", "conversationMode",
  ];

  for (const field of simpleFields) {
    if (updates[field] !== undefined && updates[field] !== null) {
      (merged as any)[field] = updates[field];
    }
  }

  // Boolean fields (only set to true if explicitly requested)
  if (updates.deliveryRequired === true) merged.deliveryRequired = true;
  if (updates.pickupRequired === true) merged.pickupRequired = true;
  if (updates.onlyVerified === true) merged.onlyVerified = true;
  if (updates.onlyFeatured === true) merged.onlyFeatured = true;
  if (updates.onlyAvailable === true) merged.onlyAvailable = true;

  // Array fields — merge (add new items, don't remove existing)
  if (updates.dietaryRequirements) {
    merged.dietaryRequirements = [...new Set([...(merged.dietaryRequirements || []), ...updates.dietaryRequirements])];
  }
  if (updates.vendorIdsDiscussed) {
    merged.vendorIdsDiscussed = [...new Set([...(merged.vendorIdsDiscussed || []), ...updates.vendorIdsDiscussed])];
  }
  if (updates.productIdsDiscussed) {
    merged.productIdsDiscussed = [...new Set([...(merged.productIdsDiscussed || []), ...updates.productIdsDiscussed])];
  }

  // Global Attribute System — merge attribute slugs (dedupe)
  if (updates.attributeSlugs) {
    merged.attributeSlugs = [...new Set([...(merged.attributeSlugs || []), ...updates.attributeSlugs])];
  }

  // Filter overrides — merge by key
  if (updates.filterOverrides) {
    merged.filterOverrides = { ...(merged.filterOverrides || {}), ...updates.filterOverrides };
  }

  merged.lastUpdated = new Date().toISOString();
  merged.messageCount = (merged.messageCount || 0) + 1;

  return merged;
}

/**
 * Check which required slots are still missing.
 * Returns an array of missing slot names.
 */
export function getMissingSlots(state: ConversationState): string[] {
  const missing: string[] = [];
  if (!state.category) missing.push("category");
  if (!state.city) missing.push("city");
  // Budget and eventDate are optional — don't force them
  return missing;
}

/**
 * Generate a natural language question for the next missing slot.
 */
export function getNextSlotQuestion(missingSlots: string[]): string | null {
  if (missingSlots.length === 0) return null;

  const slot = missingSlots[0]; // Ask one at a time
  switch (slot) {
    case "category":
      return "What type of vendor do you need? For example: cake, catering, DJ, photographer, decorator 🎉";
    case "city":
      return "Which city are you in? 🎉";
    case "budget":
      return "What's your budget? 🎉";
    case "eventDate":
      return "When is your event? 🎉";
    case "guestCount":
      return "How many guests? 🎉";
    default:
      return null;
  }
}

/**
 * Build a search query from ConversationState.
 * This is used to query the marketplace DB directly.
 */
export function buildSearchQuery(state: ConversationState): {
  category: string | null;
  city: string | null;
  budget: number | null;
  dietary: string[];
  deliveryRequired: boolean;
  pickupRequired: boolean;
  onlyVerified: boolean;
  onlyFeatured: boolean;
  onlyAvailable: boolean;
  sortBy: string | null;
} {
  return {
    category: state.category,
    city: state.city,
    budget: state.budget,
    dietary: state.dietaryRequirements || [],
    deliveryRequired: state.deliveryRequired === true,
    pickupRequired: state.pickupRequired === true,
    onlyVerified: state.onlyVerified,
    onlyFeatured: state.onlyFeatured,
    onlyAvailable: state.onlyAvailable,
    sortBy: state.sortBy,
  };
}

/**
 * Format ConversationState as a readable string for the LLM prompt.
 *
 * v3: Emits a prominent BACKEND DIRECTIVE block that tells the LLM the exact
 * ACTION to take for this message. This is how "the backend controls the flow"
 * (Policy Rule 11). The LLM must obey the directive.
 *
 * @param vendorCount Number of real vendors loaded into the prompt context.
 *   When 0, RECOMMEND_VENDORS / REFINE_RESULTS are downgraded to
 *   NO_VENDORS_AVAILABLE so the LLM does NOT hallucinate vendor names.
 */
export function formatStateForPrompt(
  state: ConversationState,
  vendorCount: number = 0
): string {
  const lines: string[] = ["## CURRENT CONVERSATION STATE (SINGLE SOURCE OF TRUTH)"];

  if (state.conversationMode !== "CUSTOMER") {
    lines.push(`Mode: ${state.conversationMode}`);
  }
  if (state.eventType) lines.push(`Event: ${state.eventType}`);
  if (state.category) lines.push(`Category: ${state.category}`);
  if (state.subcategory) lines.push(`Subcategory: ${state.subcategory}`);
  if (state.city) lines.push(`City: ${state.city}`);
  if (state.budget) lines.push(`Budget: ${state.budget}`);
  if (state.guestCount) lines.push(`Guests: ${state.guestCount}`);
  if (state.eventDate) lines.push(`Date: ${state.eventDate}`);
  if (state.dietaryRequirements?.length > 0) lines.push(`Dietary: ${state.dietaryRequirements.join(", ")}`);
  if (state.deliveryRequired) lines.push(`Delivery required: yes`);
  if (state.pickupRequired) lines.push(`Pickup required: yes`);
  if (state.sortBy) lines.push(`Sort preference: ${state.sortBy}`);
  if (state.onlyVerified) lines.push(`Only verified vendors`);
  if (state.onlyFeatured) lines.push(`Only featured vendors`);
  if (state.vendorIdsDiscussed?.length > 0) lines.push(`Vendors discussed: ${state.vendorIdsDiscussed.length}`);
  if (state.storefrontVendorId) lines.push(`Currently viewing vendor: ${state.storefrontVendorId}`);

  lines.push(`Messages so far: ${state.messageCount}`);

  // ── Compute the directive ────────────────────────────────────────
  const hasCategory = !!state.category;
  const hasCity = !!state.city;
  const isFirstMessage = (state.messageCount ?? 0) <= 1; // 1 = the current user msg just merged
  const isCustomerMode = state.conversationMode === "CUSTOMER";

  // Determine if optional filters were just added (used for REFINE_RESULTS)
  const hasOptionalFilters =
    !!state.budget ||
    (state.dietaryRequirements?.length ?? 0) > 0 ||
    !!state.eventDate ||
    !!state.guestCount ||
    state.deliveryRequired === true ||
    state.pickupRequired === true ||
    state.onlyVerified ||
    state.onlyFeatured ||
    !!state.sortBy;

  lines.push("");
  lines.push("## ⚠️ BACKEND DIRECTIVE — YOU MUST EXECUTE THIS EXACT ACTION");
  lines.push("(The backend controls the conversation flow. Do not invent a different action.)");

  if (!isCustomerMode) {
    // VENDOR / ADMIN / STOREFRONT modes — answer their question, no slot-filling
    lines.push(`**ACTION: ${state.conversationMode}_MODE** — Answer the user's question about their ${state.conversationMode.toLowerCase()} context. Do not run customer slot-filling.`);
  } else if (hasCategory && hasCity && vendorCount === 0) {
    // Both required slots filled BUT no real vendors available → do NOT hallucinate
    lines.push(`**ACTION: NO_VENDORS_AVAILABLE**`);
    lines.push(`Both required slots are filled (category="${state.category}", city="${state.city}"), but the AVAILABLE VENDORS list in your context is EMPTY (vendor database unreachable, or zero matches for this search).`);
    lines.push("- Do NOT invent, fabricate, or hallucinate vendor names, ratings, prices, or taglines.");
    lines.push("- Do NOT output a vendor_suggestions JSON block.");
    lines.push("- Do NOT list vendor cards.");
    lines.push("- Acknowledge what the user is looking for in one warm sentence (e.g., \"I'd love to find wedding cake specialists in Dubai for you.\").");
    lines.push("- Explain briefly that vendor data is temporarily unavailable or no exact matches were found.");
    lines.push("- Suggest they browse the marketplace directly, or try a nearby city / broader category.");
    lines.push("- Keep it to 2-3 sentences. Do NOT greet. Do NOT restart the conversation.");
  } else if (hasCategory && hasCity) {
    // Both required slots filled AND real vendors available → recommend (or refine)
    const refineNotes: string[] = [];
    if (state.budget) refineNotes.push(`budget=${state.budget}`);
    if (state.dietaryRequirements?.length) refineNotes.push(`dietary=${state.dietaryRequirements.join("/")}`);
    if (state.eventDate) refineNotes.push(`date=${state.eventDate}`);
    if (state.guestCount) refineNotes.push(`guests=${state.guestCount}`);
    if (state.deliveryRequired) refineNotes.push("delivery=yes");
    if (state.onlyVerified) refineNotes.push("verified-only");
    if (state.onlyFeatured) refineNotes.push("featured-only");
    if (state.sortBy) refineNotes.push(`sort=${state.sortBy}`);

    if (hasOptionalFilters) {
      lines.push(`**ACTION: REFINE_RESULTS**`);
      lines.push(`Both required slots are already filled (category="${state.category}", city="${state.city}"). The user just added optional filters: ${refineNotes.join(", ")}.`);
      lines.push("- Acknowledge the new filter in one short sentence.");
      lines.push("- Re-recommend vendors from the AVAILABLE VENDORS list, filtered by the new criteria.");
      lines.push("- Do NOT ask any questions.");
      lines.push("- Do NOT greet the user.");
      lines.push("- Do NOT restart the conversation.");
      lines.push("- ONLY use vendor names that appear in the AVAILABLE VENDORS list. Never invent vendors.");
    } else {
      lines.push(`**ACTION: RECOMMEND_VENDORS**`);
      lines.push(`Both required slots are filled (category="${state.category}", city="${state.city}"). ${vendorCount} real vendors are loaded in context.`);
      lines.push("- Search the AVAILABLE VENDORS list and recommend the top 2-3 matches IMMEDIATELY.");
      lines.push("- Do NOT ask any questions. Do NOT greet. Do NOT restart.");
      lines.push(`- Emit a vendor_suggestions JSON block: {"type":"vendor_suggestions","categories":["${state.category}"],"city":"${state.city}","summary":"..."}`);
      lines.push("- Then list 2-3 vendor cards (name, rating, city, price, 1-line reason).");
      lines.push("- ONLY use vendor names that appear in the AVAILABLE VENDORS list. Never invent vendors.");
    }
  } else if (hasCategory && !hasCity) {
    lines.push(`**ACTION: ASK_FOR_CITY**`);
    lines.push(`Category "${state.category}" is already known. City is the ONLY missing required slot.`);
    lines.push(`- Ask naturally for the city (e.g., "Which city is your ${state.eventType ? state.eventType.toLowerCase() : "event"} in?").`);
    lines.push("- Do NOT ask what they need (category is already known).");
    lines.push("- Do NOT greet the user.");
    lines.push("- Do NOT restart the conversation.");
    lines.push("- Do NOT mention other slots (budget, date, guests).");
  } else if (!hasCategory && hasCity) {
    lines.push(`**ACTION: ASK_FOR_CATEGORY**`);
    lines.push(`City "${state.city}" is already known. Category is the ONLY missing required slot.`);
    lines.push("- Ask naturally what type of vendor they need (cake, DJ, photographer, decorator, etc.).");
    lines.push("- Do NOT ask for the city.");
    lines.push("- Do NOT greet the user.");
    lines.push("- Do NOT restart.");
  } else {
    // Neither slot known
    lines.push(`**ACTION: STATE_YOUR_NEED**`);
    if (isFirstMessage) {
      lines.push("- This is the first message. You may greet once (one line) and ask what they're planning.");
      lines.push("- Example: \"Hey there! 🎉 What are you planning — a wedding, birthday, or something else? Tell me what you need and I'll find the best vendors.\"");
    } else {
      lines.push("- The user has spoken before but we still don't have a category. Ask ONLY what type of vendor they need.");
      lines.push("- Do NOT greet. Do NOT restart.");
    }
  }

  // Hard reminders
  lines.push("");
  lines.push("## REMINDERS");
  lines.push(`- messageCount = ${state.messageCount}. ${state.messageCount > 1 ? "GREETINGS ARE FORBIDDEN (conversation already started)." : "Greeting allowed only if this is the very first message."}`);
  lines.push("- ConversationState above is the SINGLE SOURCE OF TRUTH. Never ask for any value already listed.");
  lines.push("- Never re-ask category, city, budget, dietary, date, or guests if they appear above.");
  lines.push("- Required slots = category + city. Everything else is optional and only refines results.");

  return lines.join("\n");
}
