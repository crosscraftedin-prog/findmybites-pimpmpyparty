/**
 * Billing Module — Countries
 *
 * Supported countries for subscription billing.
 * Maps ISO country codes to display names.
 */

export interface CountryInfo {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  currency: string; // ISO 4217
  currencySymbol: string;
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  { code: "IN", name: "India", currency: "INR", currencySymbol: "₹" },
  { code: "US", name: "United States", currency: "USD", currencySymbol: "$" },
  { code: "GB", name: "United Kingdom", currency: "GBP", currencySymbol: "£" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", currencySymbol: "AED" },
  { code: "AU", name: "Australia", currency: "AUD", currencySymbol: "A$" },
  { code: "SG", name: "Singapore", currency: "SGD", currencySymbol: "S$" },
  { code: "CA", name: "Canada", currency: "CAD", currencySymbol: "CA$" },
  { code: "NG", name: "Nigeria", currency: "NGN", currencySymbol: "₦" },
  { code: "ZA", name: "South Africa", currency: "ZAR", currencySymbol: "R" },
];

export const FALLBACK_COUNTRY = "US";

export function getCountryInfo(code: string): CountryInfo {
  return SUPPORTED_COUNTRIES.find(c => c.code === code)
    || { code: FALLBACK_COUNTRY, name: "United States", currency: "USD", currencySymbol: "$" };
}

export function isCountrySupported(code: string): boolean {
  return SUPPORTED_COUNTRIES.some(c => c.code === code);
}

export function getCurrencyForCountry(code: string): string {
  return getCountryInfo(code).currency;
}

export function getCurrencySymbolForCountry(code: string): string {
  return getCountryInfo(code).currencySymbol;
}
