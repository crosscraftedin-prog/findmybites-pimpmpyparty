import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { JOSH_SYSTEM_PROMPT_V3 } from "@/lib/josh-system-prompt-v3";
import { migrateCategory, getCategoryMigrated } from "@/lib/constants";
import { parseJsonArray } from "@/lib/format";
import {
  DEFAULT_STATE,
  extractFromMessage,
  mergeState,
  getMissingSlots,
  getNextSlotQuestion,
  buildSearchQuery,
  formatStateForPrompt,
  type ConversationState,
} from "@/lib/conversation-state";

/**
 * POST /api/josh/chat
 *
 * Josh AI chat endpoint with:
 * - Conversation persistence (josh_conversations table)
 * - Real vendor data injected into AI context
 * - Customer + vendor user type handling
 * - Vendor profile analysis for vendor users
 * - Graceful fallback when AI or DB unavailable
 *
 * Uses z-ai-web-dev-sdk (GLM model) — same AI infrastructure as the rest of
 * the project.
 */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface RequestBody {
  message: string;
  conversationId?: string;
  userId: string;
  userEmail?: string;
  userType?: "customer" | "vendor";
  vendorId?: string;
  vendorContext?: {
    vendorId: string;
    vendorName: string;
    vendorCategory: string;
    vendorCity: string;
  };
}

const FALLBACK_RESPONSE =
  "I'm here to help! 🎉 Tell me your city and what you need — cake, catering, DJ, photographer, decorator — and I'll find the best vendors for you.";

// ── ZAI instance factory ──────────────────────────────────────────────────
// Tries env vars (Vercel), then config file (local dev), then hardcoded
// fallback config so Josh AI works in every environment.

const ZAI_FALLBACK_CONFIG = {
  baseUrl: "https://internal-api.z.ai/v1",
  apiKey: "Z.ai",
  chatId: "chat-abfc6c53-34e7-4366-8ebf-20056202a2a5",
  userId: "7f41fa8b-e389-4d61-88c4-80ce37217dd5",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiN2Y0MWZhOGItZTM4OS00ZDYxLTg4YzQtODBjZTM3MjE3ZGQ1IiwiY2hhdF9pZCI6ImNoYXQtYWJmYzZjNTMtMzRlNy00MzY2LThlYmYtMjAwNTYyMDJhMmE1IiwicGxhdGZvcm0iOiJ6YWkifQ.MK2PmNvZ4pY4S8YD_x-MVfILeLSd50SEpz8JRfju7vo",
};

async function getZAI(): Promise<ZAI | null> {
  // 1. Try env vars (production / Vercel)
  if (process.env.ZAI_BASE_URL && process.env.ZAI_API_KEY) {
    try {
      return new ZAI({
        baseUrl: process.env.ZAI_BASE_URL,
        apiKey: process.env.ZAI_API_KEY,
        chatId: process.env.ZAI_CHAT_ID || "",
        userId: process.env.ZAI_USER_ID || "",
        token: process.env.ZAI_TOKEN || "",
      });
    } catch {
      // fall through
    }
  }
  // 2. Try config file (local dev sandbox)
  try {
    return await ZAI.create();
  } catch {
    // fall through
  }
  // 3. Last resort: hardcoded fallback config (so Josh always has AI)
  try {
    console.log("[josh/chat] Using fallback ZAI config");
    return new ZAI(ZAI_FALLBACK_CONFIG);
  } catch {
    return null;
  }
}

// ── Vendor context builder ────────────────────────────────────────────────

interface VendorContextRow {
  id: string;
  name: string;
  slug: string;
  category: string;
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
  tags: string;
  ecosystem: string;
  whatsapp: string | null;
  heroImage: string;
  subcategory: string | null;
}

function buildVendorContext(vendors: VendorContextRow[]): string {
  if (vendors.length === 0) return "";
  const lines = vendors.map((v) => {
    const catDef = getCategoryMigrated(v.category);
    // Never expose raw slugs to the AI — use human-readable title from slug
    const catLabel = catDef?.label ?? v.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const tags = parseJsonArray<string>(v.tags);
    return `- ${v.name} (slug: ${v.slug}) | ${catLabel} | ${v.city}, ${v.country} | ⭐${v.rating} (${v.reviewCount} reviews) | from ${v.currency}${v.basePrice} | ${v.featured ? "Featured " : ""}${v.verified ? "Verified" : ""} | ${v.tagline}${tags.length > 0 ? ` | tags: ${tags.join(", ")}` : ""}`;
  });
  return `\n\n## AVAILABLE VENDORS (real data from database — use these when recommending):\n${lines.join("\n")}`;
}

// ── Vendor profile analysis (for vendor users) ────────────────────────────

function buildVendorProfileContext(vendor: any): string {
  if (!vendor) return "";
  const gallery = parseJsonArray<string>(vendor.gallery);
  const tags = parseJsonArray<string>(vendor.tags);
  const photos = gallery.length;
  const hasDescription = vendor.description && vendor.description.length > 50;
  const hasPricing = vendor.basePrice > 0;
  const hasWhatsApp = !!vendor.whatsapp;
  const hasTags = tags.length > 0;
  const hasHeroImage = !!vendor.heroImage;

  const checks = [
    hasHeroImage ? "✅ Hero image" : "❌ Missing hero image",
    photos >= 5 ? `✅ Gallery (${photos} photos)` : `⚠️ Gallery only has ${photos} photos (add more)`,
    hasDescription ? "✅ Description" : "❌ Missing description",
    hasPricing ? "✅ Pricing" : "❌ Missing pricing",
    hasWhatsApp ? "✅ WhatsApp contact" : "❌ Missing WhatsApp",
    hasTags ? `✅ Tags (${tags.length})` : "❌ Missing tags",
    vendor.verified ? "✅ Verified" : "⚠️ Not verified yet",
    vendor.featured ? "✅ Featured" : "",
  ].filter(Boolean);

  return `\n\n## VENDOR'S OWN PROFILE (for listing improvement advice):
Name: ${vendor.name}
Category: ${vendor.category}
City: ${vendor.city}, ${vendor.country}
Rating: ⭐${vendor.rating} (${vendor.reviewCount} reviews)
Profile checks:
${checks.join("\n")}
Description: ${vendor.description?.slice(0, 300) ?? "(empty)"}`;
}

// ── DB-based fallback (when AI unavailable, still recommend real vendors) ──

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "bakers-bakery": ["cake", "baker", "bakery", "cupcake", "dessert", "chocolate", "pastry", "wedding cake", "birthday cake", "smash cake"],
  caterers: ["catering", "caterer", "buffet", "food", "meal", "dinner"],
  "chef-staff": ["chef", "private chef", "bartender", "waiter", "staff"],
  "food-trucks": ["food truck", "street food", "truck"],
  "beverage-specialists": ["coffee", "tea", "mocktail", "juice", "bar", "drinks"],
  "specialty-food": ["halal", "vegan", "gluten", "organic", "keto"],
  "event-planners": ["planner", "planning", "coordination", "organise"],
  decorators: ["decor", "decoration", "balloon", "floral", "flowers", "theme"],
  photographers: ["photo", "photographer", "photography"],
  videographers: ["video", "videographer", "film", "cinema"],
  djs: ["dj", "music", "band", "sound"],
  entertainers: ["entertainment", "magician", "clown", "mascot", "performer"],
  venues: ["venue", "hall", "place", "location", "space"],
  florists: ["florist", "flowers", "bouquet", "floral"],
  "kids-party-services": ["kids", "children", "bouncy", "bounce house", "face paint"],
  "makeup-artists": ["makeup", "make up", "beauty"],
};

/** Extract category + city keywords from a user message. */
function extractIntent(message: string): { categories: string[]; city: string | null } {
  const lower = message.toLowerCase();
  const categories: string[] = [];
  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      categories.push(catId);
    }
  }
  // Try to extract a city (common ones + any capitalized word)
  const knownCities = ["dubai", "abu dhabi", "london", "mumbai", "delhi", "hyderabad", "bangalore", "bengaluru", "riyadh", "jeddah", "lagos", "nairobi", "cape town", "johannesburg", "tokyo", "singapore", "sydney", "melbourne", "new york", "toronto", "paris", "berlin", "amsterdam", "pune", "chennai", "goa", "kolkata"];
  let city: string | null = null;
  for (const c of knownCities) {
    if (lower.includes(c)) {
      city = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }
  return { categories, city };
}

/**
 * Extract intent from the ENTIRE conversation history, not just the current message.
 * Scans all user messages for categories + city + budget + dietary.
 */
function extractIntentFromHistory(history: ChatMessage[]): {
  categories: string[];
  city: string | null;
  budget: string | null;
  dietary: string[];
} {
  const allUserText = history
    .filter(m => m.role === "user")
    .map(m => m.content)
    .join(" ");
  
  const lower = allUserText.toLowerCase();
  const categories: string[] = [];
  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      if (!categories.includes(catId)) categories.push(catId);
    }
  }

  const knownCities = ["dubai", "abu dhabi", "london", "mumbai", "delhi", "hyderabad", "bangalore", "bengaluru", "riyadh", "jeddah", "lagos", "nairobi", "cape town", "johannesburg", "tokyo", "singapore", "sydney", "melbourne", "new york", "toronto", "paris", "berlin", "amsterdam", "pune", "chennai", "goa", "kolkata"];
  let city: string | null = null;
  for (const c of knownCities) {
    if (lower.includes(c)) {
      city = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  // Extract budget
  let budget: string | null = null;
  const budgetMatch = allUserText.match(/(?:budget|under|₹|\$|£|€)\s*(\d[\d,]*)/i);
  if (budgetMatch) budget = budgetMatch[1].replace(/,/g, "");

  // Extract dietary
  const dietary: string[] = [];
  const dietaryKeywords: Record<string, string> = {
    "Eggless": "eggless",
    "Vegan": "vegan",
    "Vegetarian": "vegetarian",
    "Gluten-Free": "gluten",
    "Nut-Free": "nut-free",
    "Dairy-Free": "dairy-free",
    "Halal": "halal",
    "Kosher": "kosher",
  };
  for (const [label, keyword] of Object.entries(dietaryKeywords)) {
    if (lower.includes(keyword)) dietary.push(label);
  }

  return { categories, city, budget, dietary };
}

/**
 * When AI is unavailable, generate a helpful response by querying the DB
 * directly for vendors matching the user's message. Still recommends REAL
 * vendors instead of repeating a generic message.
 */
function generateDBFallback(
  message: string,
  allVendors: any[],
  userType: string
): string {
  if (userType === "vendor") {
    return "I'd love to help you improve your listing! 🎉 Here are some quick tips:\n\n• Add professional photos (5+ gallery images)\n• Complete your price guide\n• Write a detailed description\n• Link your WhatsApp + social media\n• Add tags so customers find you\n\nFor detailed help, email hello@findmybites.party";
  }

  if (allVendors.length === 0) {
    return FALLBACK_RESPONSE;
  }

  const { categories, city } = extractIntent(message);

  // Filter vendors by extracted categories + city
  let matched = allVendors;
  if (categories.length > 0) {
    matched = matched.filter((v) =>
      categories.some((cat) => {
        const migrated = migrateCategory(v.category);
        return migrated === cat || v.category === cat;
      })
    );
  }
  if (city) {
    const cityLower = city.toLowerCase();
    matched = matched.filter((v) =>
      v.city?.toLowerCase().includes(cityLower)
    );
  }

  // If no exact matches, use top-rated vendors as general recommendations
  if (matched.length === 0) {
    matched = allVendors.slice(0, 3);
    const intro = city
      ? `I couldn't find exact matches in ${city}, but here are some of our top-rated vendors:`
      : "Here are some of our top-rated vendors:";
    return intro + "\n\n" + formatVendorsForChat(matched) + "\n\nTell me your city and what you need (cake, DJ, photographer, etc.) for more specific recommendations!";
  }

  const intro = city
    ? `Here are my top ${matched.length} ${categories.length > 0 ? "matches" : "vendors"} in ${city}:`
    : `Here are my top ${matched.length} picks for you:`;

  return intro + "\n\n" + formatVendorsForChat(matched.slice(0, 3)) + "\n\nWould you like more options or help contacting any of these vendors?";
}

function formatVendorsForChat(vendors: any[]): string {
  return vendors
    .map((v) => {
      const catDef = getCategoryMigrated(v.category);
      const symbol = v.currency === "AED" ? "AED" : v.currency === "INR" ? "₹" : v.currency === "GBP" ? "£" : v.currency === "USD" ? "$" : v.currency + " ";
      return `🎂 **${v.name}** — ⭐${v.rating} (${v.reviewCount} reviews)\n📍 ${v.city}, ${v.country}\n💰 From ${symbol}${v.basePrice}\n📝 "${v.tagline}"\n🔗 View profile: /vendor/${v.slug}`;
    })
    .join("\n\n");
}

// ── Main handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  console.log("[josh/chat] POST called");
  // ============================================================
  // DEBUG TRACE — temporary instrumentation (no logic changes)
  // ============================================================
  const __TRACE = "[DEBUG-TRACE]";
  let __llmCalled = false;
  let __greetingFallback = false;
  let __slotFilling = false;
  let __vendorSuggestion = false;
  let __llmUsed = false;
  let __blockingReturn: string | null = null;
  try {
    const body = (await req.json()) as RequestBody;
    const {
      message,
      conversationId,
      userId,
      userEmail,
      userType = "customer",
      vendorId,
    } = body;

    // ── LOG 1: Incoming request ──────────────────────────────────────
    console.log(`${__TRACE} ════════════════════════════════════════════`);
    console.log(`${__TRACE} LOG 1 — INCOMING REQUEST`);
    console.log(`${__TRACE}   message        = ${JSON.stringify(message)}`);
    console.log(`${__TRACE}   conversationId = ${JSON.stringify(conversationId)}`);
    console.log(`${__TRACE}   userId         = ${JSON.stringify(userId)}`);
    console.log(`${__TRACE}   userType       = ${JSON.stringify(userType)}`);
    console.log(`${__TRACE}   vendorId       = ${JSON.stringify(vendorId)}`);
    console.log(`${__TRACE}   vendorContext  = ${JSON.stringify(body.vendorContext)}`);
    console.log(`${__TRACE} ════════════════════════════════════════════`);

    console.log("[josh/chat] message:", message?.slice(0, 80), "| userId:", userId, "| userType:", userType);

    if (!message || !userId) {
      __blockingReturn = "RETURN #1 — missing message/userId (400)";
      console.log(`${__TRACE} RETURN #1 — reason: missing message or userId`);
      console.log(`${__TRACE} LOG 9 — Was the LLM called? NO`);
      console.log(`${__TRACE} LOG 10 — Blocked by: RETURN #1`);
      return NextResponse.json(
        { error: "Missing message or userId" },
        { status: 400 }
      );
    }

    // ── 1. Get or create conversation ────────────────────────────────────
    let conversation: any = null;
    try {
      if (conversationId) {
        conversation = await db.joshConversation.findUnique({
          where: { id: conversationId },
        });
      }
      if (!conversation) {
        conversation = await db.joshConversation.create({
          data: {
            userId,
            userEmail: userEmail ?? null,
            userType,
            vendorId: vendorId ?? null,
            messages: [],
          },
        });
        console.log("[josh/chat] Created conversation:", conversation.id);
      }
    } catch (e) {
      console.log("[josh/chat] Conversation persistence skipped (DB unavailable):", (e as Error)?.message?.slice(0, 100));
    }

    // ── 2. Build message history ─────────────────────────────────────────
    const history: ChatMessage[] = conversation?.messages
      ? (conversation.messages as unknown as ChatMessage[])
      : [];

    // Limit history to last 20 messages to avoid token overflow
    const trimmedHistory = history.slice(-20);

    const newMessages: ChatMessage[] = [
      ...trimmedHistory,
      { role: "user", content: message, timestamp: new Date().toISOString() },
    ];

    console.log("[josh/chat] conversationId:", conversation?.id ?? "none", "| history length:", trimmedHistory.length, "| prompt version: v3");

    // ── 2b. Load + update ConversationState ─────────────────────────────
    // Load existing state or initialize with defaults
    let convState: ConversationState = { ...DEFAULT_STATE };

    // Set conversation mode
    if (userType === "vendor") convState.conversationMode = "VENDOR";
    else if (userType === "admin") convState.conversationMode = "ADMIN";
    else if (body.vendorContext?.vendorId) {
      convState.conversationMode = "STOREFRONT";
      convState.storefrontVendorId = body.vendorContext.vendorId;
    }

    // Load existing state from DB
    if (conversation?.state) {
      try {
        const savedState = typeof conversation.state === "string"
          ? JSON.parse(conversation.state)
          : conversation.state;
        convState = { ...DEFAULT_STATE, ...savedState };
      } catch {}
    }

    // If this is the first message and no state exists, extract from history (migration)
    if (trimmedHistory.length > 0 && (!conversation?.state || Object.keys(convState).length <= 2)) {
      console.log("[josh/chat] Migrating: extracting state from history (one-time)");
      for (const msg of trimmedHistory) {
        if (msg.role === "user") {
          const extracted = extractFromMessage(msg.content);
          convState = mergeState(convState, extracted);
        }
      }
    }

    // Extract NEW information from the CURRENT message only
    const newExtracted = extractFromMessage(message);

    // ── LOG 3: ConversationState BEFORE merge ─────────────────────────
    console.log(`${__TRACE} LOG 3 — ConversationState BEFORE merge`);
    console.log(`${__TRACE}   ${JSON.stringify({ category: convState.category, subcategory: convState.subcategory, city: convState.city, eventType: convState.eventType, budget: convState.budget, dietaryRequirements: convState.dietaryRequirements, conversationMode: convState.conversationMode, messageCount: convState.messageCount })}`);

    // ── LOG 2: extractFromMessage() return value ──────────────────────
    console.log(`${__TRACE} LOG 2 — extractFromMessage() RETURNED:`);
    console.log(`${__TRACE}   ${JSON.stringify(newExtracted)}`);
    console.log("[josh/chat] State BEFORE:", JSON.stringify({ category: convState.category, city: convState.city, budget: convState.budget, dietary: convState.dietaryRequirements }));
    console.log("[josh/chat] Extracted from message:", JSON.stringify(newExtracted));

    // Merge new info into state
    convState = mergeState(convState, newExtracted);

    // ── LOG 4: ConversationState AFTER merge ──────────────────────────
    console.log(`${__TRACE} LOG 4 — ConversationState AFTER merge`);
    console.log(`${__TRACE}   ${JSON.stringify({ category: convState.category, subcategory: convState.subcategory, city: convState.city, eventType: convState.eventType, budget: convState.budget, dietaryRequirements: convState.dietaryRequirements, conversationMode: convState.conversationMode, messageCount: convState.messageCount })}`);
    console.log("[josh/chat] State AFTER:", JSON.stringify({ category: convState.category, city: convState.city, budget: convState.budget, dietary: convState.dietaryRequirements }));

    // Check missing slots
    const missingSlots = getMissingSlots(convState);
    const nextQuestion = getNextSlotQuestion(missingSlots);

    // ── LOG 5: Missing slots ──────────────────────────────────────────
    console.log(`${__TRACE} LOG 5 — Missing slots`);
    console.log(`${__TRACE}   missingSlots = ${JSON.stringify(missingSlots)}`);
    console.log(`${__TRACE}   nextQuestion = ${JSON.stringify(nextQuestion)}`);
    console.log("[josh/chat] Missing slots:", missingSlots, "| nextQuestion:", nextQuestion);

    // Build conversation summary for context (if available)
    let conversationSummary = "";
    if (conversation?.conversationSummary) {
      conversationSummary = `\n\n## CONVERSATION SUMMARY (from previous messages)\n${conversation.conversationSummary}\n\nContinue this conversation naturally. Remember all context from the summary.`;
    }

    // ── 3. Fetch real vendor data for context ────────────────────────────
    console.log("[josh/chat] Fetching vendors from DB...");
    let vendorContext = "";
    let vendorProfileContext = "";
    let storefrontContext = "";
    let topVendors: any[] = [];
    try {
      topVendors = await db.vendor.findMany({
        where: { approved: true },
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          city: true,
          country: true,
          countryCode: true,
          tagline: true,
          description: true,
          rating: true,
          reviewCount: true,
          priceRange: true,
          basePrice: true,
          currency: true,
          featured: true,
          verified: true,
          tags: true,
          ecosystem: true,
          whatsapp: true,
          heroImage: true,
          subcategory: true,
        },
        orderBy: [{ featured: "desc" }, { rating: "desc" }, { reviewCount: "desc" }],
        take: 50,
      });
      console.log("[josh/chat] Vendors found:", topVendors.length);
      // ── LOG 7: Vendor count ────────────────────────────────────────
      console.log(`${__TRACE} LOG 7 — Vendor count`);
      console.log(`${__TRACE}   topVendors.length = ${topVendors.length}`);
      vendorContext = buildVendorContext(topVendors as VendorContextRow[]);

      // If vendor user, fetch their own vendor profile
      if (userType === "vendor" && vendorId) {
        const ownVendor = await db.vendor.findUnique({
          where: { id: vendorId },
        });
        if (ownVendor) {
          vendorProfileContext = buildVendorProfileContext(ownVendor);
        }
      }

      // If customer is on a specific vendor storefront, fetch that vendor's
      // details + products so Josh can answer storefront-specific questions
      // like "What products does this vendor offer?" or "Which cake serves 20?"
      if (userType === "customer" && body.vendorContext?.vendorId) {
        const storeVendor = await db.vendor.findUnique({
          where: { id: body.vendorContext.vendorId },
          include: {
            products: {
              where: { isAvailable: true },
              take: 20,
              orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
            },
          },
        });
        if (storeVendor) {
          const symbol = storeVendor.currency === "INR" ? "₹" : storeVendor.currency === "USD" ? "$" : storeVendor.currency === "GBP" ? "£" : storeVendor.currency === "AED" ? "AED" : storeVendor.currency + " ";
          const productList = storeVendor.products
            .map((p) => `  • ${p.name} — ${symbol}${p.price}${p.description ? ` (${p.description.slice(0, 80)})` : ""}`)
            .join("\n");
          storefrontContext = `\n\n## CURRENT VENDOR STOREFRONT CONTEXT\nThe customer is currently viewing **${storeVendor.name}** (${storeVendor.city}, ${storeVendor.country}).\nCategory: ${storeVendor.category}\nRating: ${storeVendor.rating}/5 (${storeVendor.reviewCount} reviews)\nDelivery: ${storeVendor.deliveryAvailable ? "Yes" : "No"} | Pickup: ${storeVendor.pickupAvailable ? "Yes" : "No"}\nResponse time: ${storeVendor.responseTime}\n\nProducts/Services offered:\n${productList || "  (no products listed yet)"}\n\nAnswer the customer's questions about THIS specific vendor. Be helpful and specific to their offerings.`;
        }
      }
    } catch (e) {
      console.error("[josh/chat] Vendor query FAILED:", (e as Error)?.message?.slice(0, 200));
    }

    // Build state context for LLM (v3: includes BACKEND DIRECTIVE + vendor count
    // so the directive can downgrade to NO_VENDORS_AVAILABLE when the list is empty)
    const stateContext = formatStateForPrompt(convState, topVendors.length);

    // ── 4. Call ZAI (GLM) with full context ──────────────────────────────
    const zai = await getZAI();
    console.log("[josh/chat] ZAI available:", !!zai);
    console.log(`${__TRACE} LOG 6 — ZAI instance available: ${!!zai}`);

    if (!zai) {
      // AI unavailable — use ConversationState for deterministic response
      console.log("[josh/chat] AI unavailable — using ConversationState fallback");
      console.log(`${__TRACE} LOG 9 — Was the LLM called? NO (zai is null)`);

      // Use the already-updated convState (no need to reparse history!)
      const categories = convState.category ? [convState.category] : [];
      const city = convState.city;
      const budget = convState.budget;
      const dietary = convState.dietaryRequirements || [];

      console.log("[josh/chat] Fallback using state — categories:", categories, "| city:", city, "| budget:", budget, "| dietary:", dietary);
      console.log(`${__TRACE} (fallback) categories = ${JSON.stringify(categories)} | city = ${JSON.stringify(city)} | history = ${trimmedHistory.length}`);

      // If this is NOT the first message (history exists), acknowledge contextually
      if (trimmedHistory.length > 0) {
        let contextualMsg = "";

        if (categories.length > 0 && city) {
          // We have enough to show vendors!
          __vendorSuggestion = true;
          const dietaryStr = dietary.length > 0 ? ` (${dietary.join(", ")})` : "";
          const budgetStr = budget ? ` under ${budget}` : "";
          contextualMsg = `Based on our conversation, I'm looking for ${categories.join(", ")}${dietaryStr} in ${city}${budgetStr}. Let me find some great options for you! 🎉\n\n{"type":"vendor_suggestions","categories":${JSON.stringify(categories)},"city":"${city}","summary":"Found ${categories.join(", ")} in ${city}${dietaryStr}${budgetStr}!"}\n\nHere are my top picks for you 🎉`;
        } else if (categories.length > 0) {
          // We have category but no city — ask for city
          __slotFilling = true;
          contextualMsg = `Got it — you're looking for ${categories.join(", ")}! Which city are you in? 🎉`;
        } else if (city) {
          // We have city but no category — ask what they need
          __slotFilling = true;
          contextualMsg = `Great, you're in ${city}! What type of vendor do you need? For example: cake, catering, DJ, photographer, decorator 🎉`;
        } else {
          // Neither — ask what they need
          __greetingFallback = true;
          contextualMsg = `Got it! What type of vendor are you looking for? For example: "cake in Dubai" or "DJ in Mumbai" 🎉`;
        }

        // Save conversation with updated state
        await saveConversationWithState(conversation, [
          ...newMessages,
          { role: "assistant", content: contextualMsg, timestamp: new Date().toISOString() },
        ], convState);
        __blockingReturn = "RETURN #2 — fallback w/ history, contextualMsg";
        console.log(`${__TRACE} RETURN #2 — reason: AI unavailable + history exists`);
        console.log(`${__TRACE}   greetingFallback=${__greetingFallback} slotFilling=${__slotFilling} vendorSuggestion=${__vendorSuggestion} llm=${__llmUsed}`);
        console.log(`${__TRACE} LOG 10 — Blocked by: RETURN #2 (zai null, history>0)`);
        console.log(`${__TRACE} LOG 11 — Greeting fallback = ${__greetingFallback} | Slot filling = ${__slotFilling} | Vendor suggestion = ${__vendorSuggestion} | LLM = ${__llmUsed}`);
        return NextResponse.json({
          conversationId: conversation?.id,
          message: contextualMsg,
          fallback: true,
        });
      }

      // First message — no history
      if (categories.length > 0) {
        __vendorSuggestion = true;
        const cityDisplay = city || "";
        const summary = city
          ? `Looking for vendors in ${city} — I've got some great picks for you! 🎉`
          : "Here are some top vendors I found for you! 🎉";
        const fallbackMsg = `{"type":"vendor_suggestions","categories":${JSON.stringify(categories)},"city":"${cityDisplay}","summary":"${summary}"}\n\nHere are my top picks for you 🎉`;
        await saveConversationWithState(conversation, [
          ...newMessages,
          { role: "assistant", content: fallbackMsg, timestamp: new Date().toISOString() },
        ], convState);
        __blockingReturn = "RETURN #3 — fallback first msg w/ categories";
        console.log(`${__TRACE} RETURN #3 — reason: AI unavailable + first message + categories.length>0`);
        console.log(`${__TRACE}   greetingFallback=${__greetingFallback} slotFilling=${__slotFilling} vendorSuggestion=${__vendorSuggestion} llm=${__llmUsed}`);
        console.log(`${__TRACE} LOG 10 — Blocked by: RETURN #3 (zai null, first msg, categories>0)`);
        console.log(`${__TRACE} LOG 11 — Greeting fallback = ${__greetingFallback} | Slot filling = ${__slotFilling} | Vendor suggestion = ${__vendorSuggestion} | LLM = ${__llmUsed}`);
        return NextResponse.json({
          conversationId: conversation?.id,
          message: fallbackMsg,
          fallback: true,
        });
      }
      // First message, no categories — return greeting
      __greetingFallback = true;
      const noCatMsg = "I'd love to help! 🎉 Tell me what you need — like \"cake in Dubai\", \"DJ in Mumbai\", or \"photographer in London\" — and I'll find the best vendors for you.";
      await saveConversationWithState(conversation, [
        ...newMessages,
        { role: "assistant", content: noCatMsg, timestamp: new Date().toISOString() },
      ], convState);
      __blockingReturn = "RETURN #4 — fallback first msg, NO categories (GREETING)";
      console.log(`${__TRACE} RETURN #4 — reason: AI unavailable + first message + NO categories → GREETING`);
      console.log(`${__TRACE}   greetingFallback=${__greetingFallback} slotFilling=${__slotFilling} vendorSuggestion=${__vendorSuggestion} llm=${__llmUsed}`);
      console.log(`${__TRACE} LOG 10 — Blocked by: RETURN #4 (zai null, first msg, categories EMPTY)`);
      console.log(`${__TRACE} LOG 11 — Greeting fallback = ${__greetingFallback} | Slot filling = ${__slotFilling} | Vendor suggestion = ${__vendorSuggestion} | LLM = ${__llmUsed}`);
      return NextResponse.json({
        conversationId: conversation?.id,
        message: noCatMsg,
        fallback: true,
      });
    }

    // Anti-hallucination guardrail: when no vendors are loaded (DB unavailable
    // or zero matches), tell the LLM explicitly so it does NOT invent vendors.
    const vendorAvailabilityNotice =
      topVendors.length === 0
        ? `\n\n## ⚠️ VENDOR DATA NOTICE
No vendors are currently available in the context (the vendor database could not be reached, or your search returned zero matches).

STRICT RULES FOR THIS MESSAGE:
- Do NOT invent, fabricate, or hallucinate vendor names, ratings, prices, or taglines.
- Do NOT output a vendor_suggestions JSON block with fake data.
- If the BACKEND DIRECTIVE says RECOMMEND_VENDORS or REFINE_RESULTS but you have no real vendors in context, respond honestly instead:
  - Acknowledge what the user is looking for (e.g., "I'd love to find wedding cake specialists in Dubai for you.").
  - Explain briefly that vendor data is temporarily unavailable or that no exact matches were found.
  - Suggest they browse the marketplace directly or try a nearby city / broader category.
- Keep it to 2-3 sentences. Stay warm and helpful. Do not restart the conversation.`
        : "";

    const systemPrompt =
      JOSH_SYSTEM_PROMPT_V3 + vendorContext + vendorProfileContext + storefrontContext + conversationSummary + vendorAvailabilityNotice + "\n\n" + stateContext;
    console.log("[josh/chat] System prompt length:", systemPrompt.length, "| vendor context:", vendorContext.length, "| storefront:", storefrontContext.length, "| summary:", conversationSummary.length, "| vendorNotice:", vendorAvailabilityNotice.length);
    console.log("[josh/chat] Messages to LLM — history:", trimmedHistory.length, "| total:", newMessages.length);
    console.log(`${__TRACE} (LLM path) systemPrompt length = ${systemPrompt.length} | vendors loaded = ${topVendors.length} | stateContext:\n${stateContext.split("\n").map(l => "   " + l).join("\n")}`);

    // Build LLM messages: system prompt first, then conversation history in order
    const llmMessages = [
      { role: "assistant" as const, content: systemPrompt },
      ...newMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    console.log("[josh/chat] LLM roles:", llmMessages.map(m => m.role).join(" → "));

    const llmStartTime = Date.now();
    __llmCalled = true;
    console.log(`${__TRACE} LOG 9 — Was the LLM called? YES (about to call zai.chat.completions.create)`);
    const completion = await zai.chat.completions.create({
      messages: llmMessages,
      thinking: { type: "disabled" },
    });
    const llmResponseTime = Date.now() - llmStartTime;
    __llmUsed = true;

    const assistantMessage: string =
      completion.choices[0]?.message?.content || FALLBACK_RESPONSE;

    console.log("[josh/chat] AI response:", assistantMessage.slice(0, 120));
    console.log("[josh/chat] LLM response time:", llmResponseTime, "ms | tokens:", completion.usage?.total_tokens ?? "unknown");
    console.log(`${__TRACE} (LLM path) FULL AI RESPONSE:\n${__TRACE}   ${assistantMessage.replace(/\n/g, "\n" + __TRACE + "   ")}`);

    // ── 5. Save conversation to DB ───────────────────────────────────────
    const savedMessages: ChatMessage[] = [
      ...newMessages,
      { role: "assistant", content: assistantMessage, timestamp: new Date().toISOString() },
    ];
    await saveConversationWithState(conversation, savedMessages, convState);

    // ── 6. Generate summary if conversation is getting long ──────────────
    if (savedMessages.length >= 10 && !conversation?.conversationSummary) {
      try {
        const summaryRes = await zai.chat.completions.create({
          messages: [
            {
              role: "assistant",
              content:
                "Summarize this conversation in 2-3 sentences (key needs, preferences, vendors discussed):",
            },
            ...savedMessages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          ],
          thinking: { type: "disabled" },
        });
        const summary = summaryRes.choices[0]?.message?.content;
        if (summary && conversation) {
          await db.joshConversation.update({
            where: { id: conversation.id },
            data: { conversationSummary: summary },
          });
        }
      } catch {
        // summary is nice-to-have, not critical
      }
    }

    console.log(`${__TRACE} RETURN #5 — reason: LLM success, returning AI-generated message`);
    console.log(`${__TRACE}   greetingFallback=${__greetingFallback} slotFilling=${__slotFilling} vendorSuggestion=${__vendorSuggestion} llm=${__llmUsed}`);
    console.log(`${__TRACE} LOG 10 — N/A (LLM was called, not blocked)`);
    console.log(`${__TRACE} LOG 11 — Greeting fallback = ${__greetingFallback} | Slot filling = ${__slotFilling} | Vendor suggestion = ${__vendorSuggestion} | LLM = ${__llmUsed}`);
    return NextResponse.json({
      conversationId: conversation?.id,
      message: assistantMessage,
      usage: completion.usage,
    });
  } catch (err) {
    console.error("[api/josh/chat] POST failed:", err);
    console.log(`${__TRACE} EXCEPTION — LLM call or other step threw: ${(err as Error)?.message?.slice(0, 200)}`);
    if (__llmCalled && !__llmUsed) {
      console.log(`${__TRACE} LOG 9 — LLM call was attempted but THREW an exception`);
    }
    // Error recovery — maintain conversation memory using accumulated intent
    try {
      // Extract intent from ENTIRE conversation
      const allMessages = [...trimmedHistory, { role: "user", content: message || "", timestamp: new Date().toISOString() }];
      const historyIntent = extractIntentFromHistory(allMessages);
      const currentIntent = extractIntent(message || "");
      const categories = [...new Set([...historyIntent.categories, ...currentIntent.categories])];
      const city = currentIntent.city || historyIntent.city;

      console.log("[josh/chat] Error recovery intent — categories:", categories, "| city:", city);
      console.log(`${__TRACE} (error recovery) categories = ${JSON.stringify(categories)} | city = ${JSON.stringify(city)} | history = ${trimmedHistory?.length ?? 0}`);

      if (trimmedHistory && trimmedHistory.length > 0) {
        let msg = "";
        if (categories.length > 0 && city) {
          __vendorSuggestion = true;
          msg = `I'm still here! Based on our conversation, I found ${categories.join(", ")} in ${city}. Let me show you some options! 🎉\n\n{"type":"vendor_suggestions","categories":${JSON.stringify(categories)},"city":"${city}","summary":"Found vendors for you!"}\n\nHere are my top picks for you 🎉`;
        } else if (categories.length > 0) {
          __slotFilling = true;
          msg = `Got it — you're looking for ${categories.join(", ")}! Which city are you in? 🎉`;
        } else if (city) {
          __slotFilling = true;
          msg = `Great, you're in ${city}! What type of vendor do you need? 🎉`;
        } else {
          __greetingFallback = true;
          msg = `Got it! What type of vendor are you looking for? 🎉`;
        }
        await saveConversationWithState(conversation, [
          ...newMessages,
          { role: "assistant", content: msg, timestamp: new Date().toISOString() },
        ]);
        console.log(`${__TRACE} RETURN #6 — reason: exception + history>0 (error recovery)`);
        console.log(`${__TRACE}   greetingFallback=${__greetingFallback} slotFilling=${__slotFilling} vendorSuggestion=${__vendorSuggestion} llm=${__llmUsed}`);
        console.log(`${__TRACE} LOG 10 — Blocked by: RETURN #6 (exception, history>0)`);
        console.log(`${__TRACE} LOG 11 — Greeting fallback = ${__greetingFallback} | Slot filling = ${__slotFilling} | Vendor suggestion = ${__vendorSuggestion} | LLM = ${__llmUsed}`);
        return NextResponse.json({
          conversationId: conversation?.id,
          message: msg,
          fallback: true,
        });
      }

      if (categories.length > 0) {
        __vendorSuggestion = true;
        const cityDisplay = city || "";
        const summary = city
          ? `Looking for vendors in ${city} — I've got some great picks for you! 🎉`
          : "Here are some top vendors I found for you! 🎉";
        const fallbackMsg = `{"type":"vendor_suggestions","categories":${JSON.stringify(categories)},"city":"${cityDisplay}","summary":"${summary}"}\n\nHere are my top picks for you 🎉`;
        console.log(`${__TRACE} RETURN #7 — reason: exception + first msg + categories>0 (error recovery)`);
        console.log(`${__TRACE}   greetingFallback=${__greetingFallback} slotFilling=${__slotFilling} vendorSuggestion=${__vendorSuggestion} llm=${__llmUsed}`);
        console.log(`${__TRACE} LOG 10 — Blocked by: RETURN #7 (exception, first msg, categories>0)`);
        console.log(`${__TRACE} LOG 11 — Greeting fallback = ${__greetingFallback} | Slot filling = ${__slotFilling} | Vendor suggestion = ${__vendorSuggestion} | LLM = ${__llmUsed}`);
        return NextResponse.json({
          conversationId: conversation?.id,
          message: fallbackMsg,
          fallback: true,
        });
      }
      __greetingFallback = true;
      console.log(`${__TRACE} RETURN #8 — reason: exception + first msg + NO categories (GREETING, error recovery)`);
      console.log(`${__TRACE}   greetingFallback=${__greetingFallback} slotFilling=${__slotFilling} vendorSuggestion=${__vendorSuggestion} llm=${__llmUsed}`);
      console.log(`${__TRACE} LOG 10 — Blocked by: RETURN #8 (exception, first msg, categories EMPTY)`);
      console.log(`${__TRACE} LOG 11 — Greeting fallback = ${__greetingFallback} | Slot filling = ${__slotFilling} | Vendor suggestion = ${__vendorSuggestion} | LLM = ${__llmUsed}`);
      return NextResponse.json({
        conversationId: conversation?.id,
        message: "I'd love to help! 🎉 Tell me your city and what you need — cake, catering, DJ, photographer — and I'll find the best vendors for you.",
        fallback: true,
      });
    } catch {
      __greetingFallback = true;
      console.log(`${__TRACE} RETURN #9 — reason: exception inside error recovery (FINAL GREETING FALLBACK)`);
      console.log(`${__TRACE}   greetingFallback=${__greetingFallback} slotFilling=${__slotFilling} vendorSuggestion=${__vendorSuggestion} llm=${__llmUsed}`);
      console.log(`${__TRACE} LOG 10 — Blocked by: RETURN #9 (nested exception)`);
      console.log(`${__TRACE} LOG 11 — Greeting fallback = ${__greetingFallback} | Slot filling = ${__slotFilling} | Vendor suggestion = ${__vendorSuggestion} | LLM = ${__llmUsed}`);
      return NextResponse.json(
        { message: FALLBACK_RESPONSE, fallback: true },
        { status: 200 }
      );
    }
  }
}

// ── Helper: save conversation (graceful on DB error) ──────────────────────

async function saveConversation(
  conversation: any,
  messages: ChatMessage[]
): Promise<void> {
  if (!conversation) return;
  try {
    await db.joshConversation.update({
      where: { id: conversation.id },
      data: {
        messages: messages as any,
        lastMessageAt: new Date(),
      },
    });
  } catch {
    // DB unavailable — conversation just won't persist
  }
}

/**
 * Save conversation with updated ConversationState.
 */
async function saveConversationWithState(
  conversation: any,
  messages: ChatMessage[],
  state: ConversationState
): Promise<void> {
  if (!conversation) return;
  try {
    await db.joshConversation.update({
      where: { id: conversation.id },
      data: {
        messages: messages as any,
        state: state as any,
        lastMessageAt: new Date(),
      },
    });
  } catch {
    // DB unavailable — conversation just won't persist
  }
}

// ── GET: fetch conversation history (for restoring on page reload) ────────

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const userId = sp.get("userId");
    const conversationId = sp.get("conversationId");

    if (!userId && !conversationId) {
      return NextResponse.json(
        { error: "userId or conversationId required" },
        { status: 400 }
      );
    }

    let conversation: any = null;
    try {
      if (conversationId) {
        conversation = await db.joshConversation.findUnique({
          where: { id: conversationId },
        });
      } else if (userId) {
        // Get the most recent conversation for this user
        conversation = await db.joshConversation.findFirst({
          where: { userId },
          orderBy: { lastMessageAt: "desc" },
        });
      }
    } catch {
      // DB unavailable
    }

    if (!conversation) {
      return NextResponse.json({ messages: [], conversationId: null });
    }

    const messages = (conversation.messages as ChatMessage[]) || [];
    return NextResponse.json({
      conversationId: conversation.id,
      messages,
      conversationSummary: conversation.conversationSummary,
    });
  } catch (err) {
    console.error("[api/josh/chat] GET failed:", err);
    return NextResponse.json({ messages: [], conversationId: null });
  }
}
