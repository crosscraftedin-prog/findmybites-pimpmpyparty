import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { JOSH_SYSTEM_PROMPT_V4 } from "@/lib/josh-system-prompt-v4";
import { parseJsonArray } from "@/lib/format";
import {
  DEFAULT_STATE,
  extractFromMessage,
  mergeState,
  type ConversationState,
} from "@/lib/conversation-state";
import {
  ConversationAction,
  computeConversationAction,
  didFiltersJustChange,
  getActionInstructions,
  requiresLLM as actionRequiresLLM,
} from "@/lib/josh/conversation-action";
import {
  searchVendors,
  buildFilterSummary,
  type JoshVendor,
  type JoshProduct,
  type JoshFilterSummary,
} from "@/lib/josh/josh-search";
import {
  buildLLMPayload,
  buildLLMPayloadSection,
  buildVendorCards,
  buildSuggestions,
  type JoshChatResponse,
} from "@/lib/josh/josh-llm-payload";

/**
 * POST /api/josh/chat  —  Josh AI V4 (Backend-Controlled Conversation Engine)
 *
 * Architecture:
 *   ConversationState
 *     ↓
 *   Backend computes Action (computeConversationAction)
 *     ↓
 *   Backend performs marketplace search (searchVendors)
 *     ↓
 *   Prompt = Action + State + Vendors + Products + Filters + Instructions
 *     ↓
 *   LLM verbalizes ONLY
 *     ↓
 *   Save Conversation + return structured JSON
 *
 * The LLM NEVER decides: what question to ask, whether to recommend vendors,
 * whether to continue, or what state the conversation is in.
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

// ── Vendor profile context (for vendor users) ─────────────────────────────

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

// ── Storefront context (customer browsing a specific vendor) ───────────────

async function buildStorefrontContext(vendorId: string): Promise<string> {
  try {
    const storeVendor = await db.vendor.findUnique({
      where: { id: vendorId },
      include: {
        products: {
          where: { isAvailable: true },
          take: 20,
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        },
      },
    });
    if (!storeVendor) return "";
    const symbol = storeVendor.currency === "INR" ? "₹" : storeVendor.currency === "USD" ? "$" : storeVendor.currency === "GBP" ? "£" : storeVendor.currency === "AED" ? "AED" : storeVendor.currency + " ";
    const productList = storeVendor.products
      .map((p) => `  • ${p.name} — ${symbol}${p.price}${p.description ? ` (${p.description.slice(0, 80)})` : ""}`)
      .join("\n");
    return `\n\n## CURRENT VENDOR STOREFRONT CONTEXT\nThe customer is currently viewing **${storeVendor.name}** (${storeVendor.city}, ${storeVendor.country}).\nCategory: ${storeVendor.category}\nRating: ${storeVendor.rating}/5 (${storeVendor.reviewCount} reviews)\nDelivery: ${storeVendor.deliveryAvailable ? "Yes" : "No"} | Pickup: ${storeVendor.pickupAvailable ? "Yes" : "No"}\nResponse time: ${storeVendor.responseTime}\n\nProducts/Services offered:\n${productList || "  (no products listed yet)"}\n\nAnswer the customer's questions about THIS specific vendor. Be helpful and specific to their offerings.`;
  } catch {
    return "";
  }
}

// ── Main handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const requestId = `josh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();
  console.log(`[josh/v4] ═══════════════════════════════════════════════════`);
  console.log(`[josh/v4] ${requestId} POST called`);

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

    console.log(`[josh/v4] ${requestId} message=${JSON.stringify(message?.slice(0, 80))} userId=${userId} userType=${userType}`);

    if (!message || !userId) {
      console.log(`[josh/v4] ${requestId} RETURN — missing message/userId (400)`);
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
        console.log(`[josh/v4] ${requestId} Created conversation: ${conversation.id}`);
      }
    } catch (e) {
      console.log(`[josh/v4] ${requestId} Conversation persistence skipped (DB unavailable): ${(e as Error)?.message?.slice(0, 100)}`);
    }

    // ── 2. Build message history ─────────────────────────────────────────
    const history: ChatMessage[] = conversation?.messages
      ? (conversation.messages as unknown as ChatMessage[])
      : [];
    const trimmedHistory = history.slice(-20);
    const newMessages: ChatMessage[] = [
      ...trimmedHistory,
      { role: "user", content: message, timestamp: new Date().toISOString() },
    ];
    console.log(`[josh/v4] ${requestId} conversationId=${conversation?.id ?? "none"} history=${trimmedHistory.length} promptVersion=v4`);

    // ── 3. Load + update ConversationState ───────────────────────────────
    let convState: ConversationState = { ...DEFAULT_STATE };

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

    // One-time migration: if there's history but no state, extract from history
    if (trimmedHistory.length > 0 && (!conversation?.state || Object.keys(convState).length <= 2)) {
      console.log(`[josh/v4] ${requestId} Migrating: extracting state from history`);
      for (const msg of trimmedHistory) {
        if (msg.role === "user") {
          const extracted = extractFromMessage(msg.content);
          convState = mergeState(convState, extracted);
        }
      }
    }

    // Snapshot the state BEFORE merging the current message (needed for filter-change detection)
    const stateBeforeMerge: ConversationState = { ...convState };

    // Extract NEW info from the CURRENT message
    const newExtracted = extractFromMessage(message);
    console.log(`[josh/v4] ${requestId} extractFromMessage()=${JSON.stringify(newExtracted)}`);
    console.log(`[josh/v4] ${requestId} state BEFORE merge=${JSON.stringify({ category: convState.category, city: convState.city, eventType: convState.eventType, budget: convState.budget, dietary: convState.dietaryRequirements })}`);

    // Merge
    convState = mergeState(convState, newExtracted);

    console.log(`[josh/v4] ${requestId} state AFTER merge=${JSON.stringify({ category: convState.category, city: convState.city, eventType: convState.eventType, budget: convState.budget, dietary: convState.dietaryRequirements, messageCount: convState.messageCount })}`);

    // ── 4. Backend computes the Action (deterministic) ───────────────────
    const filtersJustChanged = didFiltersJustChange(newExtracted, stateBeforeMerge);

    // We need vendorCount to compute the action, so search FIRST.
    // ── 5. Backend performs the marketplace search (BEFORE any LLM call) ─
    // The LLM never searches. Vendor search never depends on AI output.
    const searchResult = await searchVendors(convState, 10);
    const vendors: JoshVendor[] = searchResult.vendors;
    const products: JoshProduct[] = searchResult.products;
    const filters: JoshFilterSummary[] = searchResult.filters;

    const action = computeConversationAction({
      state: convState,
      vendorCount: vendors.length,
      filtersJustChanged,
    });

    // Build the structured cards + suggestions directly from backend search.
    // The frontend renders these without parsing AI text.
    const cards = buildVendorCards(vendors, convState);
    const suggestions = buildSuggestions(action, convState);

    console.log(`[josh/v4] ${requestId} filtersJustChanged=${filtersJustChanged} vendorCount=${vendors.length} productCount=${products.length} cardCount=${cards.length}`);
    console.log(`[josh/v4] ${requestId} >>> COMPUTED ACTION: ${action} | requiresLLM=${actionRequiresLLM(action)}`);

    // ── 6. Generate the response ─────────────────────────────────────────
    // Deterministic actions (ASK_CITY, ASK_CATEGORY, NO_RESULTS,
    // SEARCH_VENDORS, REFINE_RESULTS, STATE_NEED) NEVER call the LLM.
    // The backend generates the message + structured cards directly.
    // Only LLM-required actions (GENERAL_CHAT, VENDOR_MODE, ADMIN_MODE,
    // STOREFRONT_MODE) invoke the LLM.
    let assistantMessage: string;
    let llmLatency = 0;
    let tokenUsage: any = undefined;
    let usedFallback = false;
    let didCallLLM = false;
    let promptSize = 0;

    if (!actionRequiresLLM(action)) {
      // ── 6a. Deterministic path — NO LLM call ──
      // Marketplace conversations work correctly even if the LLM is offline.
      assistantMessage = deterministicResponse(action, convState, vendors, products);
      console.log(`[josh/v4] ${requestId} DETERMINISTIC response (no LLM): ${assistantMessage.slice(0, 100)}`);
    } else {
      // ── 6b. LLM path — only for GENERAL_CHAT / VENDOR_MODE / ADMIN_MODE / STOREFRONT_MODE ──
      didCallLLM = true;

      // Build the structured LLM payload
      const payload = buildLLMPayload({
        action,
        state: convState,
        vendors,
        products,
        filters,
      });
      const payloadSection = buildLLMPayloadSection(payload);

      // Build extra context (vendor profile for vendor mode, storefront for storefront mode)
      let extraContext = "";
      if (userType === "vendor" && vendorId) {
        try {
          const ownVendor = await db.vendor.findUnique({ where: { id: vendorId } });
          if (ownVendor) extraContext = buildVendorProfileContext(ownVendor);
        } catch {}
      }
      if (userType === "customer" && body.vendorContext?.vendorId) {
        extraContext = await buildStorefrontContext(body.vendorContext.vendorId);
      }

      const systemPrompt = JOSH_SYSTEM_PROMPT_V4 + extraContext + payloadSection;
      promptSize = systemPrompt.length;
      console.log(`[josh/v4] ${requestId} promptSize=${promptSize} (systemPrompt=${JOSH_SYSTEM_PROMPT_V4.length} extraContext=${extraContext.length} payload=${payloadSection.length})`);

      const zai = await getZAI();
      console.log(`[josh/v4] ${requestId} ZAI available=${!!zai}`);

      if (!zai) {
        console.log(`[josh/v4] ${requestId} AI unavailable for LLM action — using deterministic fallback`);
        assistantMessage = deterministicResponse(action, convState, vendors, products);
        usedFallback = true;
      } else {
        const llmMessages = [
          { role: "assistant" as const, content: systemPrompt },
          ...newMessages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ];

        const llmStart = Date.now();
        try {
          const completion = await zai.chat.completions.create({
            messages: llmMessages,
            thinking: { type: "disabled" },
          });
          llmLatency = Date.now() - llmStart;
          tokenUsage = completion.usage;
          assistantMessage = completion.choices[0]?.message?.content || deterministicResponse(action, convState, vendors, products);
          console.log(`[josh/v4] ${requestId} LLM response (${llmLatency}ms, tokens=${tokenUsage?.total_tokens ?? "unknown"}): ${assistantMessage.slice(0, 120)}`);
        } catch (llmErr) {
          llmLatency = Date.now() - llmStart;
          console.error(`[josh/v4] ${requestId} LLM call FAILED after ${llmLatency}ms:`, (llmErr as Error)?.message?.slice(0, 200));
          // Fall back to deterministic response — the conversation still flows correctly
          assistantMessage = deterministicResponse(action, convState, vendors, products);
          usedFallback = true;
        }
      }
    }

    // ── 7. Save conversation to DB ───────────────────────────────────────
    const savedMessages: ChatMessage[] = [
      ...newMessages,
      { role: "assistant", content: assistantMessage, timestamp: new Date().toISOString() },
    ];
    await saveConversationWithState(conversation, savedMessages, convState);

    // ── 8. Generate summary if conversation is getting long (LLM-only, best-effort) ─
    if (savedMessages.length >= 10 && !conversation?.conversationSummary) {
      const zaiForSummary = await getZAI();
      if (zaiForSummary) {
        try {
          const summaryRes = await zaiForSummary.chat.completions.create({
            messages: [
              { role: "assistant", content: "Summarize this conversation in 2-3 sentences (key needs, preferences, vendors discussed):" },
              ...savedMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
            ],
            thinking: { type: "disabled" },
          });
          const summary = summaryRes.choices[0]?.message?.content;
          if (summary && conversation) {
            await db.joshConversation.update({
              where: { id: conversation.id },
              data: { conversationSummary: summary },
            }).catch(() => {});
          }
        } catch {
          // summary is nice-to-have
        }
      }
    }

    // ── 9. Return structured JSON ────────────────────────────────────────
    // The frontend renders UI from `cards`, `vendors`, `suggestions`, and
    // `action` — it NEVER parses JSON from the `message` text.
    const response: JoshChatResponse = {
      conversationId: conversation?.id ?? null,
      message: assistantMessage,
      action,
      conversationState: convState,
      vendors,
      cards,
      products,
      filters,
      suggestions,
      requiresLLM: didCallLLM,
      usage: tokenUsage,
      ...(usedFallback ? { fallback: true } : {}),
    };

    const totalLatency = Date.now() - startTime;
    console.log(`[josh/v4] ${requestId} DONE action=${action} requiresLLM=${didCallLLM} vendorCount=${vendors.length} cardCount=${cards.length} productCount=${products.length} promptSize=${promptSize} llmLatency=${llmLatency}ms totalLatency=${totalLatency}ms tokens=${tokenUsage?.total_tokens ?? "n/a"} fallback=${usedFallback}`);
    console.log(`[josh/v4] ═══════════════════════════════════════════════════`);

    return NextResponse.json(response);
  } catch (err) {
    const totalLatency = Date.now() - startTime;
    console.error(`[josh/v4] ${requestId} POST FAILED after ${totalLatency}ms:`, err);
    // Last-resort graceful response — never leave the user hanging
    const response: JoshChatResponse = {
      conversationId: null,
      message: FALLBACK_RESPONSE,
      action: ConversationAction.GENERAL_CHAT,
      conversationState: { ...DEFAULT_STATE },
      vendors: [],
      cards: [],
      products: [],
      filters: [],
      suggestions: [],
      requiresLLM: false,
      fallback: true,
    };
    return NextResponse.json(response);
  }
}

// ── Deterministic backend response (used when LLM is unavailable) ─────────
// This is the key V4 guarantee: even without AI, the conversation follows
// the correct flow because the backend owns the action.

function deterministicResponse(
  action: ConversationAction,
  state: ConversationState,
  vendors: JoshVendor[],
  products: JoshProduct[]
): string {
  switch (action) {
    case ConversationAction.STATE_NEED: {
      if (state.messageCount > 1) {
        return "What type of vendor are you looking for? For example: cake, DJ, photographer, decorator 🎉";
      }
      return "Hey there! 🎉 What are you planning — a wedding, birthday, or something else? Tell me what you need and I'll find the best vendors.";
    }
    case ConversationAction.ASK_CITY: {
      return state.eventType
        ? `Which city is your ${state.eventType.toLowerCase()} in?`
        : "Which city are you in?";
    }
    case ConversationAction.ASK_CATEGORY: {
      return `What type of service are you looking for in ${state.city}? For example: cake, DJ, photographer, decorator 🎉`;
    }
    case ConversationAction.SEARCH_VENDORS: {
      // The structured `cards` array carries the vendor data. The message is
      // pure natural language that introduces them — NO embedded JSON.
      const catLabel = state.category
        ? state.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "vendors";
      const n = vendors.length;
      return state.eventType
        ? `Here are the top ${n} ${catLabel.toLowerCase()} for your ${state.eventType.toLowerCase()} in ${state.city} 🎉`
        : `Here are the top ${n} ${catLabel.toLowerCase()} in ${state.city} 🎉`;
    }
    case ConversationAction.REFINE_RESULTS: {
      if (vendors.length === 0) {
        return `I've applied your filters, but no vendors matched in ${state.city}. Try a nearby city or a broader category.`;
      }
      // Pure natural language — the structured cards carry the vendor data.
      const catLabel = state.category
        ? state.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "vendors";
      return `I've narrowed the list to ${vendors.length} ${catLabel.toLowerCase()} in ${state.city} based on your preferences 🎉`;
    }
    case ConversationAction.NO_RESULTS: {
      return `I couldn't find vendors matching those filters in ${state.city}. Try a nearby city, a broader category, or remove a filter — I'm happy to search again! 🎉`;
    }
    case ConversationAction.VENDOR_MODE: {
      return "I'd love to help you improve your listing! 🎉 Add professional photos, complete your price guide, write a detailed description, and link your WhatsApp. For detailed help, email hello@findmybites.party";
    }
    case ConversationAction.ADMIN_MODE: {
      return "I can help with marketplace insights — vendor counts, trending categories, popular cities, and top-rated vendors. What would you like to see?";
    }
    case ConversationAction.STOREFRONT_MODE: {
      return "I can answer questions about this vendor's products, pricing, and availability. What would you like to know?";
    }
    case ConversationAction.GENERAL_CHAT:
    default: {
      return FALLBACK_RESPONSE;
    }
  }
}

// ── Helper: save conversation with state (graceful on DB error) ────────────

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
