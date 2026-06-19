import { CATEGORIES, SUBCATEGORIES } from "../src/lib/constants";

function esc(s: string): string {
  return String(s ?? "").replace(/'/g, "''");
}
function slugifySubcat(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

console.log("-- Seed Category & Subcategory tables");
console.log("-- Generated from src/lib/constants.ts");
console.log("-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)");
console.log("");
console.log("-- Wipe existing (idempotent re-runs)");
console.log('DELETE FROM "Subcategory";');
console.log('DELETE FROM "Category";');
console.log("");

let catIdx = 0;
for (const cat of CATEGORIES) {
  console.log(
    `INSERT INTO "Category" (id, slug, label, ecosystem, description, icon, image, accent, "sortOrder", active, "createdAt")`
  );
  console.log(
    `VALUES ('${esc(cat.id)}', '${esc(cat.id)}', '${esc(cat.label)}', '${esc(cat.ecosystem)}', ${
      cat.description ? `'${esc(cat.description)}'` : "NULL"
    }, ${cat.icon ? `'${esc(cat.icon)}'` : "NULL"}, ${
      cat.image ? `'${esc(cat.image)}'` : "NULL"
    }, ${cat.accent ? `'${esc(cat.accent)}'` : "NULL"}, ${catIdx}, true, NOW())`
  );
  console.log(
    'ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, label=EXCLUDED.label, ecosystem=EXCLUDED.ecosystem, description=EXCLUDED.description, icon=EXCLUDED.icon, image=EXCLUDED.image, accent=EXCLUDED.accent, "sortOrder"=EXCLUDED."sortOrder", active=true;'
  );
  console.log("");
  catIdx++;
}

for (const cat of CATEGORIES) {
  const subs = SUBCATEGORIES[cat.id] ?? [];
  let i = 0;
  for (const label of subs) {
    const slug = `${cat.id}-${slugifySubcat(label)}`;
    console.log(
      `INSERT INTO "Subcategory" (id, slug, label, "categoryId", "sortOrder", active, "createdAt")`
    );
    console.log(
      `VALUES (gen_random_uuid()::text, '${esc(slug)}', '${esc(label)}', '${esc(cat.id)}', ${i}, true, NOW())`
    );
    console.log(
      'ON CONFLICT (slug) DO UPDATE SET label=EXCLUDED.label, "categoryId"=EXCLUDED."categoryId", "sortOrder"=EXCLUDED."sortOrder", active=true;'
    );
    i++;
  }
}

console.log("");
const subTotal = Object.values(SUBCATEGORIES).reduce((acc, arr) => acc + arr.length, 0);
console.log(`-- Done: ${CATEGORIES.length} categories, ${subTotal} subcategories`);
