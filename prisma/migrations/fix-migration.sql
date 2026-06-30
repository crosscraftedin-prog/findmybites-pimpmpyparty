-- ============================================================
-- Fix Migration — Add Missing Columns to Partially-Created Tables
-- ============================================================
-- This fixes the error: "column recipientType does not exist"
-- which happens when tables were partially created from a
-- previous run of the migration (CREATE TABLE IF NOT EXISTS
-- skipped the table because it existed, but it was missing columns).
--
-- SAFE TO RUN — all statements use ADD COLUMN IF NOT EXISTS.
-- ============================================================

-- ── notifications table — add all columns if missing ───────────────────────
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "recipientType" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "recipientId" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "message" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "bookingId" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "quoteId" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "conversationId" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "actionUrl" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "read" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── conversations table — add all columns if missing ───────────────────────
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "participant1Type" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "participant1Id" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "participant2Type" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "participant2Id" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "bookingId" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "lastMessage" TEXT;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "lastMessageAt" TIMESTAMP(3);
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unreadCount1" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "unreadCount2" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

-- ── messages table — add all columns if missing ────────────────────────────
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "conversationId" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "senderType" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "senderId" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "senderName" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "senderAvatar" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "content" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "attachments" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "quoteId" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── vendor_availability table — add all columns if missing ─────────────────
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "date" TIMESTAMP(3);
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'available';
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "timeSlots" TEXT;
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "bookingId" TEXT;
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

-- ── review_votes table — add all columns if missing ────────────────────────
ALTER TABLE "review_votes" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "review_votes" ADD COLUMN IF NOT EXISTS "reviewId" TEXT;
ALTER TABLE "review_votes" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "review_votes" ADD COLUMN IF NOT EXISTS "helpful" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "review_votes" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── listing_templates table — add all columns if missing ───────────────────
ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "ecosystem" TEXT NOT NULL DEFAULT 'BOTH';
ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "icon" TEXT;
ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "sections" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "isLatest" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "parentTemplateId" TEXT;
ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "isGlobal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "wizard" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "aiEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "aiConfig" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

-- ── template_fields table — add all columns if missing ─────────────────────
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "key" TEXT;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "label" TEXT;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'text';
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "section" TEXT NOT NULL DEFAULT 'Basic Information';
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "required" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "placeholder" TEXT;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "helpText" TEXT;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "unit" TEXT;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "span" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "filterGroupName" TEXT;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "staticOptions" TEXT;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "condition" TEXT;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "subFields" TEXT;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "toggleOptions" TEXT;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "maxImages" INTEGER;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "maxFileSize" INTEGER;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "minValue" INTEGER;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "maxValue" INTEGER;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "step" DOUBLE PRECISION;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "minLength" INTEGER;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "maxLength" INTEGER;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "pattern" TEXT;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "patternHint" TEXT;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "repeatable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "minRepeats" INTEGER;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "maxRepeats" INTEGER;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "repeatLabel" TEXT;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "repeatFields" TEXT;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "searchable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "seoIndexed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "aiEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "globalRef" TEXT;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── template_mappings table — add all columns if missing ───────────────────
ALTER TABLE "template_mappings" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "template_mappings" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "template_mappings" ADD COLUMN IF NOT EXISTS "subcategory" TEXT;
ALTER TABLE "template_mappings" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
ALTER TABLE "template_mappings" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── template_version_snapshots table — add all columns if missing ──────────
ALTER TABLE "template_version_snapshots" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "template_version_snapshots" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
ALTER TABLE "template_version_snapshots" ADD COLUMN IF NOT EXISTS "version" INTEGER;
ALTER TABLE "template_version_snapshots" ADD COLUMN IF NOT EXISTS "snapshot" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "template_version_snapshots" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "template_version_snapshots" ADD COLUMN IF NOT EXISTS "changeNote" TEXT;
ALTER TABLE "template_version_snapshots" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── template_audit_logs table — add all columns if missing ─────────────────
ALTER TABLE "template_audit_logs" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "template_audit_logs" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
ALTER TABLE "template_audit_logs" ADD COLUMN IF NOT EXISTS "action" TEXT;
ALTER TABLE "template_audit_logs" ADD COLUMN IF NOT EXISTS "entity" TEXT NOT NULL DEFAULT 'template';
ALTER TABLE "template_audit_logs" ADD COLUMN IF NOT EXISTS "entityId" TEXT;
ALTER TABLE "template_audit_logs" ADD COLUMN IF NOT EXISTS "fieldName" TEXT;
ALTER TABLE "template_audit_logs" ADD COLUMN IF NOT EXISTS "changeSummary" TEXT;
ALTER TABLE "template_audit_logs" ADD COLUMN IF NOT EXISTS "changeData" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "template_audit_logs" ADD COLUMN IF NOT EXISTS "adminEmail" TEXT;
ALTER TABLE "template_audit_logs" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── filter_groups table — add all columns if missing ───────────────────────
ALTER TABLE "filter_groups" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "filter_groups" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "filter_groups" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'multi';
ALTER TABLE "filter_groups" ADD COLUMN IF NOT EXISTS "unit" TEXT;
ALTER TABLE "filter_groups" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "filter_groups" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "filter_groups" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

-- ── filter_values table — add all columns if missing ───────────────────────
ALTER TABLE "filter_values" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "filter_values" ADD COLUMN IF NOT EXISTS "groupId" TEXT;
ALTER TABLE "filter_values" ADD COLUMN IF NOT EXISTS "value" TEXT;
ALTER TABLE "filter_values" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "filter_values" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "filter_values" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── category_filters table — add all columns if missing ────────────────────
ALTER TABLE "category_filters" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "category_filters" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "category_filters" ADD COLUMN IF NOT EXISTS "filterGroupId" TEXT;
ALTER TABLE "category_filters" ADD COLUMN IF NOT EXISTS "required" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "category_filters" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── vendor_filter_values table — add all columns if missing ────────────────
ALTER TABLE "vendor_filter_values" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "vendor_filter_values" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "vendor_filter_values" ADD COLUMN IF NOT EXISTS "filterValueId" TEXT;
ALTER TABLE "vendor_filter_values" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── vendor_analytics table — add all columns if missing ────────────────────
ALTER TABLE "vendor_analytics" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "vendor_analytics" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "vendor_analytics" ADD COLUMN IF NOT EXISTS "eventType" TEXT;
ALTER TABLE "vendor_analytics" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "vendor_analytics" ADD COLUMN IF NOT EXISTS "visitorHash" TEXT;
ALTER TABLE "vendor_analytics" ADD COLUMN IF NOT EXISTS "referrer" TEXT;
ALTER TABLE "vendor_analytics" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── vendor_follows table — add all columns if missing ──────────────────────
ALTER TABLE "vendor_follows" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "vendor_follows" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "vendor_follows" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "vendor_follows" ADD COLUMN IF NOT EXISTS "userEmail" TEXT;
ALTER TABLE "vendor_follows" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── customer_wishlist table — add all columns if missing ───────────────────
ALTER TABLE "customer_wishlist" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "customer_wishlist" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "customer_wishlist" ADD COLUMN IF NOT EXISTS "userEmail" TEXT;
ALTER TABLE "customer_wishlist" ADD COLUMN IF NOT EXISTS "entityType" TEXT;
ALTER TABLE "customer_wishlist" ADD COLUMN IF NOT EXISTS "entityId" TEXT;
ALTER TABLE "customer_wishlist" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "customer_wishlist" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── quotes table — add all columns if missing ──────────────────────────────
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "bookingId" TEXT;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "lineItems" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "totalAmount" INTEGER;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "depositType" TEXT NOT NULL DEFAULT 'percentage';
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "depositValue" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "aiNotes" TEXT;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "customerResponse" TEXT;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "customerNotes" TEXT;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "razorpayOrderId" TEXT;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "razorpayPaymentId" TEXT;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "depositPaidAt" TIMESTAMP(3);
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP(3);
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

-- ── concierge_events table — add all columns if missing ────────────────────
ALTER TABLE "concierge_events" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "concierge_events" ADD COLUMN IF NOT EXISTS "customerName" TEXT;
ALTER TABLE "concierge_events" ADD COLUMN IF NOT EXISTS "customerEmail" TEXT;
ALTER TABLE "concierge_events" ADD COLUMN IF NOT EXISTS "customerPhone" TEXT;
ALTER TABLE "concierge_events" ADD COLUMN IF NOT EXISTS "eventType" TEXT;
ALTER TABLE "concierge_events" ADD COLUMN IF NOT EXISTS "eventDate" TEXT;
ALTER TABLE "concierge_events" ADD COLUMN IF NOT EXISTS "eventCity" TEXT;
ALTER TABLE "concierge_events" ADD COLUMN IF NOT EXISTS "guests" INTEGER;
ALTER TABLE "concierge_events" ADD COLUMN IF NOT EXISTS "budget" TEXT;
ALTER TABLE "concierge_events" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "concierge_events" ADD COLUMN IF NOT EXISTS "eventManager" TEXT;
ALTER TABLE "concierge_events" ADD COLUMN IF NOT EXISTS "assignedVendors" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "concierge_events" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'new';
ALTER TABLE "concierge_events" ADD COLUMN IF NOT EXISTS "managementFeeType" TEXT NOT NULL DEFAULT 'percentage';
ALTER TABLE "concierge_events" ADD COLUMN IF NOT EXISTS "managementFeeValue" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "concierge_events" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "concierge_events" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

-- ── Category table — add all columns if missing ────────────────────────────
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "label" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "ecosystem" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "icon" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "accent" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── Subcategory table — add all columns if missing ─────────────────────────
ALTER TABLE "Subcategory" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "Subcategory" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Subcategory" ADD COLUMN IF NOT EXISTS "label" TEXT;
ALTER TABLE "Subcategory" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "Subcategory" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Subcategory" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Subcategory" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Subcategory" ADD COLUMN IF NOT EXISTS "isPending" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subcategory" ADD COLUMN IF NOT EXISTS "addedByVendorId" TEXT;
ALTER TABLE "Subcategory" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── pricing table — add all columns if missing ─────────────────────────────
ALTER TABLE "pricing" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "pricing" ADD COLUMN IF NOT EXISTS "countryCode" TEXT;
ALTER TABLE "pricing" ADD COLUMN IF NOT EXISTS "countryLabel" TEXT;
ALTER TABLE "pricing" ADD COLUMN IF NOT EXISTS "symbol" TEXT;
ALTER TABLE "pricing" ADD COLUMN IF NOT EXISTS "proMonthly" INTEGER;
ALTER TABLE "pricing" ADD COLUMN IF NOT EXISTS "proYearlyTotal" INTEGER;
ALTER TABLE "pricing" ADD COLUMN IF NOT EXISTS "businessMonthly" INTEGER;
ALTER TABLE "pricing" ADD COLUMN IF NOT EXISTS "businessYearlyTotal" INTEGER;
ALTER TABLE "pricing" ADD COLUMN IF NOT EXISTS "note" TEXT NOT NULL DEFAULT '';
ALTER TABLE "pricing" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "pricing" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "pricing" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

-- ── josh_conversations table — add all columns if missing ──────────────────
ALTER TABLE "josh_conversations" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "josh_conversations" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "josh_conversations" ADD COLUMN IF NOT EXISTS "userEmail" TEXT;
ALTER TABLE "josh_conversations" ADD COLUMN IF NOT EXISTS "userType" TEXT NOT NULL DEFAULT 'customer';
ALTER TABLE "josh_conversations" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "josh_conversations" ADD COLUMN IF NOT EXISTS "messages" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "josh_conversations" ADD COLUMN IF NOT EXISTS "conversationSummary" TEXT;
ALTER TABLE "josh_conversations" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "josh_conversations" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;
ALTER TABLE "josh_conversations" ADD COLUMN IF NOT EXISTS "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── Now re-create all indexes (safe — IF NOT EXISTS) ────────────────────────

-- Template Engine indexes
CREATE UNIQUE INDEX IF NOT EXISTS "listing_templates_slug_key" ON "listing_templates"("slug");
CREATE INDEX IF NOT EXISTS "template_version_snapshots_templateId_idx" ON "template_version_snapshots"("templateId");
CREATE INDEX IF NOT EXISTS "template_fields_templateId_idx" ON "template_fields"("templateId");
CREATE INDEX IF NOT EXISTS "template_fields_section_idx" ON "template_fields"("section");
CREATE INDEX IF NOT EXISTS "template_fields_searchable_idx" ON "template_fields"("searchable");
CREATE INDEX IF NOT EXISTS "template_fields_seoIndexed_idx" ON "template_fields"("seoIndexed");
CREATE INDEX IF NOT EXISTS "template_fields_templateId_section_sortOrder_idx" ON "template_fields"("templateId", "section", "sortOrder");
CREATE INDEX IF NOT EXISTS "template_mappings_categoryId_idx" ON "template_mappings"("categoryId");
CREATE INDEX IF NOT EXISTS "template_mappings_templateId_idx" ON "template_mappings"("templateId");
CREATE INDEX IF NOT EXISTS "template_audit_logs_templateId_idx" ON "template_audit_logs"("templateId");
CREATE INDEX IF NOT EXISTS "template_audit_logs_action_idx" ON "template_audit_logs"("action");
CREATE INDEX IF NOT EXISTS "template_audit_logs_createdAt_idx" ON "template_audit_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "template_audit_logs_templateId_createdAt_idx" ON "template_audit_logs"("templateId", "createdAt");

-- Filter Engine indexes
CREATE UNIQUE INDEX IF NOT EXISTS "filter_groups_name_key" ON "filter_groups"("name");
CREATE INDEX IF NOT EXISTS "filter_values_groupId_idx" ON "filter_values"("groupId");
CREATE INDEX IF NOT EXISTS "category_filters_categoryId_idx" ON "category_filters"("categoryId");
CREATE INDEX IF NOT EXISTS "vendor_filter_values_vendorId_idx" ON "vendor_filter_values"("vendorId");

-- Unique constraints (using DO blocks to avoid errors if they already exist)
DO $$
BEGIN
  -- filter_values unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'filter_values_groupId_value_key'
    AND table_name = 'filter_values'
  ) THEN
    ALTER TABLE "filter_values" ADD CONSTRAINT "filter_values_groupId_value_key" UNIQUE ("groupId", "value");
  END IF;

  -- category_filters unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'category_filters_categoryId_filterGroupId_key'
    AND table_name = 'category_filters'
  ) THEN
    ALTER TABLE "category_filters" ADD CONSTRAINT "category_filters_categoryId_filterGroupId_key" UNIQUE ("categoryId", "filterGroupId");
  END IF;

  -- vendor_filter_values unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vendor_filter_values_vendorId_filterValueId_key'
    AND table_name = 'vendor_filter_values'
  ) THEN
    ALTER TABLE "vendor_filter_values" ADD CONSTRAINT "vendor_filter_values_vendorId_filterValueId_key" UNIQUE ("vendorId", "filterValueId");
  END IF;

  -- Category unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Category_slug_key'
    AND table_name = 'Category'
  ) THEN
    ALTER TABLE "Category" ADD CONSTRAINT "Category_slug_key" UNIQUE ("slug");
  END IF;

  -- Subcategory unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Subcategory_slug_key'
    AND table_name = 'Subcategory'
  ) THEN
    ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_slug_key" UNIQUE ("slug");
  END IF;

  -- pricing unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pricing_countryCode_key'
    AND table_name = 'pricing'
  ) THEN
    ALTER TABLE "pricing" ADD CONSTRAINT "pricing_countryCode_key" UNIQUE ("countryCode");
  END IF;

  -- template_version_snapshots unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'template_version_snapshots_templateId_version_key'
    AND table_name = 'template_version_snapshots'
  ) THEN
    ALTER TABLE "template_version_snapshots" ADD CONSTRAINT "template_version_snapshots_templateId_version_key" UNIQUE ("templateId", "version");
  END IF;

  -- template_mappings unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'template_mappings_categoryId_subcategory_key'
    AND table_name = 'template_mappings'
  ) THEN
    ALTER TABLE "template_mappings" ADD CONSTRAINT "template_mappings_categoryId_subcategory_key" UNIQUE ("categoryId", "subcategory");
  END IF;

  -- vendor_follows unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vendor_follows_vendorId_userId_key'
    AND table_name = 'vendor_follows'
  ) THEN
    ALTER TABLE "vendor_follows" ADD CONSTRAINT "vendor_follows_vendorId_userId_key" UNIQUE ("vendorId", "userId");
  END IF;

  -- customer_wishlist unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'customer_wishlist_userId_entityType_entityId_key'
    AND table_name = 'customer_wishlist'
  ) THEN
    ALTER TABLE "customer_wishlist" ADD CONSTRAINT "customer_wishlist_userId_entityType_entityId_key" UNIQUE ("userId", "entityType", "entityId");
  END IF;

  -- conversations unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'conversations_participant1Type_participant1Id_participant2Type_participant2Id_key'
    AND table_name = 'conversations'
  ) THEN
    ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant1Type_participant1Id_participant2Type_participant2Id_key" UNIQUE ("participant1Type", "participant1Id", "participant2Type", "participant2Id");
  END IF;

  -- review_votes unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'review_votes_reviewId_userId_key'
    AND table_name = 'review_votes'
  ) THEN
    ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_reviewId_userId_key" UNIQUE ("reviewId", "userId");
  END IF;

  -- vendor_availability unique constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vendor_availability_vendorId_date_key'
    AND table_name = 'vendor_availability'
  ) THEN
    ALTER TABLE "vendor_availability" ADD CONSTRAINT "vendor_availability_vendorId_date_key" UNIQUE ("vendorId", "date");
  END IF;
END $$;

-- Analytics indexes
CREATE INDEX IF NOT EXISTS "vendor_analytics_vendorId_idx" ON "vendor_analytics"("vendorId");
CREATE INDEX IF NOT EXISTS "vendor_analytics_eventType_idx" ON "vendor_analytics"("eventType");
CREATE INDEX IF NOT EXISTS "vendor_analytics_createdAt_idx" ON "vendor_analytics"("createdAt");
CREATE INDEX IF NOT EXISTS "vendor_analytics_vendorId_eventType_createdAt_idx" ON "vendor_analytics"("vendorId", "eventType", "createdAt");

-- Follow + Wishlist indexes
CREATE INDEX IF NOT EXISTS "vendor_follows_vendorId_idx" ON "vendor_follows"("vendorId");
CREATE INDEX IF NOT EXISTS "vendor_follows_userId_idx" ON "vendor_follows"("userId");
CREATE INDEX IF NOT EXISTS "customer_wishlist_userId_idx" ON "customer_wishlist"("userId");
CREATE INDEX IF NOT EXISTS "customer_wishlist_entityType_idx" ON "customer_wishlist"("entityType");
CREATE INDEX IF NOT EXISTS "customer_wishlist_vendorId_idx" ON "customer_wishlist"("vendorId");

-- Phase 4 indexes
CREATE INDEX IF NOT EXISTS "quotes_bookingId_idx" ON "quotes"("bookingId");
CREATE INDEX IF NOT EXISTS "quotes_vendorId_idx" ON "quotes"("vendorId");
CREATE INDEX IF NOT EXISTS "quotes_status_idx" ON "quotes"("status");
CREATE INDEX IF NOT EXISTS "concierge_events_status_idx" ON "concierge_events"("status");
CREATE INDEX IF NOT EXISTS "concierge_events_eventManager_idx" ON "concierge_events"("eventManager");
CREATE INDEX IF NOT EXISTS "concierge_events_createdAt_idx" ON "concierge_events"("createdAt");

-- Phase 5 indexes (the ones that failed before)
CREATE INDEX IF NOT EXISTS "conversations_participant1Type_participant1Id_idx" ON "conversations"("participant1Type", "participant1Id");
CREATE INDEX IF NOT EXISTS "conversations_participant2Type_participant2Id_idx" ON "conversations"("participant2Type", "participant2Id");
CREATE INDEX IF NOT EXISTS "conversations_vendorId_idx" ON "conversations"("vendorId");
CREATE INDEX IF NOT EXISTS "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");
CREATE INDEX IF NOT EXISTS "messages_conversationId_idx" ON "messages"("conversationId");
CREATE INDEX IF NOT EXISTS "messages_senderType_senderId_idx" ON "messages"("senderType", "senderId");
CREATE INDEX IF NOT EXISTS "messages_createdAt_idx" ON "messages"("createdAt");
CREATE INDEX IF NOT EXISTS "notifications_recipientType_recipientId_read_idx" ON "notifications"("recipientType", "recipientId", "read");
CREATE INDEX IF NOT EXISTS "notifications_recipientType_recipientId_createdAt_idx" ON "notifications"("recipientType", "recipientId", "createdAt");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");
CREATE INDEX IF NOT EXISTS "vendor_availability_vendorId_date_idx" ON "vendor_availability"("vendorId", "date");
CREATE INDEX IF NOT EXISTS "vendor_availability_status_idx" ON "vendor_availability"("status");
CREATE INDEX IF NOT EXISTS "review_votes_reviewId_idx" ON "review_votes"("reviewId");

-- Subcategory indexes
CREATE INDEX IF NOT EXISTS "Subcategory_categoryId_idx" ON "Subcategory"("categoryId");

-- Josh conversations indexes
CREATE INDEX IF NOT EXISTS "josh_conversations_userId_idx" ON "josh_conversations"("userId");
CREATE INDEX IF NOT EXISTS "josh_conversations_vendorId_idx" ON "josh_conversations"("vendorId");

-- Booking indexes (from Phase 4)
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");
CREATE INDEX IF NOT EXISTS "Booking_createdAt_idx" ON "Booking"("createdAt");
CREATE INDEX IF NOT EXISTS "Booking_email_idx" ON "Booking"("email");
CREATE INDEX IF NOT EXISTS "Booking_conciergeEventId_idx" ON "Booking"("conciergeEventId");

-- Review indexes (from Phase 5)
CREATE INDEX IF NOT EXISTS "reviews_reviewerEmail_idx" ON "reviews"("reviewerEmail");
CREATE INDEX IF NOT EXISTS "reviews_verified_idx" ON "reviews"("verified");

-- Product indexes (from Template Engine)
CREATE INDEX IF NOT EXISTS "Product_templateSlug_idx" ON "Product"("templateSlug");

-- ── Foreign Key constraints (using DO blocks for safety) ────────────────────
DO $$
BEGIN
  -- Template Engine FKs
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'listing_templates_parentTemplateId_fkey' AND table_name = 'listing_templates') THEN
    ALTER TABLE "listing_templates" ADD CONSTRAINT "listing_templates_parentTemplateId_fkey" FOREIGN KEY ("parentTemplateId") REFERENCES "listing_templates"("id") ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'template_version_snapshots_templateId_fkey' AND table_name = 'template_version_snapshots') THEN
    ALTER TABLE "template_version_snapshots" ADD CONSTRAINT "template_version_snapshots_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "listing_templates"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'template_fields_templateId_fkey' AND table_name = 'template_fields') THEN
    ALTER TABLE "template_fields" ADD CONSTRAINT "template_fields_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "listing_templates"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'template_mappings_templateId_fkey' AND table_name = 'template_mappings') THEN
    ALTER TABLE "template_mappings" ADD CONSTRAINT "template_mappings_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "listing_templates"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'template_audit_logs_templateId_fkey' AND table_name = 'template_audit_logs') THEN
    ALTER TABLE "template_audit_logs" ADD CONSTRAINT "template_audit_logs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "listing_templates"("id") ON DELETE CASCADE;
  END IF;

  -- Filter Engine FKs
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'filter_values_groupId_fkey' AND table_name = 'filter_values') THEN
    ALTER TABLE "filter_values" ADD CONSTRAINT "filter_values_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "filter_groups"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'category_filters_filterGroupId_fkey' AND table_name = 'category_filters') THEN
    ALTER TABLE "category_filters" ADD CONSTRAINT "category_filters_filterGroupId_fkey" FOREIGN KEY ("filterGroupId") REFERENCES "filter_groups"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'vendor_filter_values_filterValueId_fkey' AND table_name = 'vendor_filter_values') THEN
    ALTER TABLE "vendor_filter_values" ADD CONSTRAINT "vendor_filter_values_filterValueId_fkey" FOREIGN KEY ("filterValueId") REFERENCES "filter_values"("id") ON DELETE CASCADE;
  END IF;

  -- Subcategory FK
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Subcategory_categoryId_fkey' AND table_name = 'Subcategory') THEN
    ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE;
  END IF;

  -- Messages FK
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'messages_conversationId_fkey' AND table_name = 'messages') THEN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE;
  END IF;

  -- Quotes FK
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'quotes_bookingId_fkey' AND table_name = 'quotes') THEN
    ALTER TABLE "quotes" ADD CONSTRAINT "quotes_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE;
  END IF;

  -- Availability FK
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'vendor_availability_vendorId_fkey' AND table_name = 'vendor_availability') THEN
    ALTER TABLE "vendor_availability" ADD CONSTRAINT "vendor_availability_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE;
  END IF;

  -- Review votes FK
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'review_votes_reviewId_fkey' AND table_name = 'review_votes') THEN
    ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ── ALTER existing tables (Booking, reviews, Product, vendor_listings) ──────
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "eventTime" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "referenceImage" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "preferredContact" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "aiSummary" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "leadScore" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "aiQualification" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "conciergeEventId" TEXT;

ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reviewerEmail" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "photos" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "vendorReply" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "vendorRepliedAt" TIMESTAMP(3);
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "helpfulCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reportCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "productId" TEXT;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "badge" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "templateSlug" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "templateVersion" INTEGER;

ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "facebook" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "youtube" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "tiktok" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "twitter" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "snapchat" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "fssaiNumber" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "settingsLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMP(3);
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "owner_user_id" TEXT;
ALTER TABLE "vendor_listings" ADD COLUMN IF NOT EXISTS "ownership_status" TEXT DEFAULT 'unclaimed';

-- ── DONE ────────────────────────────────────────────────────────────────────
