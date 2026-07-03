/**
 * Vendor Import Service
 * Parses CSV data, detects duplicates, normalizes phone numbers,
 * detects country/country code, and creates vendors in bulk.
 */

import { db } from "@/lib/db";
import { COUNTRIES } from "@/lib/countries";

export interface ImportRow {
  name: string;
  whatsapp: string;
  ecosystem?: string;
  category?: string;
  city?: string;
  country?: string;
  tagline?: string;
}

export interface ParsedImport {
  rows: ImportRow[];
  duplicates: ImportRow[];
  invalid: { row: ImportRow; reason: string }[];
  total: number;
}

export interface ImportResult {
  created: number;
  failed: number;
  duplicates: number;
  vendors: { id: string; name: string; slug: string }[];
  errors: string[];
}

/**
 * Parse CSV text into import rows.
 * Expected columns: name, whatsapp, ecosystem, category, city, country, tagline
 */
export function parseCSV(csvText: string): ImportRow[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const nameIdx = headers.indexOf("name");
  const whatsappIdx = headers.indexOf("whatsapp");
  const ecosystemIdx = headers.indexOf("ecosystem");
  const categoryIdx = headers.indexOf("category");
  const cityIdx = headers.indexOf("city");
  const countryIdx = headers.indexOf("country");
  const taglineIdx = headers.indexOf("tagline");

  const rows: ImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (!values[nameIdx]?.trim()) continue;
    rows.push({
      name: values[nameIdx]?.trim() || "",
      whatsapp: values[whatsappIdx]?.trim() || "",
      ecosystem: ecosystemIdx >= 0 ? values[ecosystemIdx]?.trim() : undefined,
      category: categoryIdx >= 0 ? values[categoryIdx]?.trim() : undefined,
      city: cityIdx >= 0 ? values[cityIdx]?.trim() : undefined,
      country: countryIdx >= 0 ? values[countryIdx]?.trim() : undefined,
      tagline: taglineIdx >= 0 ? values[taglineIdx]?.trim() : undefined,
    });
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Normalize a phone number to international format.
 * Adds country code if missing.
 */
export function normalizePhone(phone: string, country?: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  // If starts with 00, replace with +
  if (cleaned.startsWith("00")) return "+" + cleaned.slice(2);
  // Try to detect country code from the country name
  if (country) {
    const countryInfo = COUNTRIES.find(c =>
      c.name.toLowerCase() === country.toLowerCase() ||
      c.code.toLowerCase() === country.toLowerCase()
    );
    if (countryInfo && !cleaned.startsWith(countryInfo.dialCode)) {
      return `+${countryInfo.dialCode} ${cleaned}`;
    }
  }
  // Default: if 10 digits, assume India
  if (cleaned.length === 10) return `+91 ${cleaned}`;
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

/**
 * Detect country and country code from a country name or phone number.
 */
export function detectCountry(country?: string, phone?: string): { country: string; countryCode: string; currency: string; continent: string } {
  // Try from country name
  if (country) {
    const info = COUNTRIES.find(c =>
      c.name.toLowerCase() === country.toLowerCase() ||
      c.code.toLowerCase() === country.toLowerCase()
    );
    if (info) {
      return { country: info.name, countryCode: info.code, currency: info.currency, continent: info.continent };
    }
  }
  // Try from phone dialing code
  if (phone) {
    const cleaned = phone.replace(/[^\d]/g, "");
    for (const info of COUNTRIES) {
      if (cleaned.startsWith(info.dialCode)) {
        return { country: info.name, countryCode: info.code, currency: info.currency, continent: info.continent };
      }
    }
  }
  // Default to India
  return { country: "India", countryCode: "IN", currency: "INR", continent: "Asia" };
}

/**
 * Auto-select ecosystem based on category.
 */
export function detectEcosystem(category?: string): "FINDMYBITES" | "PIMPMYPARTY" {
  if (!category) return "FINDMYBITES";
  const foodCategories = ["bakers-bakery", "caterers", "chef-staff", "food-trucks", "beverage-specialists", "specialty-food"];
  const cat = category.toLowerCase().replace(/\s+/g, "-");
  return foodCategories.includes(cat) ? "FINDMYBITES" : "PIMPMYPARTY";
}

/**
 * Validate and prepare import rows.
 * Checks for duplicates (by name or WhatsApp number).
 */
export async function prepareImport(rows: ImportRow[]): Promise<ParsedImport> {
  const valid: ImportRow[] = [];
  const duplicates: ImportRow[] = [];
  const invalid: { row: ImportRow; reason: string }[] = [];

  // Fetch existing vendor names + WhatsApp numbers
  const existing = await db.vendor.findMany({
    select: { name: true, whatsapp: true },
    take: 10000,
  });
  const existingNames = new Set(existing.map(v => v.name.toLowerCase()));
  const existingPhones = new Set(existing.map(v => v.whatsapp?.replace(/\D/g, "")));

  const seenNames = new Set<string>();
  const seenPhones = new Set<string>();

  for (const row of rows) {
    if (!row.name?.trim()) {
      invalid.push({ row, reason: "Missing name" });
      continue;
    }
    if (!row.whatsapp?.trim()) {
      invalid.push({ row, reason: "Missing WhatsApp number" });
      continue;
    }

    const nameLower = row.name.toLowerCase();
    const phoneDigits = row.whatsapp.replace(/\D/g, "");

    // Check against existing DB
    if (existingNames.has(nameLower) || existingPhones.has(phoneDigits)) {
      duplicates.push(row);
      continue;
    }
    // Check within this batch
    if (seenNames.has(nameLower) || seenPhones.has(phoneDigits)) {
      duplicates.push(row);
      continue;
    }

    seenNames.add(nameLower);
    seenPhones.add(phoneDigits);
    valid.push(row);
  }

  return { rows: valid, duplicates, invalid, total: rows.length };
}

/**
 * Create vendors from import rows.
 * All vendors are created as: approved=true, invite_type='admin'.
 */
export async function executeImport(rows: ImportRow[]): Promise<ImportResult> {
  const created: { id: string; name: string; slug: string }[] = [];
  const errors: string[] = [];
  let failed = 0;

  for (const row of rows) {
    try {
      const { country, countryCode, currency, continent } = detectCountry(row.country, row.whatsapp);
      const whatsapp = normalizePhone(row.whatsapp, row.country);
      const ecosystem = (row.ecosystem as "FINDMYBITES" | "PIMPMYPARTY") || detectEcosystem(row.category);

      const baseSlug = row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const slug = `${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;

      const vendor = await db.vendor.create({
        data: {
          name: row.name.trim(),
          slug,
          ecosystem,
          category: row.category || "bakers-bakery",
          tagline: row.tagline || `Welcome to ${row.name.trim()}`,
          description: "",
          city: row.city || "Unknown",
          country,
          countryCode,
          continent,
          currency,
          priceRange: "₹₹",
          basePrice: 0,
          rating: 0,
          reviewCount: 0,
          heroImage: "",
          avatarImage: "",
          gallery: "[]",
          tags: "[]",
          featured: false,
          verified: false,
          approved: true,
          responseTime: "Under 24 hours",
          yearsActive: 1,
          completedBookings: 0,
          ownership_status: "unclaimed",
          invite_type: "admin",
          whatsapp,
        },
      });

      created.push({ id: vendor.id, name: vendor.name, slug: vendor.slug });
    } catch (err: any) {
      failed++;
      errors.push(`Failed: ${row.name} — ${err.message?.slice(0, 100)}`);
    }
  }

  return {
    created: created.length,
    failed,
    duplicates: 0,
    vendors: created,
    errors,
  };
}

/**
 * Generate a CSV template for vendor import.
 */
export function generateCSVTemplate(): string {
  return "name,whatsapp,ecosystem,category,city,country,tagline\n" +
    "Sugar & Bloom Bakery,+91 98765 43210,FINDMYBITES,bakers-bakery,Mumbai,India,Custom wedding cakes since 2015\n" +
    "DJ Beats,+91 98765 11111,PIMPMYPARTY,djs,Delhi,India,Professional DJ for all events\n";
}
