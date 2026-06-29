/**
 * Seed the pricing table with annual totals.
 * Run: bun run prisma/seed-pricing.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Yearly total = monthly × 12 × 0.8 (20% discount)
const DEFAULTS = [
  { countryCode: "IN", countryLabel: "India — prices in ₹", symbol: "₹", proMonthly: 299, proYearlyTotal: 2871, businessMonthly: 499, businessYearlyTotal: 4790, note: "Prices in Indian Rupees. No transaction fees. Cancel anytime." },
  { countryCode: "US", countryLabel: "United States — prices in $", symbol: "$", proMonthly: 5, proYearlyTotal: 48, businessMonthly: 9, businessYearlyTotal: 86, note: "Prices in USD. No transaction fees. Cancel anytime." },
  { countryCode: "GB", countryLabel: "United Kingdom — prices in £", symbol: "£", proMonthly: 4, proYearlyTotal: 38, businessMonthly: 7, businessYearlyTotal: 67, note: "Prices in GBP. No transaction fees. Cancel anytime." },
  { countryCode: "AU", countryLabel: "Australia — prices in A$", symbol: "A$", proMonthly: 8, proYearlyTotal: 76, businessMonthly: 13, businessYearlyTotal: 124, note: "Prices in AUD. No transaction fees. Cancel anytime." },
  { countryCode: "AE", countryLabel: "UAE — prices in AED", symbol: "AED", proMonthly: 18, proYearlyTotal: 172, businessMonthly: 33, businessYearlyTotal: 316, note: "Prices in AED. No transaction fees. Cancel anytime." },
  { countryCode: "SG", countryLabel: "Singapore — prices in S$", symbol: "S$", proMonthly: 7, proYearlyTotal: 67, businessMonthly: 12, businessYearlyTotal: 115, note: "Prices in SGD. No transaction fees. Cancel anytime." },
  { countryCode: "NG", countryLabel: "Nigeria — prices in ₦", symbol: "₦", proMonthly: 2000, proYearlyTotal: 19152, businessMonthly: 3500, businessYearlyTotal: 33516, note: "Prices in NGN. No transaction fees. Cancel anytime." },
];

async function main() {
  console.log("Seeding pricing table (annual totals)...");
  for (const p of DEFAULTS) {
    try {
      await db.pricing.upsert({
        where: { countryCode: p.countryCode },
        update: p,
        create: { ...p, active: true },
      });
      console.log(`  ✅ ${p.countryCode}: ${p.symbol}${p.proMonthly}/mo, ${p.symbol}${p.proYearlyTotal}/yr | ${p.symbol}${p.businessMonthly}/mo, ${p.symbol}${p.businessYearlyTotal}/yr`);
    } catch (e) {
      console.error(`  ❌ ${p.countryCode}:`, (e as Error).message.slice(0, 80));
    }
  }
  console.log("Done.");
}

main().finally(() => db.$disconnect());
