"use client";

import * as React from "react";

/**
 * Type definitions for the Product Wizard step renderers.
 *
 * The wizard uses a CollapsibleCard layout (not a stepper). Each card directly
 * calls its renderer from the STEP_RENDERERS registry — no DynamicWizardRenderer
 * component is needed anymore. These types remain for the registry shape.
 */

/**
 * Step types supported by the wizard's STEP_RENDERERS registry.
 * Each card in the wizard maps to one of these types.
 */
export type StepType =
  | "basic"       // Card 1: Basic Information
  | "photos"      // Sub-renderer (composed into basic)
  | "pricing"     // Sub-renderer (composed into basic)
  | "fields"      // Sub-renderer (composed into details + options)
  | "seo"         // Sub-renderer (composed into marketing)
  | "inventory"   // Sub-renderer (composed into delivery)
  | "details"     // Card 2: Product Details
  | "options"     // Card 3: Variants & Customisation
  | "delivery"    // Card 4: Delivery & Availability
  | "marketing"   // Card 5: Marketing & SEO
  | "success"     // Post-publish success screen
  | "recipeCost"; // Card 6: Recipe Cost Calculator

/**
 * Props passed to every step render function.
 * These are the shared state + callbacks the wizard provides.
 */
export interface WizardRenderProps {
  form: Record<string, unknown>;
  set: (key: string, value: unknown) => void;
  vendor: any;
  isFood: boolean;
  symbol: string;
  productInfo: any;
  setProductInfo: (info: any) => void;
  productAttributeIds: string[];
  setProductAttributeIds: (ids: string[]) => void;
  productSubcategories: { id: string; name: string }[];
  autoSave: () => void;
  generateWithAI: () => void;
  generateSEO: () => void;
  aiGenerating: boolean;
  saving: boolean;
  published: boolean;
  publishError: string | null;
  savedProductSlug: string | null;
  onClose: () => void;
  onContinueEditing?: () => void;     // dismiss success screen
  completenessPercent?: number;       // progress bar after publish
  showPreview?: boolean;              // preview modal toggle
  setShowPreview?: (v: boolean) => void;
  [key: string]: unknown;
}

/**
 * Registry: stepType → render function.
 * The wizard calls the render function directly for each card.
 */
export type StepRenderer = (props: WizardRenderProps) => React.ReactNode;
