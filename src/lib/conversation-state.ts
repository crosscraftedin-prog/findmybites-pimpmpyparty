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

  // Dietary
  const dietary: string[] = [];
  for (const [label, keywords] of Object.entries(DIETARY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      dietary.push(label);
    }
  }
  if (dietary.length > 0) {
    updates.dietaryRequirements = dietary;
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
 */
export function formatStateForPrompt(state: ConversationState): string {
  const lines: string[] = ["## CURRENT CONVERSATION STATE (source of truth)"];

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

  const missing = getMissingSlots(state);
  if (missing.length > 0) {
    lines.push(`Missing information: ${missing.join(", ")}`);
    lines.push(`Next question to ask: ${getNextSlotQuestion(missing) || "none"}`);
  } else {
    lines.push(`All required information collected — ready to search vendors.`);
  }

  lines.push("");
  lines.push("Use this state to answer the user's question. Do NOT ask for information that's already in the state. If all required fields are filled, recommend vendors immediately.");

  return lines.join("\n");
}
