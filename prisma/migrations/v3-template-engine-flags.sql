-- V3 Template Engine: lifecycle status + filterable + priority
-- Idempotent — safe to run multiple times.

ALTER TABLE "listing_templates" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'published';
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "filterable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "template_fields" ADD COLUMN IF NOT EXISTS "priority" INTEGER NOT NULL DEFAULT 0;

-- Index for status-based filtering
CREATE INDEX IF NOT EXISTS "listing_templates_status_idx" ON "listing_templates"("status");
CREATE INDEX IF NOT EXISTS "template_fields_filterable_idx" ON "template_fields"("filterable");
CREATE INDEX IF NOT EXISTS "template_fields_priority_idx" ON "template_fields"("priority");
