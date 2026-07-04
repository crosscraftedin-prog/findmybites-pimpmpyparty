/**
 * Client-safe constants & types for the AI listing generator.
 * This file has ZERO server-only imports so it can be imported from
 * "use client" components.
 */

export type WritingStyle = "professional" | "friendly" | "luxury" | "premium" | "casual" | "seo";

export const WRITING_STYLES: { value: WritingStyle; label: string; desc: string }[] = [
  { value: "professional", label: "Professional", desc: "Polished, business-appropriate" },
  { value: "friendly", label: "Friendly", desc: "Warm, approachable, conversational" },
  { value: "luxury", label: "Luxury", desc: "Sophisticated, exclusive, high-end" },
  { value: "premium", label: "Premium", desc: "Upscale, refined, quality-focused" },
  { value: "casual", label: "Casual", desc: "Relaxed, informal, everyday" },
  { value: "seo", label: "SEO Optimized", desc: "Keyword-rich for Google ranking" },
];

export interface VendorListingInput {
  vendorId?: string;
  businessName: string;
  marketplace: string;
  category: string;
  subcategory?: string;
  city?: string;
  country?: string;
  specialities?: string;
  yearsExperience?: string;
  deliveryOptions?: string;
  customOrders?: boolean;
  languages?: string;
  priceRange?: string;
  tags?: string;
}

export interface AiListingResult {
  description: string;
  tagline: string;
  keywords: string[];
  businessTags: string[];
  services: string[];
}
