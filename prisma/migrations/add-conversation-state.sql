-- Add ConversationState column to josh_conversations table
ALTER TABLE "josh_conversations" ADD COLUMN IF NOT EXISTS "state" JSONB DEFAULT '{}';
