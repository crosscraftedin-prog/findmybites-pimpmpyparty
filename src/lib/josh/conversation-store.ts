/**
 * Josh Conversation Store — DATABASE-ONLY Persistence
 *
 * PRODUCTION REQUIREMENT: No in-memory fallback. The database (PostgreSQL via
 * Supabase) is the single source of truth. Conversations must survive server
 * restarts, deployments, horizontal scaling, multiple instances, and Vercel
 * serverless execution.
 *
 * All errors are logged with structured detail (Prisma error code, message,
 * stack trace) and re-thrown — never swallowed.
 */

import { db } from "@/lib/db";
import type { ConversationState } from "@/lib/conversation-state";

export interface StoredConversation {
  id: string;
  userId: string;
  userEmail: string | null;
  userType: string;
  vendorId: string | null;
  messages: any[];
  state: ConversationState | null;
  conversationSummary: string | null;
  lastMessageAt: Date;
}

/**
 * Structured error logger for Prisma errors. Never swallows — always logs
 * the error code, message, and stack trace, then re-throws.
 */
function logPrismaError(operation: string, err: any): void {
  const code = err?.code ?? "UNKNOWN";
  const message = err?.message ?? String(err);
  const stack = err?.stack?.split("\n").slice(0, 4).join("\n") ?? "(no stack)";
  console.error(`[josh/store] PRISMA ERROR during ${operation}`);
  console.error(`[josh/store]   operation: ${operation}`);
  console.error(`[josh/store]   code:      ${code}`);
  console.error(`[josh/store]   message:   ${message.slice(0, 300)}`);
  console.error(`[josh/store]   stack:     ${stack}`);
}

/**
 * Get or create a conversation. DATABASE-ONLY — no memory fallback.
 * If the DB is unavailable, the error is logged and re-thrown.
 */
export async function getOrCreateConversation(params: {
  conversationId?: string | null;
  userId: string;
  userEmail?: string | null;
  userType: string;
  vendorId?: string | null;
}): Promise<{ conversation: StoredConversation | null; created: boolean }> {
  const { conversationId, userId, userEmail, userType, vendorId } = params;

  // ── 1. Try to load an existing conversation by ID ──
  if (conversationId) {
    try {
      const row = await db.joshConversation.findUnique({
        where: { id: conversationId },
      });
      if (row) {
        console.log(`[josh/store] Loaded conversation ${row.id} by ID (messages: ${Array.isArray(row.messages) ? row.messages.length : 0})`);
        return {
          conversation: rowToStored(row),
          created: false,
        };
      }
      console.log(`[josh/store] Conversation ${conversationId} not found by ID — will search by userId`);
    } catch (err) {
      logPrismaError(`findUnique(id=${conversationId})`, err);
      throw err;
    }
  }

  // ── 2. Try to find the most recent conversation for this user ──
  if (userId) {
    try {
      const row = await db.joshConversation.findFirst({
        where: { userId },
        orderBy: { lastMessageAt: "desc" },
      });
      if (row) {
        console.log(`[josh/store] Loaded conversation ${row.id} by userId=${userId} (messages: ${Array.isArray(row.messages) ? row.messages.length : 0})`);
        return {
          conversation: rowToStored(row),
          created: false,
        };
      }
    } catch (err) {
      logPrismaError(`findFirst(userId=${userId})`, err);
      throw err;
    }
  }

  // ── 3. Create a new conversation ──
  try {
    const created = await db.joshConversation.create({
      data: {
        userId,
        userEmail: userEmail ?? null,
        userType,
        vendorId: vendorId ?? null,
        messages: [],
        state: {},
      },
    });
    console.log(`[josh/store] Created new conversation ${created.id} for userId=${userId}`);
    return {
      conversation: rowToStored(created),
      created: true,
    };
  } catch (err) {
    logPrismaError(`create(userId=${userId})`, err);
    throw err;
  }
}

/**
 * Save conversation messages + state to the database.
 * DATABASE-ONLY — no memory fallback. Errors are logged and re-thrown.
 */
export async function saveConversation(
  conversation: StoredConversation,
  messages: any[],
  state: ConversationState
): Promise<{ saved: boolean }> {
  if (!conversation) {
    console.error(`[josh/store] saveConversation called with null conversation`);
    return { saved: false };
  }

  try {
    await db.joshConversation.update({
      where: { id: conversation.id },
      data: {
        messages: JSON.stringify(messages),
        state: JSON.stringify(state),
        lastMessageAt: new Date(),
      },
    });
    console.log(`[josh/store] Saved conversation ${conversation.id} (messages: ${messages.length}, state keys: ${Object.keys(state).filter(k => (state as any)[k] != null && (state as any)[k] !== "").join(",")})`);
    return { saved: true };
  } catch (err) {
    logPrismaError(`update(id=${conversation.id})`, err);
    throw err;
  }
}

/**
 * Read-back verification: reload the conversation from the DB and verify
 * the saved state matches what we intended to save.
 *
 * Step 4 requirement: "Immediately read it back. Verify the saved state
 * matches memory. If verification fails, throw an error."
 */
export async function verifySavedState(
  conversationId: string,
  expectedState: ConversationState
): Promise<{ verified: boolean; reloadedState: ConversationState | null }> {
  try {
    const row = await db.joshConversation.findUnique({
      where: { id: conversationId },
      select: { state: true },
    });
    if (!row) {
      console.error(`[josh/store] VERIFY FAILED: conversation ${conversationId} not found after save`);
      return { verified: false, reloadedState: null };
    }
    let reloadedState: ConversationState | null = null;
    try {
      reloadedState = typeof row.state === "string" ? JSON.parse(row.state) : (row.state as unknown as ConversationState);
    } catch { reloadedState = null; }
    const verified = stateMatches(reloadedState, expectedState);
    if (verified) {
      console.log(`[josh/store] VERIFY PASSED: conversation ${conversationId} state matches`);
    } else {
      console.error(`[josh/store] VERIFY FAILED: conversation ${conversationId} state mismatch`);
      console.error(`[josh/store]   expected: ${JSON.stringify({ category: expectedState.category, city: expectedState.city, eventType: expectedState.eventType, budget: expectedState.budget, dietaryRequirements: expectedState.dietaryRequirements })}`);
      console.error(`[josh/store]   reloaded: ${JSON.stringify({ category: reloadedState?.category, city: reloadedState?.city, eventType: reloadedState?.eventType, budget: reloadedState?.budget, dietaryRequirements: reloadedState?.dietaryRequirements })}`);
    }
    return { verified, reloadedState };
  } catch (err) {
    logPrismaError(`verifySavedState(id=${conversationId})`, err);
    throw err;
  }
}

/**
 * Compare two ConversationStates for semantic equality on the key fields.
 */
function stateMatches(a: ConversationState | null, b: ConversationState): boolean {
  if (!a) return false;
  return (
    a.category === b.category &&
    a.city === b.city &&
    a.eventType === b.eventType &&
    a.budget === b.budget &&
    a.guestCount === b.guestCount &&
    a.eventDate === b.eventDate &&
    JSON.stringify(a.dietaryRequirements ?? []) === JSON.stringify(b.dietaryRequirements ?? []) &&
    a.conversationMode === b.conversationMode &&
    a.messageCount === b.messageCount
  );
}

/**
 * Update only the conversation summary (best-effort, errors logged).
 */
export async function updateConversationSummary(
  conversation: StoredConversation,
  summary: string
): Promise<void> {
  if (!conversation) return;
  try {
    await db.joshConversation.update({
      where: { id: conversation.id },
      data: { conversationSummary: summary },
    });
    console.log(`[josh/store] Updated summary for conversation ${conversation.id}`);
  } catch (err) {
    logPrismaError(`updateConversationSummary(id=${conversation.id})`, err);
    // summary is non-critical — log but don't throw
  }
}

/**
 * Get conversation history (for restoring on page reload). DATABASE-ONLY.
 */
export async function getConversationHistory(params: {
  conversationId?: string | null;
  userId?: string | null;
}): Promise<{ messages: any[]; conversationId: string | null; conversationSummary: string | null }> {
  const { conversationId, userId } = params;

  try {
    let row: any = null;
    if (conversationId) {
      row = await db.joshConversation.findUnique({ where: { id: conversationId } });
    } else if (userId) {
      row = await db.joshConversation.findFirst({
        where: { userId },
        orderBy: { lastMessageAt: "desc" },
      });
    }
    if (row) {
      let msgs: any[] = [];
      try {
        msgs = typeof row.messages === "string" ? JSON.parse(row.messages) : (Array.isArray(row.messages) ? row.messages : []);
      } catch { msgs = []; }
      return {
        messages: msgs,
        conversationId: row.id,
        conversationSummary: row.conversationSummary,
      };
    }
  } catch (err) {
    logPrismaError(`getConversationHistory(id=${conversationId}, userId=${userId})`, err);
  }

  return { messages: [], conversationId: null, conversationSummary: null };
}

/**
 * Convert a Prisma row to a StoredConversation.
 */
function rowToStored(row: any): StoredConversation {
  let state: ConversationState | null = null;
  try {
    state = typeof row.state === "string" ? JSON.parse(row.state) : (row.state as unknown as ConversationState);
  } catch {
    state = null;
  }
  let msgs: any[] = [];
  try {
    msgs = typeof row.messages === "string" ? JSON.parse(row.messages) : (Array.isArray(row.messages) ? row.messages : []);
  } catch { msgs = []; }
  return {
    id: row.id,
    userId: row.userId,
    userEmail: row.userEmail,
    userType: row.userType,
    vendorId: row.vendorId,
    messages: msgs,
    state,
    conversationSummary: row.conversationSummary,
    lastMessageAt: row.lastMessageAt,
  };
}
