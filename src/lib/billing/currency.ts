/**
 * Billing Module — Currency
 *
 * Currency utilities for the billing system.
 * Never manually convert currencies — always use configured local pricing.
 */

import { getCountryInfo } from "./countries";

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  GBP: "£",
  AED: "AED",
  AUD: "A$",
  SGD: "S$",
  CAD: "CA$",
  NGN: "₦",
  ZAR: "R",
};

export const CURRENCY_NAMES: Record<string, string> = {
  INR: "Indian Rupee",
  USD: "US Dollar",
  GBP: "British Pound",
  AED: "UAE Dirham",
  AUD: "Australian Dollar",
  SGD: "Singapore Dollar",
  CAD: "Canadian Dollar",
  NGN: "Nigerian Naira",
  ZAR: "South African Rand",
};

/**
 * Get the currency symbol for a country code.
 */
export function getCurrencySymbol(countryCode: string): string {
  return getCountryInfo(countryCode).currencySymbol;
}

/**
 * Get the ISO currency code for a country code.
 */
export function getCurrencyCode(countryCode: string): string {
  return getCountryInfo(countryCode).currency;
}

/**
 * Convert a display amount (main unit) to minor units (paise/cents/fils).
 * e.g. ₹299 → 29900 paise, $5 → 500 cents
 */
export function toMinorUnits(displayAmount: number): number {
  return Math.round(displayAmount * 100);
}

/**
 * Convert minor units to display amount.
 * e.g. 29900 → 299, 500 → 5
 */
export function toDisplayAmount(minorUnits: number): number {
  return minorUnits / 100;
}

/**
 * Format a display amount with the currency symbol.
 * e.g. (299, "INR") → "₹299", (5, "USD") → "$5"
 */
export function formatPrice(displayAmount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency + " ";
  return `${symbol}${displayAmount.toLocaleString("en-US")}`;
}

/**
 * Format a minor-unit amount with the currency symbol.
 * e.g. (29900, "INR") → "₹299"
 */
export function formatMinorAmount(minorAmount: number, currency: string): string {
  return formatPrice(toDisplayAmount(minorAmount), currency);
}
