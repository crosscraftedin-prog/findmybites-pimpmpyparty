/**
 * Seed the Global Attribute System with canonical attributes.
 *
 * Usage: bun run prisma/seed-attributes.ts
 *
 * Idempotent: safe to run multiple times. Updates existing, creates missing.
 * Does NOT delete admin-created attributes not in the seed.
 */
import { PrismaClient } from "@prisma/client";
import { ALL_SEED_ATTRIBUTES, ATTRIBUTE_GROUPS } from "../src/lib/attributes/seed-data";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Global Attribute System...");
  console.log(`   ${ALL_SEED_ATTRIBUTES.length} canonical attributes across ${ATTRIBUTE_GROUPS.length} groups`);

  let created = 0;
  let updated = 0;

  for (let i = 0; i < ALL_SEED_ATTRIBUTES.length; i++) {
    const a = ALL_SEED_ATTRIBUTES[i];
    const data = {
      slug: a.slug,
      name: a.name,
      group: a.group,
      icon: a.icon ?? null,
      color: a.color ?? null,
      description: a.description ?? null,
      ecosystem: a.ecosystem ?? "BOTH",
      sortOrder: i,
      active: true,
    };

    const existing = await db.attribute.findUnique({ where: { slug: a.slug } });
    if (existing) {
      await db.attribute.update({
        where: { slug: a.slug },
        data: {
          name: data.name,
          group: data.group,
          icon: data.icon,
          color: data.color,
          description: data.description,
          sortOrder: data.sortOrder,
        },
      });
      updated++;
    } else {
      await db.attribute.create({ data });
      created++;
    }
  }

  const total = await db.attribute.count();
  console.log(`✅ Done: ${created} created, ${updated} updated, ${total} total attributes in DB`);

  // Print group summary
  for (const g of ATTRIBUTE_GROUPS) {
    const count = await db.attribute.count({ where: { group: g.key } });
    console.log(`   ${g.label}: ${count}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
