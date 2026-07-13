"use client";

import * as React from "react";

/**
 * DynamicWizardRenderer — the ONLY component that renders wizard step content.
 * ─────────────────────────────────────────────────────────────────────────
 * V3 Final: The wizard step LIST and step CONTENT are both 100% template-driven.
 *
 * How it works:
 *   1. The wizard fetches steps from /api/templates/v3/wizard (or FALLBACK_STEPS).
 *   2. Each step has a `stepType` field (from template metadata).
 *   3. DynamicWizardRenderer looks up the current step's stepType.
 *   4. It calls the render function registered for that stepType.
 *   5. The render function receives shared props (form, set, etc.).
 *
 * Step types:
 *   "basic"      — Basic Info form (name, category, description, AI writer)
 *   "photos"     — Photo/video upload
 *   "pricing"    — Price fields + options
 *   "variants"   — Variant cards (add/remove/resize)
 *   "attributes" — Product attributes + delivery/pickup
 *   "fields"     — Dynamic fields from template sections (Product Info, Customisation, etc.)
 *   "seo"        — SEO settings + AI generate
 *   "inventory"  — Stock, scheduling, featured
 *   "preview"    — Live preview + publish button
 *
 * Admins can:
 *   - Reorder steps (change the `step` field in template.wizard JSON)
 *   - Rename steps (change the `title` field)
 *   - Add steps (add a new entry to template.wizard JSON)
 *   - Remove steps (remove an entry)
 *   - Move fields between steps (change the `section` field on TemplateField rows,
 *     and update which sections belong to each step in template.wizard JSON)
 *
 * No `step === N` conditionals exist in the wizard. The renderer is the single
 * entry point for all step content.
 */

export type StepType =
  | "basic"
  | "photos"
  | "pricing"
  | "variants"
  | "attributes"
  | "fields"
  | "seo"
  | "inventory"
  | "preview";

export interface DynamicStep {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  stepType: StepType;
  sections?: string[]; // for "fields" type: which section keys to render
  showVendorOnly?: boolean; // for "fields" type: show vendor-only sections
}

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
  aiSeoLoading: boolean;
  saving: boolean;
  published: boolean;
  publishError: string | null;
  savedProductSlug: string | null;
  onPublish: () => void;
  onClose: () => void;
  router: { push: (url: string) => void };
  [key: string]: unknown;
}

/**
 * Registry: stepType → render function.
 * The wizard provides this registry. DynamicWizardRenderer looks up the
 * current step's type and calls the render function.
 */
export type StepRenderer = (props: WizardRenderProps) => React.ReactNode;

export interface DynamicWizardRendererProps {
  steps: DynamicStep[];
  currentStep: number;
  renderers: Record<StepType, StepRenderer>;
  sharedProps: WizardRenderProps;
}

/**
 * DynamicWizardRenderer — renders the current step's content.
 *
 * Usage:
 *   <DynamicWizardRenderer
 *     steps={STEPS}
 *     currentStep={step}
 *     renderers={STEP_RENDERERS}
 *     sharedProps={{ form, set, vendor, ... }}
 *   />
 */
export function DynamicWizardRenderer({
  steps,
  currentStep,
  renderers,
  sharedProps,
}: DynamicWizardRendererProps) {
  // Find the current step
  const currentStepData = steps.find((s) => s.id === currentStep);

  if (!currentStepData) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Step not found. This may happen if the template was edited while the wizard was open.
      </div>
    );
  }

  // Look up the renderer for this step type
  const renderer = renderers[currentStepData.stepType];

  if (!renderer) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No renderer registered for step type "{currentStepData.stepType}".
        <br />
        Add a renderer for this step type in the wizard's STEP_RENDERERS registry.
      </div>
    );
  }

  // Call the renderer with shared props + step-specific props
  return (
    <>
      {renderer({
        ...sharedProps,
        stepSections: currentStepData.sections,
        stepShowVendorOnly: currentStepData.showVendorOnly,
      })}
    </>
  );
}
