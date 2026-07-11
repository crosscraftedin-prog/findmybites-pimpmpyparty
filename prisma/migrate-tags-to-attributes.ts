/**
 * Migrate existing vendor tags into the Global Attribute System.
 *
 * For each vendor with a `tags` JSON array, this script:
 *   1. Normalizes each tag (lowercase, trim, hyphenate)
 *   2. Matches against canonical attribute slugs
 *   3. Inserts matching attributes into vendor_attributes (idempotent)
 *   4. Also maps existing Product dietary booleans → attributes
 *
 * Non-matching tags are LEFT in Vendor.tags — no data loss.
 *
 * Usage: bun run prisma/migrate-tags-to-attributes.ts
 *
 * Idempotent: safe to run multiple times.
 */
import { PrismaClient } from "@prisma/client";
import { ALL_SEED_ATTRIBUTES } from "../src/lib/attributes/seed-data";

const db = new PrismaClient();

function normalizeTagToSlug(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log("🔄 Migrating vendor tags → Global Attribute System...\n");

  // Build the slug → attribute lookup from seed data
  const seedSlugs = new Set(ALL_SEED_ATTRIBUTES.map((a) => a.slug));

  // Also fetch any DB-created attributes (admin-added)
  const dbAttrs = await db.attribute.findMany({ select: { slug: true, id: true } });
  const slugToId = new Map(dbAttrs.map((a) => [a.slug, a.id]));
  console.log(`   ${slugToId.size} canonical attributes available`);

  // ── 1. Migrate Vendor.tags → vendor_attributes ──
  const vendors = await db.vendor.findMany({
    select: { id: true, name: true, tags: true },
  });
  console.log(`   Scanning ${vendors.length} vendors...\n`);

  let vendorsMatched = 0;
  let attributesLinked = 0;
  let unmatchedTags = 0;

  for (const v of vendors) {
    let tags: string[] = [];
    try {
      tags = JSON.parse(v.tags || "[]");
    } catch {
      continue;
    }
    if (!Array.isArray(tags) || tags.length === 0) continue;

    for (const tag of tags) {
      const slug = normalizeTagToSlug(tag);
      const attrId = slugToId.get(slug);
      if (attrId) {
        try {
          await db.vendorAttribute.create({
            data: { vendorId: v.id, attributeId: attrId },
          });
          attributesLinked++;
        } catch {
          // unique constraint = already exists, skip
        }
      } else {
        unmatchedTags++;
      }
    }
    if (tags.some((t) => slugToId.has(normalizeTagToSlug(t)))) {
      vendorsMatched++;
    }
  }

  console.log(`   ✅ Vendor tags: ${attributesLinked} attributes linked across ${vendorsMatched} vendors`);
  console.log(`   ℹ️  ${unmatchedTags} tags did not match canonical attributes (left in Vendor.tags)`);

  // ── 2. Migrate Product dietary booleans → product_attributes ──
  console.log(`\n   Migrating product dietary booleans...`);
  const products = await db.product.findMany({
    where: {
      OR: [
        { eggless: true },
        { vegan: true },
        { halal: true },
        { glutenFree: true },
        { sugarFree: true },
        { vegetarian: true },
      ],
    },
    select: {
      id: true, eggless: true, vegan: true, halal: true,
      glutenFree: true, sugarFree: true, vegetarian: true,
    },
  });

  const booleanToSlug: Record<string, string> = {
    eggless: "eggless",
    vegan: "vegan",
    halal: "halal",
    glutenFree: "gluten-free",
    sugarFree: "sugar-free",
    vegetarian: "vegetarian",
  };

  let productsMatched = 0;
  let productAttrsLinked = 0;

  for (const p of products) {
    let linked = false;
    for (const [field, slug] of Object.entries(booleanToSlug)) {
      if ((p as any)[field] === true) {
        const attrId = slugToId.get(slug);
        if (attrId) {
          try {
            await db.productAttribute.create({
              data: { productId: p.id, attributeId: attrId },
            });
            productAttrsLinked++;
            linked = true;
          } catch {
            // already exists
          }
        }
      }
    }
    if (linked) productsMatched++;
  }

  console.log(`   ✅ Product booleans: ${productAttrsLinked} attributes linked across ${productsMatched} products`);

  // ── Summary ──
  const totalVendorAttrs = await db.vendorAttribute.count();
  const totalProductAttrs = await db.productAttribute.count();
  console.log(`\n📊 Migration complete:`);
  console.log(`   Total vendor_attributes rows: ${totalVendorAttrs}`);
  console.log(`   Total product_attributes rows: ${totalProductAttrs}`);
  console.log(`\n   Non-matching tags remain in Vendor.tags — no data lost.`);
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
