"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getLegacySectionsForCategory,
  getAllergenWarningText,
  type ProductInfo,
  type InfoSection,
  type InfoField,
} from "@/lib/products/product-info";

/**
 * ProductInfoDisplay — renders structured product information on the public
 * product page as SEPARATE COLLAPSIBLE CARDS (not one long section).
 *
 * Each section (Ingredients, Packaging, Storage, Allergens, Nutrition, etc.)
 * is its own card with an H2 heading for SEO. Cards collapse on mobile and
 * expand on desktop.
 *
 * Template-driven: sections come from the `infoSections` prop (from the
 * active template) or fall back to the legacy category lookup.
 */
export function ProductInfoDisplay({
  productInfo,
  infoSections,
  category,
}: {
  productInfo: ProductInfo;
  /** Template-driven sections. If omitted, falls back to category. */
  infoSections?: InfoSection[];
  category?: string | null;
}) {
  const sections = React.useMemo(() => {
    if (infoSections && infoSections.length > 0) return infoSections;
    return getLegacySectionsForCategory(category);
  }, [infoSections, category]);

  // Filter to only sections that have data, respecting showWhen
  const visibleSections = sections.filter((section) => {
    // Check showWhen condition
    if (section.showWhen) {
      const val = (productInfo as any)[section.showWhen.field];
      if (section.showWhen.truthy && !val) return false;
      if (!section.showWhen.truthy && val) return false;
    }
    // Check if any visible field has data
    const visibleFields = section.fields.filter((field) => {
      if (!field.showWhen) return true;
      const val = (productInfo as any)[field.showWhen.field];
      return val === field.showWhen.equals;
    });
    return visibleFields.some((field) => fieldHasData(field, productInfo));
  });

  if (visibleSections.length === 0) return null;

  return (
    <div className="space-y-3">
      {visibleSections.map((section) => (
        <SectionDisplay
          key={section.key}
          section={section}
          productInfo={productInfo}
        />
      ))}

      {/* Allergen warning banner (auto-generated if allergens are selected) */}
      {getAllergenWarningText(productInfo) && (
        <AllergenWarning productInfo={productInfo} />
      )}
    </div>
  );
}

function fieldHasData(field: InfoField, info: ProductInfo): boolean {
  const val = (info as any)[field.key];
  if (val === undefined || val === null || val === "") return false;
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
}

function SectionDisplay({
  section,
  productInfo,
}: {
  section: InfoSection;
  productInfo: ProductInfo;
}) {
  const [collapsed, setCollapsed] = React.useState(false);

  // Filter fields by showWhen and data presence
  const visibleFields = section.fields.filter((field) => {
    if (!field.showWhen) return true;
    const val = (productInfo as any)[field.showWhen.field];
    return val === field.showWhen.equals;
  });

  const fieldsWithData = visibleFields.filter((field) =>
    fieldHasData(field, productInfo)
  );

  if (fieldsWithData.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Desktop header (always visible) + Mobile collapsible header */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 p-4 text-left hover:bg-muted/30 sm:cursor-default"
        aria-expanded={!collapsed}
      >
        <span className="text-lg">{section.icon}</span>
        <h2 className="text-sm font-bold sm:text-base">{section.heading}</h2>
        <ChevronIcon collapsed={collapsed} className="ml-auto sm:hidden" />
      </button>

      <div className={cn("px-4 pb-4", collapsed && "hidden sm:block")}>
        <div className="space-y-3">
          {fieldsWithData.map((field) => (
            <FieldDisplay
              key={field.key}
              field={field}
              value={(productInfo as any)[field.key]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldDisplay({
  field,
  value,
}: {
  field: InfoField;
  value: unknown;
}) {
  if (field.type === "checkboxes") {
    const selected: string[] = Array.isArray(value) ? value : [];
    if (selected.length === 0) return null;
    return (
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">{field.label}</p>
        <div className="flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "checkbox") {
    if (!value) return null;
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="inline-flex size-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          ✓
        </span>
        <span>{field.label}</span>
      </div>
    );
  }

  // text, richtext, textarea, select — all render as text
  // richtext preserves line breaks (whitespace-pre-line)
  const strVal = String(value);
  if (!strVal.trim()) return null;

  const isRichText = field.type === "richtext" || field.type === "textarea";

  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
      <p className="text-xs font-medium text-muted-foreground sm:text-sm">{field.label}</p>
      <p className={cn("text-sm text-foreground/90", isRichText && "whitespace-pre-line")}>{strVal}</p>
    </div>
  );
}

function ChevronIcon({ collapsed, className }: { collapsed: boolean; className?: string }) {
  return (
    <svg
      className={cn("size-4 text-muted-foreground transition-transform", !collapsed && "rotate-180", className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ── Allergen warning ───────────────────────────────────────────────────────

function AllergenWarning({ productInfo }: { productInfo: ProductInfo }) {
  const warningText = getAllergenWarningText(productInfo);
  if (!warningText) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/20">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">
            ⚠️ Allergen Warning
          </p>
          <p className="mt-0.5 text-sm text-red-700 dark:text-red-400">
            This product contains: <strong>{warningText}</strong>
          </p>
          {productInfo.facilityWarning?.trim() && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-500">
              {productInfo.facilityWarning}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
