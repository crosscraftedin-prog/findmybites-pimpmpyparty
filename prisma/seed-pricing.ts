/**
 * Seed the pricing table with default values for 7 countries.
 * Run: bun run prisma/seed-pricing.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const DEFAULTS = [
  { countryCode: "IN", countryLabel: "India — prices in ₹", symbol: "₹", proMonthly: 299, proYearly: 239, businessMonthly: 499, businessYearly: 399, note: "Prices in Indian Rupees. No transaction fees. Cancel anytime." },
  { countryCode: "US", countryLabel: "United States — prices in $", symbol: "$", proMonthly: 5, proYearly: 4, businessMonthly: 9, businessYearly: 7, note: "Prices in USD. No transaction fees. Cancel anytime." },
  { countryCode: "GB", countryLabel: "United Kingdom — prices in £", symbol: "£", proMonthly: 4, proYearly: 3, businessMonthly: 7, businessYearly: 6, note: "Prices in GBP. No transaction fees. Cancel anytime." },
  { countryCode: "AU", countryLabel: "Australia — prices in A$", symbol: "A$", proMonthly: 8, proYearly: 6, businessMonthly: 13, businessYearly: 10, note: "Prices in AUD. No transaction fees. Cancel anytime." },
  { countryCode: "AE", countryLabel: "UAE — prices in AED", symbol: "AED", proMonthly: 18, proYearly: 14, businessMonthly: 33, businessYearly: 26, note: "Prices in AED. No transaction fees. Cancel anytime." },
  { countryCode: "SG", countryLabel: "Singapore — prices in S$", symbol: "S$", proMonthly: 7, proYearly: 6, businessMonthly: 12, businessYearly: 10, note: "Prices in SGD. No transaction fees. Cancel anytime." },
  { countryCode: "NG", countryLabel: "Nigeria — prices in ₦", symbol: "₦", proMonthly: 2000, proYearly: 1600, businessMonthly: 3500, businessYearly: 2800, note: "Prices in NGN. No transaction fees. Cancel anytime." },
];

async function main() {
  console.log("Seeding pricing table...");
  for (const p of DEFAULTS) {
    try {
      await db.pricing.upsert({
        where: { countryCode: p.countryCode },
        update: p,
        create: { ...p, active: true },
      });
      console.log(`  ✅ ${p.countryCode}: ${p.symbol}${p.proMonthly} / ${p.symbol}${p.businessMonthly}`);
    } catch (e) {
      console.error(`  ❌ ${p.countryCode}:`, (e as Error).message.slice(0, 80));
    }
  }
  console.log("Done.");
}

main().finally(() => db.$disconnect());
