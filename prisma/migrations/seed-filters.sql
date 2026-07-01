-- ============================================================
-- Universal Filter Engine — Complete Production Seed
-- ============================================================
-- Seeds filter_groups, filter_values, and category_filters
-- for ALL 22 categories across both ecosystems.
-- Safe to run multiple times — uses ON CONFLICT DO NOTHING.
-- ============================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- GLOBAL FILTERS (applied to ALL categories)
-- ═══════════════════════════════════════════════════════════════════════════

-- Price Range
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Price Range', 'single', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), '$ — Affordable', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), '$$ — Moderate', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), '$$$ — Premium', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), '$$$$ — Luxury', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'caterers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beverage-specialists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'event-planners', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'decorators', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'photographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'videographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'djs', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'entertainers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'venues', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'florists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'rental-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'makeup-artists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beauty-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'transportation', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'audio-visual-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Price Range'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Delivery Options
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Delivery Options', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), 'Delivery Available', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), 'Pickup Available', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), 'Nationwide Shipping', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), 'Same-Day Delivery', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), 'Next-Day Delivery', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'caterers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beverage-specialists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'event-planners', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'decorators', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'photographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'videographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'djs', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'entertainers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'venues', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'florists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'rental-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'makeup-artists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beauty-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'transportation', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'audio-visual-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Delivery Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Service Area
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Service Area', 'single', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), 'Local (within city)', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), 'Regional (within state)', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), 'National', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), 'International', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'caterers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beverage-specialists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'event-planners', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'decorators', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'photographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'videographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'djs', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'entertainers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'venues', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'florists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'rental-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'makeup-artists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beauty-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'transportation', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'audio-visual-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Area'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Languages Spoken
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Languages Spoken', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), 'English', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), 'Hindi', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), 'Arabic', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), 'Spanish', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), 'French', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), 'Mandarin', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), 'Portuguese', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), 'Bengali', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), 'Tamil', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), 'Telugu', 9, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'caterers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beverage-specialists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'event-planners', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'decorators', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'photographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'videographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'djs', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'entertainers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'venues', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'florists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'rental-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'makeup-artists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beauty-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'transportation', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'audio-visual-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Languages Spoken'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Experience
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Experience', 'range', 'years', true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), '1-3 years', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), '3-5 years', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), '5-10 years', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), '10+ years', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), '15+ years', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'caterers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beverage-specialists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'event-planners', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'decorators', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'photographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'videographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'djs', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'entertainers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'venues', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'florists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'rental-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'makeup-artists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beauty-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'transportation', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'audio-visual-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Experience'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Rating
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Rating', 'single', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), '4.0+ stars', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), '4.5+ stars', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), '4.8+ stars', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), '5.0 stars', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'caterers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beverage-specialists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'event-planners', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'decorators', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'photographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'videographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'djs', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'entertainers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'venues', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'florists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'rental-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'makeup-artists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beauty-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'transportation', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'audio-visual-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rating'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Response Time
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Response Time', 'single', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), 'Under 1 hour', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), 'Under 2 hours', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), 'Under 4 hours', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), 'Under 24 hours', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'caterers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beverage-specialists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'event-planners', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'decorators', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'photographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'videographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'djs', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'entertainers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'venues', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'florists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'rental-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'makeup-artists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beauty-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'transportation', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'audio-visual-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Response Time'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Business Type
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Business Type', 'single', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), 'Home Business', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), 'Storefront', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), 'Freelancer', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), 'Agency', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), 'Franchise', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'caterers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beverage-specialists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'event-planners', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'decorators', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'photographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'videographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'djs', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'entertainers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'venues', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'florists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'rental-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'makeup-artists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beauty-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'transportation', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'audio-visual-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Business Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- FINDMYBITES CATEGORY-SPECIFIC FILTERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Cake Type
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Cake Type', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cake Type'), 'Fondant', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cake Type'), 'Buttercream', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cake Type'), 'Fresh Cream', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cake Type'), 'Photo Cake', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cake Type'), 'Tier Cake', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cake Type'), 'Cupcakes', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cake Type'), 'Bento Cake', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cake Type'), 'Cheesecake', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cake Type'), 'Pinata Cake', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cake Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Flavour
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Flavour', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flavour'), 'Chocolate', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flavour'), 'Vanilla', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flavour'), 'Red Velvet', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flavour'), 'Black Forest', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flavour'), 'Butterscotch', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flavour'), 'Strawberry', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flavour'), 'Coffee', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flavour'), 'Fruit', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flavour'), 'Lemon', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flavour'), 'Caramel', 9, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flavour'), 'Pistachio', 10, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flavour'), 'Hazelnut', 11, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flavour'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Dietary Options
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Dietary Options', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Dietary Options'), 'Eggless', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Dietary Options'), 'Vegan', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Dietary Options'), 'Vegetarian', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Dietary Options'), 'Gluten-Free', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Dietary Options'), 'Nut-Free', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Dietary Options'), 'Dairy-Free', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Dietary Options'), 'Halal', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Dietary Options'), 'Kosher', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Dietary Options'), 'Sugar-Free', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Dietary Options'), 'Keto', 9, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Dietary Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'caterers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Dietary Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Dietary Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Dietary Options'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Occasion
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Occasion', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Occasion'), 'Birthday', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Occasion'), 'Wedding', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Occasion'), 'Anniversary', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Occasion'), 'Baby Shower', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Occasion'), 'Engagement', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Occasion'), 'Corporate', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Occasion'), 'Festival', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Occasion'), 'Graduation', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Occasion'), 'Retirement', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Occasion'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'decorators', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Occasion'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'photographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Occasion'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'videographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Occasion'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'florists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Occasion'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Occasion'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Allergens
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Allergens', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Allergens'), 'Contains Nuts', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Allergens'), 'Contains Peanuts', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Allergens'), 'Contains Dairy', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Allergens'), 'Contains Eggs', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Allergens'), 'Contains Gluten', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Allergens'), 'Contains Wheat', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Allergens'), 'Contains Soy', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Allergens'), 'Contains Sesame', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'bakers-bakery', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Allergens'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'caterers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Allergens'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Allergens'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Cuisine
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Cuisine', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cuisine'), 'Indian', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cuisine'), 'Italian', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cuisine'), 'Chinese', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cuisine'), 'Mexican', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cuisine'), 'Thai', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cuisine'), 'Japanese', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cuisine'), 'Mediterranean', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cuisine'), 'American', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cuisine'), 'Continental', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cuisine'), 'South Indian', 9, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cuisine'), 'North Indian', 10, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cuisine'), 'Mughlai', 11, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cuisine'), 'Arabic', 12, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cuisine'), 'African', 13, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cuisine'), 'Fusion', 14, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'caterers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cuisine'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Cuisine'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Service Style
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Service Style', 'single', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Style'), 'Buffet', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Style'), 'Plated', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Style'), 'Live Counter', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Style'), 'Family Style', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Style'), 'Cocktail', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'caterers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Service Style'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Staff Included
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Staff Included', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Included'), 'Servers', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Included'), 'Chef', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Included'), 'Bartender', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Included'), 'Clean-up Crew', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Included'), 'Event Manager', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Included'), 'Kitchen Assistants', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'caterers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Included'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Included'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Equipment Included
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Equipment Included', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Equipment Included'), 'Chafing Dishes', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Equipment Included'), 'Plates & Cutlery', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Equipment Included'), 'Tables & Linen', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Equipment Included'), 'Serving Utensils', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Equipment Included'), 'Food Warmers', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Equipment Included'), 'Bar Setup', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'caterers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Equipment Included'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Staff Role
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Staff Role', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Role'), 'Private Chef', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Role'), 'Pastry Chef', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Role'), 'Bartender', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Role'), 'Mixologist', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Role'), 'Waiter', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Role'), 'Waitress', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Role'), 'Host', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Role'), 'Hostess', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Role'), 'Event Manager', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Role'), 'Security', 9, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Role'), 'Valet', 10, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Role'), 'Cleaner', 11, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'chef-staff', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Staff Role'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Food Type
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Food Type', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Food Type'), 'Burgers', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Food Type'), 'Pizza', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Food Type'), 'BBQ', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Food Type'), 'Street Food', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Food Type'), 'Desserts', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Food Type'), 'Ice Cream', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Food Type'), 'Coffee', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Food Type'), 'Tacos', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Food Type'), 'Asian', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Food Type'), 'Vegan', 9, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'food-trucks', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Food Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Beverage Type
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Beverage Type', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beverage Type'), 'Coffee', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beverage Type'), 'Tea', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beverage Type'), 'Mocktails', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beverage Type'), 'Fresh Juices', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beverage Type'), 'Smoothies', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beverage Type'), 'Bubble Tea', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beverage Type'), 'Cold Pressed Juices', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beverage Type'), 'Hot Chocolate', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beverage-specialists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beverage Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Specialty Category
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Specialty Category', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Specialty Category'), 'Organic', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Specialty Category'), 'Keto & Low-Carb', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Specialty Category'), 'Vegan & Plant-Based', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Specialty Category'), 'Gluten-Free', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Specialty Category'), 'Halal', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Specialty Category'), 'Kosher', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Specialty Category'), 'Sugar-Free', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Specialty Category'), 'Dairy-Free', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Specialty Category'), 'Artisanal', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'specialty-food', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Specialty Category'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- PIMPMYPARTY CATEGORY-SPECIFIC FILTERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Event Type
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Event Type', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Event Type'), 'Weddings', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Event Type'), 'Corporate Events', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Event Type'), 'Birthdays', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Event Type'), 'Brand Activations', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Event Type'), 'Destination Events', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Event Type'), 'Festivals', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Event Type'), 'Concerts', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Event Type'), 'Anniversaries', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'event-planners', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Event Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'venues', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Event Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Party Theme
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Party Theme', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), 'Princess', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), 'Superhero', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), 'Unicorn', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), 'Dinosaur', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), 'Jungle', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), 'Space', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), 'Floral', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), 'Sports', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), 'Cartoon', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), 'Royal', 9, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), 'Bohemian', 10, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), 'Rustic', 11, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), 'Modern', 12, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), 'Vintage', 13, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), 'Tropical', 14, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'decorators', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Theme'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Balloon Style
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Balloon Style', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Balloon Style'), 'Balloon Arch', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Balloon Style'), 'Balloon Column', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Balloon Style'), 'Balloon Garland', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Balloon Style'), 'Balloon Bouquet', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Balloon Style'), 'Helium Balloons', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Balloon Style'), 'LED Balloons', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Balloon Style'), 'Confetti Balloons', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'decorators', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Balloon Style'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Balloon Style'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Colour Scheme
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Colour Scheme', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Colour Scheme'), 'Gold', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Colour Scheme'), 'Silver', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Colour Scheme'), 'Rose Gold', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Colour Scheme'), 'White', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Colour Scheme'), 'Pink', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Colour Scheme'), 'Blue', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Colour Scheme'), 'Red', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Colour Scheme'), 'Black', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Colour Scheme'), 'Pastels', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Colour Scheme'), 'Neon', 9, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Colour Scheme'), 'Rainbow', 10, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Colour Scheme'), 'Metallic', 11, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'decorators', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Colour Scheme'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'florists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Colour Scheme'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Colour Scheme'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Decor Type
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Decor Type', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Decor Type'), 'Stage Decor', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Decor Type'), 'Table Centerpieces', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Decor Type'), 'Backdrops', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Decor Type'), 'Floral Arrangements', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Decor Type'), 'Lighting Design', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Decor Type'), 'Entrance Decor', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Decor Type'), 'Ceiling Decor', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Decor Type'), 'Chair Covers', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'decorators', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Decor Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Photography Style
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Photography Style', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Photography Style'), 'Traditional', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Photography Style'), 'Candid', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Photography Style'), 'Documentary', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Photography Style'), 'Fine Art', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Photography Style'), 'Editorial', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Photography Style'), 'Pre-Wedding Shoot', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Photography Style'), 'Drone Photography', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Photography Style'), 'Product Photography', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'photographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Photography Style'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Coverage
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Coverage', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Coverage'), 'Full Day', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Coverage'), 'Half Day', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Coverage'), 'Ceremony Only', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Coverage'), 'Reception Only', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Coverage'), 'Pre-Wedding', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Coverage'), 'Post-Wedding', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Coverage'), 'Engagement', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'photographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Coverage'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'videographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Coverage'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Deliverables
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Deliverables', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Deliverables'), 'Digital Gallery', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Deliverables'), 'Photo Album', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Deliverables'), 'Edited Photos', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Deliverables'), 'Raw Files', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Deliverables'), 'Print Release', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Deliverables'), 'Online Gallery', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Deliverables'), 'Same-Day Edit', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'photographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Deliverables'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'videographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Deliverables'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Video Style
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Video Style', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Video Style'), 'Cinematic Film', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Video Style'), 'Documentary', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Video Style'), 'Highlight Reel', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Video Style'), 'Same-Day Edit', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Video Style'), 'Drone Videography', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Video Style'), 'Live Streaming', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Video Style'), 'Promotional Video', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'videographers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Video Style'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Music Genre
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Music Genre', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Music Genre'), 'Bollywood', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Music Genre'), 'House / EDM', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Music Genre'), 'Open-Format', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Music Genre'), 'Hip-Hop', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Music Genre'), 'Techno', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Music Genre'), 'Latin', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Music Genre'), 'Afrobeats', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Music Genre'), 'Retro', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Music Genre'), 'Jazz', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Music Genre'), 'Reggae', 9, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Music Genre'), 'Punjabi', 10, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Music Genre'), 'Telugu', 11, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'djs', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Music Genre'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- DJ Equipment
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'DJ Equipment', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'DJ Equipment'), 'Sound System', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'DJ Equipment'), 'Lighting', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'DJ Equipment'), 'Microphone', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'DJ Equipment'), 'DJ Booth', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'DJ Equipment'), 'Smoke Machine', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'DJ Equipment'), 'LED Screen', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'DJ Equipment'), 'Laser Show', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'djs', (SELECT "id" FROM "filter_groups" WHERE "name" = 'DJ Equipment'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'audio-visual-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'DJ Equipment'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- MC Services
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'MC Services', 'single', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'MC Services'), 'Included', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'MC Services'), 'Add-on', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'MC Services'), 'Not Available', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'djs', (SELECT "id" FROM "filter_groups" WHERE "name" = 'MC Services'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'entertainers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'MC Services'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Entertainment Type
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Entertainment Type', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Entertainment Type'), 'Magician', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Entertainment Type'), 'Clown', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Entertainment Type'), 'Mascot', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Entertainment Type'), 'Stilt Walker', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Entertainment Type'), 'Fire Performer', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Entertainment Type'), 'Aerialist', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Entertainment Type'), 'Live Band', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Entertainment Type'), 'Stand-up Comedy', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Entertainment Type'), 'Face Painting', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Entertainment Type'), 'Puppet Show', 9, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Entertainment Type'), 'Juggler', 10, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Entertainment Type'), 'Acrobat', 11, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'entertainers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Entertainment Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Entertainment Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Performance Duration
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Performance Duration', 'range', 'hours', true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Performance Duration'), '1 hour', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Performance Duration'), '2 hours', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Performance Duration'), '3 hours', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Performance Duration'), '4+ hours', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'entertainers', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Performance Duration'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'djs', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Performance Duration'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Venue Type
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Venue Type', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Type'), 'Banquet Hall', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Type'), 'Rooftop', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Type'), 'Garden / Outdoor', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Type'), 'Beach / Waterfront', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Type'), 'Hotel & Resort', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Type'), 'Industrial / Loft', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Type'), 'Farmhouse', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Type'), 'Convention Center', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Type'), 'Restaurant', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Type'), 'Private Estate', 9, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'venues', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Venue Capacity
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Venue Capacity', 'range', 'guests', true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Capacity'), 'Up to 50', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Capacity'), '50-100', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Capacity'), '100-250', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Capacity'), '250-500', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Capacity'), '500-1000', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Capacity'), '1000+', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'venues', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Capacity'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Venue Amenities
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Venue Amenities', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Amenities'), 'Air Conditioning', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Amenities'), 'Parking', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Amenities'), 'WiFi', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Amenities'), 'In-house Catering', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Amenities'), 'Bar', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Amenities'), 'Stage', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Amenities'), 'Bridal Suite', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Amenities'), 'Kitchen Access', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Amenities'), 'Power Backup', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Amenities'), 'Wheelchair Accessible', 9, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Amenities'), 'Outdoor Space', 10, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Amenities'), 'Swimming Pool', 11, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'venues', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Venue Amenities'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Indoor Outdoor
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Indoor Outdoor', 'single', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Indoor Outdoor'), 'Indoor', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Indoor Outdoor'), 'Outdoor', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Indoor Outdoor'), 'Both', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'venues', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Indoor Outdoor'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;
INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'decorators', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Indoor Outdoor'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Flower Type
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Flower Type', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flower Type'), 'Roses', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flower Type'), 'Lilies', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flower Type'), 'Peonies', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flower Type'), 'Orchids', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flower Type'), 'Carnations', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flower Type'), 'Tulips', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flower Type'), 'Sunflowers', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flower Type'), 'Hydrangeas', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flower Type'), 'Jasmine', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flower Type'), 'Marigold', 9, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flower Type'), 'Mixed Seasonal', 10, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'florists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Flower Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Floral Arrangement
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Floral Arrangement', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Floral Arrangement'), 'Bridal Bouquet', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Floral Arrangement'), 'Bridesmaid Bouquets', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Floral Arrangement'), 'Buttonholes', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Floral Arrangement'), 'Centerpieces', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Floral Arrangement'), 'Ceremony Arch', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Floral Arrangement'), 'Aisle Decor', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Floral Arrangement'), 'Flower Wall', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Floral Arrangement'), 'Table Garlands', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Floral Arrangement'), 'Wrist Corsages', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'florists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Floral Arrangement'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Rental Category
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Rental Category', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Category'), 'Furniture', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Category'), 'Stage', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Category'), 'Photo Booth', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Category'), 'Tent & Canopy', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Category'), 'Tableware', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Category'), 'Lighting', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Category'), 'Sound Equipment', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Category'), 'Power Equipment', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Category'), 'Linen', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Category'), 'Dance Floor', 9, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'rental-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Category'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Rental Material
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Rental Material', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Material'), 'Wood', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Material'), 'Metal', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Material'), 'Plastic', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Material'), 'Fabric', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Material'), 'Glass', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Material'), 'Acrylic', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Material'), 'Bamboo', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'rental-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Rental Material'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Makeup Type
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Makeup Type', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Type'), 'Bridal Makeup', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Type'), 'Party Makeup', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Type'), 'HD Makeup', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Type'), 'Airbrush Makeup', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Type'), 'Editorial Makeup', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Type'), 'Natural Makeup', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Type'), 'Party Glam', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'makeup-artists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Makeup Brands
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Makeup Brands', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Brands'), 'MAC', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Brands'), 'Huda Beauty', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Brands'), 'NARS', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Brands'), 'Bobbi Brown', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Brands'), 'Kryolan', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Brands'), 'PAC', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Brands'), 'Lakme', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Brands'), 'Maybelline', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Brands'), 'Anastasia Beverly Hills', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'makeup-artists', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Makeup Brands'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Beauty Service Type
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Beauty Service Type', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beauty Service Type'), 'Hair Styling', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beauty Service Type'), 'Hair Coloring', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beauty Service Type'), 'Mehndi / Henna', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beauty Service Type'), 'Nail Art', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beauty Service Type'), 'Spa & Massage', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beauty Service Type'), 'Grooming', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beauty Service Type'), 'Facial', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beauty Service Type'), 'Waxing', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beauty Service Type'), 'Threading', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'beauty-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Beauty Service Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Vehicle Type
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Vehicle Type', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Type'), 'Vintage Car', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Type'), 'Luxury Sedan', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Type'), 'Limousine', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Type'), 'Party Bus', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Type'), 'Guest Shuttle', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Type'), 'Sports Car', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Type'), 'Convertible', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Type'), 'Horse Carriage', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'transportation', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Vehicle Amenities
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Vehicle Amenities', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Amenities'), 'AC', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Amenities'), 'Music System', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Amenities'), 'Mini Bar', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Amenities'), 'LED Lighting', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Amenities'), 'Privacy Partition', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Amenities'), 'Sunroof', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Amenities'), 'WiFi', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Amenities'), 'Chauffeur', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'transportation', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Vehicle Amenities'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Print Category
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Print Category', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Category'), 'Wedding Invitations', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Category'), 'Birthday Cards', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Category'), 'Corporate Stationery', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Category'), 'Digital Invites', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Category'), 'Save the Dates', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Category'), 'Banners', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Category'), 'Stickers', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Category'), 'Signage', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Category'), 'Menus', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Category'), 'Thank You Cards', 9, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Category'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Print Material
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Print Material', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Material'), 'Cardstock', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Material'), 'Glossy Paper', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Material'), 'Matte Paper', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Material'), 'Recycled Paper', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Material'), 'Vinyl', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Material'), 'Fabric', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Material'), 'Acrylic', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Material'), 'Wood', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Material'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Print Technique
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Print Technique', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Technique'), 'Digital Print', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Technique'), 'Offset Print', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Technique'), 'Letterpress', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Technique'), 'Foil Stamping', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Technique'), 'Embossing', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Technique'), 'Thermography', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Technique'), 'Laser Cut', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'invitation-printing', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Print Technique'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Kids Activity
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Kids Activity', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Kids Activity'), 'Bounce House', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Kids Activity'), 'Mascots & Characters', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Kids Activity'), 'Games & Activities', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Kids Activity'), 'Face Painting', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Kids Activity'), 'Themed Decor', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Kids Activity'), 'Magic Show', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Kids Activity'), 'Puppet Show', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Kids Activity'), 'Treasure Hunt', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Kids Activity'), 'Art & Craft', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Kids Activity'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Age Group
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Age Group', 'single', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Age Group'), 'Toddlers (1-3)', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Age Group'), 'Kids (4-8)', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Age Group'), 'Pre-Teens (9-12)', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Age Group'), 'Teens (13-17)', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'kids-party-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Age Group'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- AV Service Type
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'AV Service Type', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'AV Service Type'), 'Sound Systems', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'AV Service Type'), 'Stage Lighting', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'AV Service Type'), 'LED Walls', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'AV Service Type'), 'AV Production', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'AV Service Type'), 'Live Streaming Setup', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'AV Service Type'), 'PA System', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'AV Service Type'), 'Projection', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'audio-visual-services', (SELECT "id" FROM "filter_groups" WHERE "name" = 'AV Service Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Party Supply Type
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Party Supply Type', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Supply Type'), 'Balloons & Helium', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Supply Type'), 'Cake Toppers', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Supply Type'), 'Party Props', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Supply Type'), 'Disposable Tableware', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Supply Type'), 'Banners & Confetti', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Supply Type'), 'Goodie Bags', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Supply Type'), 'Party Hats', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Supply Type'), 'Pinatas', 7, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Supply Type'), 'Candles', 8, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Supply Type'), 'Streamers', 9, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Supply Type'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- Party Material
INSERT INTO "filter_groups" ("id", "name", "type", "unit", "active", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'Party Material', 'multi', NULL, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Material'), 'Paper', 0, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Material'), 'Plastic', 1, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Material'), 'Foil', 2, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Material'), 'Latex', 3, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Material'), 'Wood', 4, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Material'), 'Eco-Friendly', 5, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;
INSERT INTO "filter_values" ("id", "groupId", "value", "sortOrder", "active", "createdAt")
VALUES (gen_random_uuid(), (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Material'), 'Biodegradable', 6, true, now())
ON CONFLICT ("groupId", "value") DO NOTHING;

INSERT INTO "category_filters" ("id", "categoryId", "filterGroupId", "required", "createdAt")
VALUES (gen_random_uuid(), 'party-supplies', (SELECT "id" FROM "filter_groups" WHERE "name" = 'Party Material'), false, now())
ON CONFLICT ("categoryId", "filterGroupId") DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 'filter_groups' as table_name, count(*) as count FROM "filter_groups";
SELECT 'filter_values' as table_name, count(*) as count FROM "filter_values";
SELECT 'category_filters' as table_name, count(*) as count FROM "category_filters";

-- Per-category filter count
SELECT cf."categoryId" as category, count(*) as filter_count
FROM "category_filters" cf
GROUP BY cf."categoryId"
ORDER BY filter_count DESC;
