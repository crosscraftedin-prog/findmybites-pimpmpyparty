import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { JOSH_SYSTEM_PROMPT } from "@/lib/josh-system-prompt";
import { migrateCategory, getCategoryMigrated } from "@/lib/constants";
import { parseJsonArray } from "@/lib/format";

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
}

const FALLBACK_RESPONSE =
  "I'd love to help! 🎉 Tell me what you're celebrating, which city you're in, and what you need (cake, catering, DJ, photographer, etc.) and I'll find the best vendors for you.";

// ── ZAI instance factory (env vars for Vercel, config file for local dev) ──

async function getZAI(): Promise<ZAI | null> {
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
  try {
    return await ZAI.create();
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
    const tags = parseJsonArray<string>(v.tags);
    return `- ${v.name} (slug: ${v.slug}) | ${catDef?.label ?? v.category} | ${v.city}, ${v.country} | ⭐${v.rating} (${v.reviewCount} reviews) | from ${v.currency}${v.basePrice} | ${v.featured ? "Featured " : ""}${v.verified ? "Verified" : ""} | ${v.tagline}${tags.length > 0 ? ` | tags: ${tags.join(", ")}` : ""}`;
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
  const knownCities = ["dubai", "abu dhabi", "london", "mumbai", "delhi", "hyderabad", "bangalore", "riyadh", "jeddah", "lagos", "nairobi", "cape town", "johannesburg", "tokyo", "singapore", "sydney", "melbourne", "new york", "toronto", "paris", "berlin", "amsterdam"];
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

    console.log("[josh/chat] message:", message?.slice(0, 80), "| userId:", userId, "| userType:", userType);

    if (!message || !userId) {
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
      ? (conversation.messages as ChatMessage[])
      : [];
    const newMessages: ChatMessage[] = [
      ...history,
      { role: "user", content: message, timestamp: new Date().toISOString() },
    ];

    // ── 3. Fetch real vendor data for context ────────────────────────────
    console.log("[josh/chat] Fetching vendors from DB...");
    let vendorContext = "";
    let vendorProfileContext = "";
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
    } catch (e) {
      console.error("[josh/chat] Vendor query FAILED:", (e as Error)?.message?.slice(0, 200));
    }

    // ── 4. Call ZAI (GLM) with full context ──────────────────────────────
    const zai = await getZAI();
    console.log("[josh/chat] ZAI available:", !!zai);

    if (!zai) {
      // AI unavailable — do a DIRECT DB vendor search so Josh still recommends
      // real vendors instead of repeating a generic fallback message.
      console.log("[josh/chat] AI unavailable — generating DB-based fallback with vendor suggestions");
      const fallbackMsg = generateDBFallback(message, topVendors, userType);

      await saveConversation(conversation, [
        ...newMessages,
        { role: "assistant", content: fallbackMsg, timestamp: new Date().toISOString() },
      ]);

      return NextResponse.json({
        conversationId: conversation?.id,
        message: fallbackMsg,
        fallback: true,
      });
    }

    const systemPrompt =
      JOSH_SYSTEM_PROMPT + vendorContext + vendorProfileContext;
    console.log("[josh/chat] System prompt length:", systemPrompt.length, "| vendor context length:", vendorContext.length);

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: systemPrompt },
        ...newMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      thinking: { type: "disabled" },
    });

    const assistantMessage: string =
      completion.choices[0]?.message?.content || FALLBACK_RESPONSE;
    console.log("[josh/chat] AI response:", assistantMessage.slice(0, 120));

    // ── 5. Save conversation to DB ───────────────────────────────────────
    const savedMessages: ChatMessage[] = [
      ...newMessages,
      { role: "assistant", content: assistantMessage, timestamp: new Date().toISOString() },
    ];
    await saveConversation(conversation, savedMessages);

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

    return NextResponse.json({
      conversationId: conversation?.id,
      message: assistantMessage,
      usage: completion.usage,
    });
  } catch (err) {
    console.error("[api/josh/chat] POST failed:", err);
    return NextResponse.json(
      { message: FALLBACK_RESPONSE, fallback: true },
      { status: 200 } // 200 with fallback so the UI doesn't show an error
    );
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
