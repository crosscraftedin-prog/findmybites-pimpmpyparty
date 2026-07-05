import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getZAI } from "@/lib/zai-server";
import { sanitizePrompt, callWithTimeout } from "@/lib/ai/security";
import { logger } from "@/lib/logger";
import { JOSH_SYSTEM_PROMPT_V4 } from "@/lib/josh-system-prompt-v4";
import { parseJsonArray } from "@/lib/format";
import {
  DEFAULT_STATE,
  extractFromMessage,
  mergeState,
  getMissingSlots,
  type ConversationState,
} from "@/lib/conversation-state";
import {
  ConversationAction,
  computeConversationAction,
  didFiltersJustChange,
  requiresLLM as actionRequiresLLM,
} from "@/lib/josh/conversation-action";
import {
  searchVendors,
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
import {
  getOrCreateConversation,
  saveConversation as storeSaveConversation,
  updateConversationSummary,
  verifySavedState,
  getConversationHistory,
  type StoredConversation,
} from "@/lib/josh/conversation-store";

/**
 * POST /api/josh/chat — Josh AI V4 Production (Backend-Controlled Conversation Engine)
 *
 * ROOT CAUSE FIX: ConversationState now persists across requests via a hybrid
 * store (DB + in-memory fallback). Previously, when the DB was unavailable,
 * each request started with DEFAULT_STATE and the conversation never progressed.
 *
 * Architecture:
 *   ConversationState (loaded from hybrid store)
 *     -> Backend computes Action (deterministic)
 *     -> Backend performs marketplace search
 *     -> Deterministic response OR LLM verbalizes
 *     -> Save ConversationState to hybrid store
 *     -> Return structured JSON
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
  userType?: "customer" | "vendor" | "admin";
  vendorId?: string;
  vendorContext?: {
    vendorId: string;
    vendorName: string;
    vendorCategory: string;
    vendorCity: string;
  };
}

const FALLBACK_RESPONSE =
  "I'm here to help! Tell me your city and what you need — cake, catering, DJ, photographer, decorator — and I'll find the best vendors for you.";

// ── Vendor profile context (for vendor users) ─────────────────────────────

function buildVendorProfileContext(vendor: any): string {
  if (!vendor) return "";
  const gallery = parseJsonArray<string>(vendor.gallery);
  const tags = parseJsonArray<string>(vendor.tags);
  const photos = gallery.length;
  const checks = [
    vendor.heroImage ? "Has hero image" : "Missing hero image",
    photos >= 5 ? `Gallery (${photos} photos)` : `Gallery only ${photos} photos`,
    vendor.description?.length > 50 ? "Has description" : "Missing description",
    vendor.basePrice > 0 ? "Has pricing" : "Missing pricing",
    vendor.whatsapp ? "Has WhatsApp" : "Missing WhatsApp",
    tags.length > 0 ? `Tags (${tags.length})` : "Missing tags",
  ];
  return `\n\n## VENDOR PROFILE\nName: ${vendor.name}\nCategory: ${vendor.category}\nCity: ${vendor.city}, ${vendor.country}\nRating: ${vendor.rating} (${vendor.reviewCount} reviews)\nChecks: ${checks.join(" | ")}\nDescription: ${vendor.description?.slice(0, 300) ?? "(empty)"}`;
}

async function buildStorefrontContext(vendorId: string): Promise<string> {
  try {
    const storeVendor = await db.vendor.findUnique({
      where: { id: vendorId },
      include: { products: { where: { isAvailable: true }, take: 20, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }] } },
    });
    if (!storeVendor) return "";
    const symbol = storeVendor.currency === "INR" ? "₹" : storeVendor.currency === "USD" ? "$" : storeVendor.currency === "GBP" ? "£" : storeVendor.currency === "AED" ? "AED" : storeVendor.currency + " ";
    const productList = storeVendor.products.map((p) => `  - ${p.name} — ${symbol}${p.price}${p.description ? ` (${p.description.slice(0, 80)})` : ""}`).join("\n");
    return `\n\n## STOREFRONT CONTEXT\nCustomer viewing: ${storeVendor.name} (${storeVendor.city}, ${storeVendor.country})\nCategory: ${storeVendor.category}\nRating: ${storeVendor.rating}/5 (${storeVendor.reviewCount} reviews)\nProducts:\n${productList || "  (none)"}`;
  } catch {
    return "";
  }
}

// ── Main handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const requestId = `josh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();
  console.log(`[josh/v4] ${requestId} ═══════════════════════════════════════════════════`);
  console.log(`[josh/v4] ${requestId} POST called`);

  try {
    const body = (await req.json()) as RequestBody;
    const { message, conversationId, userId, userEmail, userType = "customer", vendorId } = body;

    if (!message || !userId) {
      return NextResponse.json({ error: "Missing message or userId" }, { status: 400 });
    }

    // ── Prompt injection check on user message ──
    const sanitizeResult = sanitizePrompt(message);
    if (sanitizeResult.blocked) {
      logger.warn("josh-chat", "Prompt injection blocked", { reason: sanitizeResult.reason, userId });
      return NextResponse.json({ error: "Message rejected by security filter" }, { status: 400 });
    }
    const safeMessage = sanitizeResult.sanitized;

    // ── STEP 1: Load or create conversation (DATABASE-ONLY, no memory fallback) ──
    // The database (PostgreSQL) is the single source of truth.
    // If the DB is unavailable, errors are logged and re-thrown — never swallowed.
    const { conversation, created } = await getOrCreateConversation({
      conversationId: conversationId ?? null,
      userId,
      userEmail: userEmail ?? null,
      userType,
      vendorId: vendorId ?? null,
    });

    console.log(`[josh/v4] ${requestId} STEP 1 — INCOMING REQUEST`);
    console.log(`[josh/v4] ${requestId}   message        = ${JSON.stringify(message.slice(0, 80))}`);
    console.log(`[josh/v4] ${requestId}   conversationId = ${JSON.stringify(conversationId)}`);
    console.log(`[josh/v4] ${requestId}   userId         = ${JSON.stringify(userId)}`);
    console.log(`[josh/v4] ${requestId}   userType       = ${JSON.stringify(userType)}`);
    console.log(`[josh/v4] ${requestId}   conversation   = ${conversation?.id ?? "null"} (created: ${created})`);

    // ── STEP 2: Build message history ───────────────────────────────────
    const history: ChatMessage[] = conversation?.messages
      ? (conversation.messages as unknown as ChatMessage[])
      : [];
    const trimmedHistory = history.slice(-20);
    const newMessages: ChatMessage[] = [
      ...trimmedHistory,
      { role: "user", content: safeMessage, timestamp: new Date().toISOString() },
    ];
    console.log(`[josh/v4] ${requestId}   history length = ${trimmedHistory.length} | total = ${newMessages.length}`);

    // ── STEP 2: Load ConversationState from the store ───────────────────
    let convState: ConversationState = { ...DEFAULT_STATE };

    // Set conversation mode
    if (userType === "vendor") convState.conversationMode = "VENDOR";
    else if (userType === "admin") convState.conversationMode = "ADMIN";
    else if (body.vendorContext?.vendorId) {
      convState.conversationMode = "STOREFRONT";
      convState.storefrontVendorId = body.vendorContext.vendorId;
    }

    // Load existing state from the database (single source of truth)
    if (conversation?.state) {
      convState = { ...DEFAULT_STATE, ...conversation.state };
      // Re-apply conversation mode from request body
      if (userType === "vendor") convState.conversationMode = "VENDOR";
      else if (userType === "admin") convState.conversationMode = "ADMIN";
      else if (body.vendorContext?.vendorId) {
        convState.conversationMode = "STOREFRONT";
        convState.storefrontVendorId = body.vendorContext.vendorId;
      }
    }

    console.log(`[josh/v4] ${requestId} STEP 2 — LOADED CONVERSATIONSTATE`);
    console.log(`[josh/v4] ${requestId}   ${JSON.stringify({ category: convState.category, subcategory: convState.subcategory, city: convState.city, eventType: convState.eventType, budget: convState.budget, guestCount: convState.guestCount, dietaryRequirements: convState.dietaryRequirements, messageCount: convState.messageCount, conversationMode: convState.conversationMode })}`);

    // Snapshot state BEFORE merge (for filter-change detection)
    const stateBeforeMerge: ConversationState = { ...convState };

    // ── STEP 3: Extract from current message ONLY ───────────────────────
    // Never reparse the entire conversation history — ConversationState is the source of truth.
    const newExtracted = extractFromMessage(message);
    console.log(`[josh/v4] ${requestId} STEP 3 — EXTRACTED FROM CURRENT MESSAGE`);
    console.log(`[josh/v4] ${requestId}   extractFromMessage(${JSON.stringify(message.slice(0, 60))}) = ${JSON.stringify(newExtracted)}`);

    // ── STEP 4: Merge — only updates fields present in the current message ──
    // Never erases existing values unless the user explicitly changes them.
    convState = mergeState(convState, newExtracted);

    console.log(`[josh/v4] ${requestId} STEP 4 — MERGED CONVERSATIONSTATE`);
    console.log(`[josh/v4] ${requestId}   ${JSON.stringify({ category: convState.category, subcategory: convState.subcategory, city: convState.city, eventType: convState.eventType, budget: convState.budget, guestCount: convState.guestCount, dietaryRequirements: convState.dietaryRequirements, messageCount: convState.messageCount, conversationMode: convState.conversationMode })}`);

    // ── STEP 5: Calculate missing slots ─────────────────────────────────
    const missingSlots = getMissingSlots(convState);
    console.log(`[josh/v4] ${requestId} STEP 5 — MISSING SLOTS`);
    console.log(`[josh/v4] ${requestId}   missingSlots = ${JSON.stringify(missingSlots)}`);
    console.log(`[josh/v4] ${requestId}   category exists = ${convState.category ? "YES" : "NO"} | city exists = ${convState.city ? "YES" : "NO"}`);

    // ── STEP 6: Backend performs marketplace search (BEFORE any LLM) ────
    // The LLM never searches. Vendor search never depends on AI output.
    const searchResult = await searchVendors(convState, 10);
    const vendors: JoshVendor[] = searchResult.vendors;
    const products: JoshProduct[] = searchResult.products;
    const filters: JoshFilterSummary[] = searchResult.filters;

    console.log(`[josh/v4] ${requestId} STEP 6 — VENDOR SEARCH`);
    console.log(`[josh/v4] ${requestId}   vendorCount = ${vendors.length} | productCount = ${products.length} | filters = ${JSON.stringify(filters)}`);

    // ── STEP 7: Compute the Action (deterministic) ──────────────────────
    const filtersJustChanged = didFiltersJustChange(newExtracted, stateBeforeMerge);
    const action = computeConversationAction({
      state: convState,
      vendorCount: vendors.length,
      filtersJustChanged,
    });

    // Build structured cards + suggestions from backend search
    const cards = buildVendorCards(vendors, convState);
    const suggestions = buildSuggestions(action, convState);

    console.log(`[josh/v4] ${requestId} STEP 7 — COMPUTED ACTION`);
    console.log(`[josh/v4] ${requestId}   action = ${action} | requiresLLM = ${actionRequiresLLM(action)} | filtersJustChanged = ${filtersJustChanged} | cardCount = ${cards.length}`);

    // ── STEP 8: Generate response ───────────────────────────────────────
    // Deterministic actions NEVER call the LLM. LLM only for VENDOR_MODE / ADMIN_MODE / STOREFRONT_MODE / GENERAL_CHAT.
    let assistantMessage: string;
    let llmLatency = 0;
    let tokenUsage: any = undefined;
    let usedFallback = false;
    let didCallLLM = false;
    let promptSize = 0;

    if (!actionRequiresLLM(action)) {
      // Deterministic path — NO LLM call
      assistantMessage = deterministicResponse(action, convState, vendors, products);
      console.log(`[josh/v4] ${requestId} STEP 8 — DETERMINISTIC RESPONSE (no LLM)`);
      console.log(`[josh/v4] ${requestId}   response = ${JSON.stringify(assistantMessage.slice(0, 120))}`);
    } else {
      // LLM path
      didCallLLM = true;
      const payload = buildLLMPayload({ action, state: convState, vendors, products, filters });
      const payloadSection = buildLLMPayloadSection(payload);

      let extraContext = "";
      if (userType === "vendor" && vendorId) {
        try {
          const ownVendor = await db.vendor.findUnique({ where: { id: vendorId } });
          if (ownVendor) extraContext = buildVendorProfileContext(ownVendor);
        } catch (e) {
          console.error(`[josh/v4] ${requestId} vendor profile fetch failed:`, (e as Error)?.message?.slice(0, 150));
        }
      }
      if (userType === "customer" && body.vendorContext?.vendorId) {
        extraContext = await buildStorefrontContext(body.vendorContext.vendorId);
      }

      const systemPrompt = JOSH_SYSTEM_PROMPT_V4 + extraContext + payloadSection;
      promptSize = systemPrompt.length;
      console.log(`[josh/v4] ${requestId} STEP 8 — LLM PATH | promptSize=${promptSize}`);

      const zai = await getZAI();
      if (!zai) {
        assistantMessage = deterministicResponse(action, convState, vendors, products);
        usedFallback = true;
      } else {
        const llmMessages = [
          { role: "assistant" as const, content: systemPrompt },
          ...newMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        ];
        const llmStart = Date.now();
        try {
          // ── 30-second timeout ──
          const { result: completion, timedOut } = await callWithTimeout(async (_signal) => {
            return zai.chat.completions.create({ messages: llmMessages, thinking: { type: "disabled" } });
          }, 30_000);
          llmLatency = Date.now() - llmStart;
          if (timedOut) {
            logger.warn("josh-chat", "LLM call timed out after 30s", { requestId });
            assistantMessage = deterministicResponse(action, convState, vendors, products);
            usedFallback = true;
          } else {
            tokenUsage = completion?.usage;
            assistantMessage = completion?.choices[0]?.message?.content || deterministicResponse(action, convState, vendors, products);
            console.log(`[josh/v4] ${requestId}   LLM response (${llmLatency}ms, tokens=${tokenUsage?.total_tokens ?? "?"}): ${assistantMessage.slice(0, 120)}`);
          }
        } catch (llmErr) {
          llmLatency = Date.now() - llmStart;
          console.error(`[josh/v4] ${requestId}   LLM FAILED (${llmLatency}ms): ${(llmErr as Error)?.message?.slice(0, 200)}`);
          assistantMessage = deterministicResponse(action, convState, vendors, products);
          usedFallback = true;
        }
      }
    }

    // ── STEP 9: Save ConversationState to PostgreSQL (DATABASE-ONLY) ───
    const savedMessages: ChatMessage[] = [
      ...newMessages,
      { role: "assistant", content: assistantMessage, timestamp: new Date().toISOString() },
    ];
    let saveResult = { saved: false };
    if (conversation) {
      try {
        saveResult = await storeSaveConversation(conversation, savedMessages, convState);
      } catch (saveErr) {
        // DB save failed — log with full detail and re-throw (do NOT swallow)
        console.error(`[josh/v4] ${requestId} STEP 9 — SAVE FAILED (DB error):`, (saveErr as Error)?.message?.slice(0, 200));
        throw saveErr;
      }
    }

    console.log(`[josh/v4] ${requestId} STEP 9 — SAVED CONVERSATIONSTATE`);
    console.log(`[josh/v4] ${requestId}   saved = ${saveResult.saved} | conversationId = ${conversation?.id ?? "null"}`);
    console.log(`[josh/v4] ${requestId}   saved state = ${JSON.stringify({ category: convState.category, city: convState.city, eventType: convState.eventType, budget: convState.budget, dietaryRequirements: convState.dietaryRequirements, messageCount: convState.messageCount })}`);

    // ── STEP 9b: READ-BACK VERIFICATION ────────────────────────────────
    // Immediately read the saved state back from PostgreSQL and verify it matches.
    // If verification fails, throw an error (Step 4 requirement).
    let verificationPassed = false;
    let reloadedState: ConversationState | null = null;
    if (conversation && saveResult.saved) {
      const verify = await verifySavedState(conversation.id, convState);
      verificationPassed = verify.verified;
      reloadedState = verify.reloadedState;
      console.log(`[josh/v4] ${requestId} STEP 9b — READ-BACK VERIFICATION`);
      console.log(`[josh/v4] ${requestId}   verificationPassed = ${verificationPassed}`);
      console.log(`[josh/v4] ${requestId}   reloaded state = ${JSON.stringify({ category: reloadedState?.category, city: reloadedState?.city, eventType: reloadedState?.eventType, budget: reloadedState?.budget, dietaryRequirements: reloadedState?.dietaryRequirements, messageCount: reloadedState?.messageCount })}`);
      if (!verificationPassed) {
        console.error(`[josh/v4] ${requestId} VERIFICATION FAILED — saved state does not match expected state`);
        throw new Error(`ConversationState verification failed for conversation ${conversation.id}`);
      }
    }

    // ── STEP 10: Generate summary if conversation is long (best-effort) ──
    if (savedMessages.length >= 10 && conversation && !conversation.conversationSummary) {
      const zaiForSummary = await getZAI();
      if (zaiForSummary) {
        try {
          // ── 30-second timeout ──
          const { result: summaryRes, timedOut: summaryTimedOut } = await callWithTimeout(async (_signal) => {
            return zaiForSummary.chat.completions.create({
              messages: [
                { role: "assistant", content: "Summarize this conversation in 2-3 sentences:" },
                ...savedMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
              ],
              thinking: { type: "disabled" },
            });
          }, 30_000);
          if (summaryTimedOut) {
            logger.warn("josh-chat", "Summary LLM call timed out after 30s", { requestId });
          }
          const summary = summaryRes?.choices[0]?.message?.content;
          if (summary && conversation) {
            await updateConversationSummary(conversation, summary);
          }
        } catch {}
      }
    }

    // ── STEP 11: Return structured JSON ─────────────────────────────────
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
    console.log(`[josh/v4] ${requestId} DONE | action=${action} requiresLLM=${didCallLLM} vendorCount=${vendors.length} cardCount=${cards.length} missingSlots=${JSON.stringify(missingSlots)} llmLatency=${llmLatency}ms totalLatency=${totalLatency}ms tokens=${tokenUsage?.total_tokens ?? "n/a"} fallback=${usedFallback} saved=${saveResult.saved} verified=${verificationPassed}`);
    console.log(`[josh/v4] ${requestId} ═══════════════════════════════════════════════════`);

    return NextResponse.json(response);
  } catch (err) {
    const totalLatency = Date.now() - startTime;
    const errMsg = (err as Error)?.message ?? String(err);
    const errName = (err as Error)?.name ?? "Error";
    console.error(`[josh/v4] ${requestId} POST FAILED (${totalLatency}ms):`, errName, errMsg.slice(0, 300));

    // PRODUCTION REQUIREMENT: Do NOT silently fall back to a new conversation
    // when the database is unreachable. Return an explicit error so the
    // client knows persistence failed and can retry or surface the issue.
    //
    // Detect database connection errors (Prisma P1001 = can't reach server,
    // PrismaClientInitializationError = protocol/config error).
    const isDbError =
      errName === "PrismaClientInitializationError" ||
      errMsg.includes("Can't reach database server") ||
      errMsg.includes("must start with the protocol") ||
      errMsg.includes("Error validating datasource") ||
      errMsg.includes("verification failed");

    if (isDbError) {
      console.error(`[josh/v4] ${requestId} DATABASE UNREACHABLE — returning explicit error (no silent fallback)`);
      return NextResponse.json(
        {
          error: "DATABASE_UNREACHABLE",
          message: "Josh AI cannot reach the conversation database. Conversation state was not persisted. Please retry in a moment.",
          action: "DB_ERROR",
          requiresLLM: false,
        },
        { status: 503 }
      );
    }

    // For non-DB errors (LLM failures, etc.), return a graceful fallback
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

// ── Deterministic backend response (used for marketplace actions, no LLM) ──

function deterministicResponse(
  action: ConversationAction,
  state: ConversationState,
  vendors: JoshVendor[],
  products: JoshProduct[]
): string {
  switch (action) {
    case ConversationAction.STATE_NEED: {
      if (state.messageCount > 1) {
        return "What type of vendor are you looking for? For example: cake, DJ, photographer, decorator";
      }
      return "Hey there! What are you planning — a wedding, birthday, or something else? Tell me what you need and I'll find the best vendors.";
    }
    case ConversationAction.ASK_CITY: {
      return state.eventType
        ? `Which city is your ${state.eventType.toLowerCase()} in?`
        : "Which city are you in?";
    }
    case ConversationAction.ASK_CATEGORY: {
      return `What type of service are you looking for in ${state.city}? For example: cake, DJ, photographer, decorator`;
    }
    case ConversationAction.SEARCH_VENDORS: {
      const catLabel = state.category
        ? state.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "vendors";
      const n = vendors.length;
      return state.eventType
        ? `Here are the top ${n} ${catLabel.toLowerCase()} for your ${state.eventType.toLowerCase()} in ${state.city}`
        : `Here are the top ${n} ${catLabel.toLowerCase()} in ${state.city}`;
    }
    case ConversationAction.REFINE_RESULTS: {
      if (vendors.length === 0) {
        return `I've applied your filters, but no vendors matched in ${state.city}. Try a nearby city or a broader category.`;
      }
      const catLabel = state.category
        ? state.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "vendors";
      return `I've narrowed the list to ${vendors.length} ${catLabel.toLowerCase()} in ${state.city} based on your preferences`;
    }
    case ConversationAction.NO_RESULTS: {
      return `I couldn't find vendors matching those filters in ${state.city}. Try a nearby city, a broader category, or remove a filter — I'm happy to search again!`;
    }
    case ConversationAction.VENDOR_MODE: {
      return "I'd love to help you improve your listing! Add professional photos, complete your price guide, write a detailed description, and link your WhatsApp. For detailed help, email hello@findmybites.party";
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

// ── GET: fetch conversation history (for restoring on page reload) ────────

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const userId = sp.get("userId");
    const conversationId = sp.get("conversationId");

    if (!userId && !conversationId) {
      return NextResponse.json({ error: "userId or conversationId required" }, { status: 400 });
    }

    const result = await getConversationHistory({
      conversationId: conversationId ?? null,
      userId: userId ?? null,
    });

    return NextResponse.json({
      conversationId: result.conversationId,
      messages: result.messages,
      conversationSummary: result.conversationSummary,
    });
  } catch (err) {
    console.error("[api/josh/chat] GET failed:", err);
    return NextResponse.json({ messages: [], conversationId: null });
  }
}
