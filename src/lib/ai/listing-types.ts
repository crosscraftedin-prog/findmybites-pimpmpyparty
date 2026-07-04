/**
 * Client-safe constants & types for the AI business setup assistant.
 * This file has ZERO server-only imports so it can be imported from
 * "use client" components.
 */

export type WritingStyle = "professional" | "friendly" | "luxury" | "premium" | "casual" | "seo" | "modern" | "creative" | "minimal";

export const WRITING_STYLES: { value: WritingStyle; label: string; desc: string }[] = [
  { value: "professional", label: "Professional", desc: "Polished, business-appropriate" },
  { value: "luxury", label: "Luxury", desc: "Sophisticated, exclusive, high-end" },
  { value: "friendly", label: "Friendly", desc: "Warm, approachable, conversational" },
  { value: "modern", label: "Modern", desc: "Clean, contemporary, forward-thinking" },
  { value: "creative", label: "Creative", desc: "Imaginative, expressive, unique" },
  { value: "minimal", label: "Minimal", desc: "Simple, concise, to-the-point" },
  { value: "seo", label: "SEO Optimized", desc: "Keyword-rich for Google ranking" },
  { value: "premium", label: "Premium", desc: "Upscale, refined, quality-focused" },
  { value: "casual", label: "Casual", desc: "Relaxed, informal, everyday" },
];

export interface VendorSetupInput {
  vendorId?: string;
  businessName: string;
  marketplace: string;
  category: string;
  subcategory?: string;
  city?: string;
  state?: string;
  country?: string;
  whatsapp?: string;
  logoUrl?: string;
  coverUrl?: string;
  specialities?: string;
  yearsExperience?: string;
  deliveryOptions?: string;
  customOrders?: boolean;
  languages?: string;
  priceRange?: string;
  tags?: string;
}

/** Full AI-generated business profile. */
export interface AiBusinessProfile {
  description: string;
  shortDescription: string;
  tagline: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  tags: string[];
  services: string[];
  whyChooseUs: string[];
  highlights: string[];
  customerPromise: string;
  faq: { question: string; answer: string }[];
  socialBio: string;
}

/** AI image analysis result (from logo/cover upload). */
export interface AiImageAnalysis {
  primaryColors: string[];
  brandTheme: string;
  recommendedHomepageColors: string[];
  coverLayoutSuggestion: string;
  brandPersonality: string[];
}

/** Profile completeness breakdown. */
export interface ProfileCompleteness {
  businessInfo: number;
  logo: number;
  description: number;
  seo: number;
  gallery: number;
  overall: number;
}

/** AI recommendation item. */
export interface AiRecommendation {
  id: string;
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
  action: string;
  done: boolean;
}
