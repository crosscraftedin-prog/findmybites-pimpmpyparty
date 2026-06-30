-- ============================================================
-- FINAL Safe Migration — Correct Statement Order
-- ============================================================
-- ORDER MATTERS:
--   1. CREATE TABLE IF NOT EXISTS (all 23 tables)
--   2. ALTER TABLE ADD COLUMN IF NOT EXISTS (all columns — fills gaps in partially-created tables)
--   3. CREATE INDEX IF NOT EXISTS (all indexes — AFTER columns exist)
--   4. ADD CONSTRAINTS (unique + FK — AFTER columns exist)
--
-- SAFE TO RUN MULTIPLE TIMES. Does NOT drop or modify existing data.
-- ============================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 1: CREATE ALL TABLES (IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE IF NOT EXISTS "listing_templates" (
    "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '', "ecosystem" TEXT NOT NULL DEFAULT 'BOTH',
    "icon" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "sections" TEXT NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1, "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "parentTemplateId" TEXT, "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "wizard" TEXT NOT NULL DEFAULT '[]', "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiConfig" TEXT NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "listing_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "template_version_snapshots" (
    "id" TEXT NOT NULL, "templateId" TEXT NOT NULL, "version" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL DEFAULT '{}', "createdBy" TEXT, "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "template_version_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "template_fields" (
    "id" TEXT NOT NULL, "templateId" TEXT NOT NULL, "key" TEXT NOT NULL, "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text', "section" TEXT NOT NULL DEFAULT 'Basic Information',
    "sortOrder" INTEGER NOT NULL DEFAULT 0, "required" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true, "placeholder" TEXT, "helpText" TEXT, "unit" TEXT,
    "span" INTEGER NOT NULL DEFAULT 1, "filterGroupName" TEXT, "staticOptions" TEXT,
    "condition" TEXT, "subFields" TEXT, "toggleOptions" TEXT, "maxImages" INTEGER,
    "maxFileSize" INTEGER, "minValue" INTEGER, "maxValue" INTEGER, "step" DOUBLE PRECISION,
    "minLength" INTEGER, "maxLength" INTEGER, "pattern" TEXT, "patternHint" TEXT,
    "repeatable" BOOLEAN NOT NULL DEFAULT false, "minRepeats" INTEGER, "maxRepeats" INTEGER,
    "repeatLabel" TEXT, "repeatFields" TEXT, "searchable" BOOLEAN NOT NULL DEFAULT false,
    "seoIndexed" BOOLEAN NOT NULL DEFAULT false, "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "globalRef" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "template_fields_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "template_mappings" (
    "id" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "subcategory" TEXT,
    "templateId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "template_mappings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "template_audit_logs" (
    "id" TEXT NOT NULL, "templateId" TEXT NOT NULL, "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL DEFAULT 'template', "entityId" TEXT, "fieldName" TEXT,
    "changeSummary" TEXT, "changeData" TEXT NOT NULL DEFAULT '{}', "adminEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "template_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "filter_groups" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "type" TEXT NOT NULL DEFAULT 'multi',
    "unit" TEXT, "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "filter_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "filter_values" (
    "id" TEXT NOT NULL, "groupId" TEXT NOT NULL, "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "filter_values_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "category_filters" (
    "id" TEXT NOT NULL, "categoryId" TEXT NOT NULL, "filterGroupId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "category_filters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vendor_filter_values" (
    "id" TEXT NOT NULL, "vendorId" TEXT NOT NULL, "filterValueId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_filter_values_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "label" TEXT NOT NULL, "ecosystem" TEXT NOT NULL,
    "description" TEXT, "icon" TEXT, "image" TEXT, "accent" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Subcategory" (
    "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "label" TEXT NOT NULL, "categoryId" TEXT NOT NULL,
    "description" TEXT, "sortOrder" INTEGER NOT NULL DEFAULT 0, "active" BOOLEAN NOT NULL DEFAULT true,
    "isPending" BOOLEAN NOT NULL DEFAULT false, "addedByVendorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "pricing" (
    "id" TEXT NOT NULL, "countryCode" TEXT NOT NULL, "countryLabel" TEXT NOT NULL,
    "symbol" TEXT NOT NULL, "proMonthly" INTEGER NOT NULL, "proYearlyTotal" INTEGER NOT NULL,
    "businessMonthly" INTEGER NOT NULL, "businessYearlyTotal" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '', "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pricing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "josh_conversations" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "userEmail" TEXT,
    "userType" TEXT NOT NULL DEFAULT 'customer', "vendorId" TEXT,
    "messages" JSONB NOT NULL DEFAULT '[]', "conversationSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "josh_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vendor_analytics" (
    "id" TEXT NOT NULL, "vendorId" TEXT NOT NULL, "eventType" TEXT NOT NULL,
    "productId" TEXT, "visitorHash" TEXT, "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_analytics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vendor_follows" (
    "id" TEXT NOT NULL, "vendorId" TEXT NOT NULL, "userId" TEXT NOT NULL,
    "userEmail" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_follows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "customer_wishlist" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "userEmail" TEXT,
    "entityType" TEXT NOT NULL, "entityId" TEXT NOT NULL, "vendorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_wishlist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quotes" (
    "id" TEXT NOT NULL, "bookingId" TEXT NOT NULL, "vendorId" TEXT NOT NULL,
    "lineItems" TEXT NOT NULL DEFAULT '[]', "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD', "depositType" TEXT NOT NULL DEFAULT 'percentage',
    "depositValue" INTEGER NOT NULL DEFAULT 50, "aiNotes" TEXT, "status" TEXT NOT NULL DEFAULT 'draft',
    "customerResponse" TEXT, "customerNotes" TEXT, "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT, "depositPaidAt" TIMESTAMP(3), "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "concierge_events" (
    "id" TEXT NOT NULL, "customerName" TEXT NOT NULL, "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT, "eventType" TEXT NOT NULL, "eventDate" TEXT NOT NULL,
    "eventCity" TEXT NOT NULL, "guests" INTEGER NOT NULL, "budget" TEXT NOT NULL,
    "notes" TEXT, "eventManager" TEXT, "assignedVendors" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'new', "managementFeeType" TEXT NOT NULL DEFAULT 'percentage',
    "managementFeeValue" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "concierge_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL, "participant1Type" TEXT NOT NULL, "participant1Id" TEXT NOT NULL,
    "participant2Type" TEXT NOT NULL, "participant2Id" TEXT NOT NULL,
    "vendorId" TEXT, "productId" TEXT, "bookingId" TEXT, "lastMessage" TEXT,
    "lastMessageAt" TIMESTAMP(3), "unreadCount1" INTEGER NOT NULL DEFAULT 0,
    "unreadCount2" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "messages" (
    "id" TEXT NOT NULL, "conversationId" TEXT NOT NULL, "senderType" TEXT NOT NULL,
    "senderId" TEXT NOT NULL, "senderName" TEXT NOT NULL, "senderAvatar" TEXT,
    "content" TEXT NOT NULL, "attachments" TEXT, "quoteId" TEXT, "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL, "recipientType" TEXT NOT NULL, "recipientId" TEXT NOT NULL,
    "type" TEXT NOT NULL, "title" TEXT NOT NULL, "message" TEXT NOT NULL,
    "vendorId" TEXT, "productId" TEXT, "bookingId" TEXT, "quoteId" TEXT,
    "conversationId" TEXT, "actionUrl" TEXT, "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "vendor_availability" (
    "id" TEXT NOT NULL, "vendorId" TEXT NOT NULL, "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available', "timeSlots" TEXT, "note" TEXT,
    "bookingId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vendor_availability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "review_votes" (
    "id" TEXT NOT NULL, "reviewId" TEXT NOT NULL, "userId" TEXT NOT NULL,
    "helpful" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "review_votes_pkey" PRIMARY KEY ("id")
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 2: ADD ALL MISSING COLUMNS (BEFORE ANY INDEXES)
-- This ensures partially-created tables get their columns filled in.
-- ═══════════════════════════════════════════════════════════════════════════

-- notifications (the table that's causing the error)
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

-- conversations
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

-- messages
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

-- vendor_availability
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "date" TIMESTAMP(3);
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'available';
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "timeSlots" TEXT;
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "bookingId" TEXT;
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "vendor_availability" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

-- review_votes
ALTER TABLE "review_votes" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "review_votes" ADD COLUMN IF NOT EXISTS "reviewId" TEXT;
ALTER TABLE "review_votes" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "review_votes" ADD COLUMN IF NOT EXISTS "helpful" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "review_votes" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- listing_templates
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

-- template_fields
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

-- template_mappings
ALTER TABLE "template_mappings" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "template_mappings" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "template_mappings" ADD COLUMN IF NOT EXISTS "subcategory" TEXT;
ALTER TABLE "template_mappings" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
ALTER TABLE "template_mappings" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- template_version_snapshots
ALTER TABLE "template_version_snapshots" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "template_version_snapshots" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
ALTER TABLE "template_version_snapshots" ADD COLUMN IF NOT EXISTS "version" INTEGER;
ALTER TABLE "template_version_snapshots" ADD COLUMN IF NOT EXISTS "snapshot" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "template_version_snapshots" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "template_version_snapshots" ADD COLUMN IF NOT EXISTS "changeNote" TEXT;
ALTER TABLE "template_version_snapshots" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- template_audit_logs
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

-- filter_groups
ALTER TABLE "filter_groups" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "filter_groups" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "filter_groups" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'multi';
ALTER TABLE "filter_groups" ADD COLUMN IF NOT EXISTS "unit" TEXT;
ALTER TABLE "filter_groups" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "filter_groups" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "filter_groups" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL;

-- filter_values
ALTER TABLE "filter_values" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "filter_values" ADD COLUMN IF NOT EXISTS "groupId" TEXT;
ALTER TABLE "filter_values" ADD COLUMN IF NOT EXISTS "value" TEXT;
ALTER TABLE "filter_values" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "filter_values" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "filter_values" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- category_filters
ALTER TABLE "category_filters" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "category_filters" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "category_filters" ADD COLUMN IF NOT EXISTS "filterGroupId" TEXT;
ALTER TABLE "category_filters" ADD COLUMN IF NOT EXISTS "required" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "category_filters" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- vendor_filter_values
ALTER TABLE "vendor_filter_values" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "vendor_filter_values" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "vendor_filter_values" ADD COLUMN IF NOT EXISTS "filterValueId" TEXT;
ALTER TABLE "vendor_filter_values" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Category
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

-- Subcategory
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

-- pricing
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

-- josh_conversations
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

-- vendor_analytics
ALTER TABLE "vendor_analytics" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "vendor_analytics" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "vendor_analytics" ADD COLUMN IF NOT EXISTS "eventType" TEXT;
ALTER TABLE "vendor_analytics" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "vendor_analytics" ADD COLUMN IF NOT EXISTS "visitorHash" TEXT;
ALTER TABLE "vendor_analytics" ADD COLUMN IF NOT EXISTS "referrer" TEXT;
ALTER TABLE "vendor_analytics" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- vendor_follows
ALTER TABLE "vendor_follows" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "vendor_follows" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "vendor_follows" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "vendor_follows" ADD COLUMN IF NOT EXISTS "userEmail" TEXT;
ALTER TABLE "vendor_follows" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- customer_wishlist
ALTER TABLE "customer_wishlist" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "customer_wishlist" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "customer_wishlist" ADD COLUMN IF NOT EXISTS "userEmail" TEXT;
ALTER TABLE "customer_wishlist" ADD COLUMN IF NOT EXISTS "entityType" TEXT;
ALTER TABLE "customer_wishlist" ADD COLUMN IF NOT EXISTS "entityId" TEXT;
ALTER TABLE "customer_wishlist" ADD COLUMN IF NOT EXISTS "vendorId" TEXT;
ALTER TABLE "customer_wishlist" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- quotes
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

-- concierge_events
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

-- Booking (existing table — add Phase 4 columns)
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

-- reviews (existing table — add Phase 5 columns)
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reviewerEmail" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "photos" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "vendorReply" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "vendorRepliedAt" TIMESTAMP(3);
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "helpfulCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reportCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "productId" TEXT;

-- Product (existing table — add Template Engine columns)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "badge" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "templateSlug" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "templateVersion" INTEGER;

-- vendor_listings (existing table — add Phase 2.5 columns)
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

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 3: CREATE ALL INDEXES (AFTER ALL COLUMNS EXIST)
-- ═══════════════════════════════════════════════════════════════════════════

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
CREATE UNIQUE INDEX IF NOT EXISTS "filter_groups_name_key" ON "filter_groups"("name");
CREATE INDEX IF NOT EXISTS "filter_values_groupId_idx" ON "filter_values"("groupId");
CREATE INDEX IF NOT EXISTS "category_filters_categoryId_idx" ON "category_filters"("categoryId");
CREATE INDEX IF NOT EXISTS "vendor_filter_values_vendorId_idx" ON "vendor_filter_values"("vendorId");
CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Subcategory_slug_key" ON "Subcategory"("slug");
CREATE INDEX IF NOT EXISTS "Subcategory_categoryId_idx" ON "Subcategory"("categoryId");
CREATE UNIQUE INDEX IF NOT EXISTS "pricing_countryCode_key" ON "pricing"("countryCode");
CREATE INDEX IF NOT EXISTS "josh_conversations_userId_idx" ON "josh_conversations"("userId");
CREATE INDEX IF NOT EXISTS "josh_conversations_vendorId_idx" ON "josh_conversations"("vendorId");
CREATE INDEX IF NOT EXISTS "vendor_analytics_vendorId_idx" ON "vendor_analytics"("vendorId");
CREATE INDEX IF NOT EXISTS "vendor_analytics_eventType_idx" ON "vendor_analytics"("eventType");
CREATE INDEX IF NOT EXISTS "vendor_analytics_createdAt_idx" ON "vendor_analytics"("createdAt");
CREATE INDEX IF NOT EXISTS "vendor_analytics_vendorId_eventType_createdAt_idx" ON "vendor_analytics"("vendorId", "eventType", "createdAt");
CREATE INDEX IF NOT EXISTS "vendor_follows_vendorId_idx" ON "vendor_follows"("vendorId");
CREATE INDEX IF NOT EXISTS "vendor_follows_userId_idx" ON "vendor_follows"("userId");
CREATE INDEX IF NOT EXISTS "customer_wishlist_userId_idx" ON "customer_wishlist"("userId");
CREATE INDEX IF NOT EXISTS "customer_wishlist_entityType_idx" ON "customer_wishlist"("entityType");
CREATE INDEX IF NOT EXISTS "customer_wishlist_vendorId_idx" ON "customer_wishlist"("vendorId");
CREATE INDEX IF NOT EXISTS "quotes_bookingId_idx" ON "quotes"("bookingId");
CREATE INDEX IF NOT EXISTS "quotes_vendorId_idx" ON "quotes"("vendorId");
CREATE INDEX IF NOT EXISTS "quotes_status_idx" ON "quotes"("status");
CREATE INDEX IF NOT EXISTS "concierge_events_status_idx" ON "concierge_events"("status");
CREATE INDEX IF NOT EXISTS "concierge_events_eventManager_idx" ON "concierge_events"("eventManager");
CREATE INDEX IF NOT EXISTS "concierge_events_createdAt_idx" ON "concierge_events"("createdAt");
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
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");
CREATE INDEX IF NOT EXISTS "Booking_createdAt_idx" ON "Booking"("createdAt");
CREATE INDEX IF NOT EXISTS "Booking_email_idx" ON "Booking"("email");
CREATE INDEX IF NOT EXISTS "Booking_conciergeEventId_idx" ON "Booking"("conciergeEventId");
CREATE INDEX IF NOT EXISTS "reviews_reviewerEmail_idx" ON "reviews"("reviewerEmail");
CREATE INDEX IF NOT EXISTS "reviews_verified_idx" ON "reviews"("verified");
CREATE INDEX IF NOT EXISTS "Product_templateSlug_idx" ON "Product"("templateSlug");

-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 4: ADD UNIQUE CONSTRAINTS + FOREIGN KEYS (AFTER ALL COLUMNS EXIST)
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- Unique constraints
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'filter_values_groupId_value_key' AND table_name = 'filter_values') THEN
    ALTER TABLE "filter_values" ADD CONSTRAINT "filter_values_groupId_value_key" UNIQUE ("groupId", "value");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'category_filters_categoryId_filterGroupId_key' AND table_name = 'category_filters') THEN
    ALTER TABLE "category_filters" ADD CONSTRAINT "category_filters_categoryId_filterGroupId_key" UNIQUE ("categoryId", "filterGroupId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'vendor_filter_values_vendorId_filterValueId_key' AND table_name = 'vendor_filter_values') THEN
    ALTER TABLE "vendor_filter_values" ADD CONSTRAINT "vendor_filter_values_vendorId_filterValueId_key" UNIQUE ("vendorId", "filterValueId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'template_version_snapshots_templateId_version_key' AND table_name = 'template_version_snapshots') THEN
    ALTER TABLE "template_version_snapshots" ADD CONSTRAINT "template_version_snapshots_templateId_version_key" UNIQUE ("templateId", "version");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'template_mappings_categoryId_subcategory_key' AND table_name = 'template_mappings') THEN
    ALTER TABLE "template_mappings" ADD CONSTRAINT "template_mappings_categoryId_subcategory_key" UNIQUE ("categoryId", "subcategory");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'vendor_follows_vendorId_userId_key' AND table_name = 'vendor_follows') THEN
    ALTER TABLE "vendor_follows" ADD CONSTRAINT "vendor_follows_vendorId_userId_key" UNIQUE ("vendorId", "userId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'customer_wishlist_userId_entityType_entityId_key' AND table_name = 'customer_wishlist') THEN
    ALTER TABLE "customer_wishlist" ADD CONSTRAINT "customer_wishlist_userId_entityType_entityId_key" UNIQUE ("userId", "entityType", "entityId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'conversations_participant1Type_participant1Id_participant2Type_participant2Id_key' AND table_name = 'conversations') THEN
    ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant1Type_participant1Id_participant2Type_participant2Id_key" UNIQUE ("participant1Type", "participant1Id", "participant2Type", "participant2Id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'review_votes_reviewId_userId_key' AND table_name = 'review_votes') THEN
    ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_reviewId_userId_key" UNIQUE ("reviewId", "userId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'vendor_availability_vendorId_date_key' AND table_name = 'vendor_availability') THEN
    ALTER TABLE "vendor_availability" ADD CONSTRAINT "vendor_availability_vendorId_date_key" UNIQUE ("vendorId", "date");
  END IF;

  -- Foreign keys
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
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'filter_values_groupId_fkey' AND table_name = 'filter_values') THEN
    ALTER TABLE "filter_values" ADD CONSTRAINT "filter_values_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "filter_groups"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'category_filters_filterGroupId_fkey' AND table_name = 'category_filters') THEN
    ALTER TABLE "category_filters" ADD CONSTRAINT "category_filters_filterGroupId_fkey" FOREIGN KEY ("filterGroupId") REFERENCES "filter_groups"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'vendor_filter_values_filterValueId_fkey' AND table_name = 'vendor_filter_values') THEN
    ALTER TABLE "vendor_filter_values" ADD CONSTRAINT "vendor_filter_values_filterValueId_fkey" FOREIGN KEY ("filterValueId") REFERENCES "filter_values"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Subcategory_categoryId_fkey' AND table_name = 'Subcategory') THEN
    ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'messages_conversationId_fkey' AND table_name = 'messages') THEN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'quotes_bookingId_fkey' AND table_name = 'quotes') THEN
    ALTER TABLE "quotes" ADD CONSTRAINT "quotes_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'vendor_availability_vendorId_fkey' AND table_name = 'vendor_availability') THEN
    ALTER TABLE "vendor_availability" ADD CONSTRAINT "vendor_availability_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'review_votes_reviewId_fkey' AND table_name = 'review_votes') THEN
    ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE — All 23 tables created, all columns added, all indexes + constraints set
-- ═══════════════════════════════════════════════════════════════════════════
