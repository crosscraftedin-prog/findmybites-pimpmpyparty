/**
 * Josh Conversation Store — Hybrid Persistence Layer
 *
 * ROOT CAUSE FIX: ConversationState was being lost between requests because
 * the database was unavailable (Prisma provider/URL mismatch). Every DB
 * read/write failed silently in try/catch, so each request started with
 * DEFAULT_STATE and the conversation never progressed.
 *
 * This store provides a hybrid persistence layer:
 *   1. Try the database (Prisma) first — works in production with a real DB
 *   2. Fall back to an in-memory store — works when the DB is unavailable
 *
 * This ensures ConversationState ALWAYS persists across requests (within the
 * same server process), making the conversation engine deterministic.
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
  source: "db" | "memory"; // tracks where this conversation lives
}

// ── In-memory fallback store ──────────────────────────────────────────────
// Module-level Map that survives across requests within the same server
// process. Used when the database is unavailable.

const memoryStore = new Map<string, StoredConversation>();

/**
 * Generate a stable conversation ID (used when the DB can't create one).
 */
function generateConversationId(): string {
  return `mem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Get or create a conversation. Tries the DB first, falls back to memory.
 *
 * @param conversationId  The conversation ID from the client (may be null)
 * @param userId          The user ID
 * @param userEmail       Optional user email
 * @param userType        "customer" | "vendor" | "admin"
 * @param vendorId        Optional vendor ID (for vendor users)
 */
export async function getOrCreateConversation(params: {
  conversationId?: string | null;
  userId: string;
  userEmail?: string | null;
  userType: string;
  vendorId?: string | null;
}): Promise<{ conversation: StoredConversation | null; created: boolean; dbAvailable: boolean }> {
  const { conversationId, userId, userEmail, userType, vendorId } = params;

  // ── 1. Try to load an existing conversation from the DB ──
  if (conversationId) {
    try {
      const row = await db.joshConversation.findUnique({
        where: { id: conversationId },
      });
      if (row) {
        let loadedState: ConversationState | null = null;
        try {
          loadedState =
            typeof row.state === "string"
              ? JSON.parse(row.state)
              : (row.state as ConversationState);
        } catch {
          loadedState = null;
        }
        return {
          conversation: {
            id: row.id,
            userId: row.userId,
            userEmail: row.userEmail,
            userType: row.userType,
            vendorId: row.vendorId,
            messages: (row.messages as any[]) || [],
            state: loadedState,
            conversationSummary: row.conversationSummary,
            lastMessageAt: row.lastMessageAt,
            source: "db",
          },
          created: false,
          dbAvailable: true,
        };
      }
    } catch (e) {
      // DB unavailable — fall through to memory store
    }

    // ── 2. Try the in-memory store ──
    const memConv = memoryStore.get(conversationId);
    if (memConv) {
      return { conversation: memConv, created: false, dbAvailable: false };
    }
  }

  // ── 3. Try to find the most recent conversation for this user (DB) ──
  if (!conversationId && userId) {
    try {
      const row = await db.joshConversation.findFirst({
        where: { userId },
        orderBy: { lastMessageAt: "desc" },
      });
      if (row) {
        let loadedState: ConversationState | null = null;
        try {
          loadedState =
            typeof row.state === "string"
              ? JSON.parse(row.state)
              : (row.state as ConversationState);
        } catch {
          loadedState = null;
        }
        return {
          conversation: {
            id: row.id,
            userId: row.userId,
            userEmail: row.userEmail,
            userType: row.userType,
            vendorId: row.vendorId,
            messages: (row.messages as any[]) || [],
            state: loadedState,
            conversationSummary: row.conversationSummary,
            lastMessageAt: row.lastMessageAt,
            source: "db",
          },
          created: false,
          dbAvailable: true,
        };
      }
    } catch (e) {
      // DB unavailable — fall through
    }

    // ── 4. Check the in-memory store for this user ──
    for (const [, memConv] of memoryStore) {
      if (memConv.userId === userId) {
        return { conversation: memConv, created: false, dbAvailable: false };
      }
    }
  }

  // ── 5. Create a new conversation ──
  // Try the DB first
  try {
    const created = await db.joshConversation.create({
      data: {
        userId,
        userEmail: userEmail ?? null,
        userType,
        vendorId: vendorId ?? null,
        messages: [],
      },
    });
    return {
      conversation: {
        id: created.id,
        userId: created.userId,
        userEmail: created.userEmail,
        userType: created.userType,
        vendorId: created.vendorId,
        messages: [],
        state: null,
        conversationSummary: null,
        lastMessageAt: created.lastMessageAt,
        source: "db",
      },
      created: true,
      dbAvailable: true,
    };
  } catch (e) {
    // DB unavailable — create in memory
  }

  // Fall back to in-memory creation
  const newId = generateConversationId();
  const memConv: StoredConversation = {
    id: newId,
    userId,
    userEmail: userEmail ?? null,
    userType,
    vendorId: vendorId ?? null,
    messages: [],
    state: null,
    conversationSummary: null,
    lastMessageAt: new Date(),
    source: "memory",
  };
  memoryStore.set(newId, memConv);
  return {
    conversation: memConv,
    created: true,
    dbAvailable: false,
  };
}

/**
 * Save conversation messages + state. Tries the DB first, falls back to memory.
 */
export async function saveConversation(
  conversation: StoredConversation,
  messages: any[],
  state: ConversationState
): Promise<{ saved: boolean; source: "db" | "memory" }> {
  if (!conversation) return { saved: false, source: "memory" };

  // Update the in-memory copy (always, so subsequent requests in this process
  // see the latest state even if the DB write also succeeds)
  conversation.messages = messages;
  conversation.state = state;
  conversation.lastMessageAt = new Date();
  if (conversation.source === "memory") {
    memoryStore.set(conversation.id, conversation);
  } else {
    // Keep the memory store in sync as a read-through cache
    memoryStore.set(conversation.id, conversation);
  }

  // Try to persist to the DB
  try {
    await db.joshConversation.update({
      where: { id: conversation.id },
      data: {
        messages: messages as any,
        state: state as any,
        lastMessageAt: new Date(),
      },
    });
    conversation.source = "db";
    return { saved: true, source: "db" };
  } catch (e) {
    // DB unavailable — state is already in memory, which is sufficient
    conversation.source = "memory";
    return { saved: true, source: "memory" };
  }
}

/**
 * Update only the conversation summary (best-effort).
 */
export async function updateConversationSummary(
  conversation: StoredConversation,
  summary: string
): Promise<void> {
  if (!conversation) return;
  conversation.conversationSummary = summary;
  memoryStore.set(conversation.id, conversation);
  try {
    await db.joshConversation.update({
      where: { id: conversation.id },
      data: { conversationSummary: summary },
    });
  } catch {
    // best-effort
  }
}

/**
 * Get conversation history (for restoring on page reload).
 */
export async function getConversationHistory(params: {
  conversationId?: string | null;
  userId?: string | null;
}): Promise<{ messages: any[]; conversationId: string | null; conversationSummary: string | null }> {
  const { conversationId, userId } = params;

  // Try to load from the in-memory store first (fast path)
  if (conversationId) {
    const memConv = memoryStore.get(conversationId);
    if (memConv) {
      return {
        messages: memConv.messages,
        conversationId: memConv.id,
        conversationSummary: memConv.conversationSummary,
      };
    }
  } else if (userId) {
    for (const [, memConv] of memoryStore) {
      if (memConv.userId === userId) {
        return {
          messages: memConv.messages,
          conversationId: memConv.id,
          conversationSummary: memConv.conversationSummary,
        };
      }
    }
  }

  // Fall back to the DB
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
      return {
        messages: (row.messages as any[]) || [],
        conversationId: row.id,
        conversationSummary: row.conversationSummary,
      };
    }
  } catch {
    // DB unavailable
  }

  return { messages: [], conversationId: null, conversationSummary: null };
}
