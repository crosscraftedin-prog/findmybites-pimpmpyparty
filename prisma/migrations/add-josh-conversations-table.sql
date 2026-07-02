-- ============================================================
-- Fix: Create josh_conversations table (missing from production)
-- ============================================================
-- This table is required by Josh AI for conversation persistence.
-- The Prisma model JoshConversation maps to this table.
-- The table was in supabase-setup.sql but was NOT created on production
-- because only the add-subscriptions-and-bookings.sql migration was run.
--
-- This migration includes the `state` JSONB column (added by
-- add-conversation-state.sql) so the table is complete in one step.
-- ============================================================

CREATE TABLE IF NOT EXISTS "josh_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT,
    "userType" TEXT NOT NULL DEFAULT 'customer',
    "vendorId" TEXT,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "conversationSummary" TEXT,
    "state" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "josh_conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "josh_conversations_userId_idx" ON "josh_conversations"("userId");
CREATE INDEX IF NOT EXISTS "josh_conversations_vendorId_idx" ON "josh_conversations"("vendorId");
