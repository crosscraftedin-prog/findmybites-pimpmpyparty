/**
 * Seed the Category and Subcategory tables from the hardcoded constants in
 * src/lib/constants.ts.
 *
 * The app currently uses CATEGORIES + SUBCATEGORIES constants for all
 * category logic (create-vendor form, filters, category pages). The
 * Category/Subcategory DB tables exist in the Prisma schema as
 * "future-proof" master tables but were never populated.
 *
 * This script populates them so the admin panel can eventually manage
 * categories via the DB instead of code.
 *
 * Usage: bun run prisma/seed-categories.ts
 */

import { PrismaClient } from "@prisma/client";
import { CATEGORIES, SUBCATEGORIES } from "../src/lib/constants";

const db = new PrismaClient();

function slugifySubcat(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("🏷️  Seeding Category & Subcategory tables...");

  // Wipe existing (idempotent re-runs)
  await db.subcategory.deleteMany();
  await db.category.deleteMany();

  let catCount = 0;
  let subCount = 0;

  for (const cat of CATEGORIES) {
    // Create the Category row
    const created = await db.category.create({
      data: {
        id: cat.id, // use the constant's id as the PK (e.g. "cake-artists")
        slug: cat.id,
        label: cat.label,
        ecosystem: cat.ecosystem as string,
        description: cat.description ?? null,
        icon: cat.icon ?? null,
        image: cat.image ?? null,
        accent: cat.accent ?? null,
        sortOrder: catCount,
        active: true,
      },
    });
    catCount++;

    // Create subcategories for this category
    const subs = SUBCATEGORIES[cat.id] ?? [];
    for (let i = 0; i < subs.length; i++) {
      const label = subs[i];
      const slug = slugifySubcat(label);
      await db.subcategory.create({
        data: {
          slug: `${cat.id}-${slug}`, // namespaced to avoid collisions
          label,
          categoryId: created.id,
          sortOrder: i,
          active: true,
        },
      });
      subCount++;
    }
  }

  console.log(`✅ Seeded ${catCount} categories and ${subCount} subcategories.`);
  console.log("\nBreakdown by ecosystem:");
  const fmb = CATEGORIES.filter((c) => c.ecosystem === "FINDMYBITES");
  const pmp = CATEGORIES.filter((c) => c.ecosystem === "PIMPMYPARTY");
  console.log(`  FindMyBites: ${fmb.length} categories`);
  console.log(`  PimpMyParty: ${pmp.length} categories`);

  await db.$disconnect();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  db.$disconnect();
  process.exit(1);
});
