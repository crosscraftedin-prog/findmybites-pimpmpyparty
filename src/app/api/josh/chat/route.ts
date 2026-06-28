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

// ── Main handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
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
      }
    } catch {
      // DB unavailable (e.g. table not created yet) — continue without persistence
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
    let vendorContext = "";
    let vendorProfileContext = "";
    try {
      // Top vendors for customer recommendations
      const topVendors = await db.vendor.findMany({
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
    } catch {
      // DB unavailable — continue without vendor context
    }

    // ── 4. Call ZAI (GLM) with full context ──────────────────────────────
    const zai = await getZAI();

    if (!zai) {
      // AI unavailable — return graceful fallback
      const fallbackMsg =
        userType === "vendor"
          ? "I'd love to help you improve your listing! 🎉 Try adding more photos, completing your price guide, and linking your social media. For detailed help, email hello@findmybites.party."
          : FALLBACK_RESPONSE;

      // Save fallback to conversation
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
