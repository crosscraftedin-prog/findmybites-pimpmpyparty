"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSectionsForTemplate,
  getAllergenWarningText,
  getAllHighlights,
  getShelfLifeText,
  type ProductInfo,
  type InfoSection,
  type InfoField,
} from "@/lib/products/product-info";

/**
 * ProductInfoDisplay V2 — renders structured product information on the public
 * product page as SEPARATE COLLAPSIBLE CARDS.
 *
 * - Lazy-loads sections (only renders sections with data).
 * - Semantic HTML: H2 headings, H3 subheadings, lists, structured paragraphs.
 * - Mobile: accordion (collapsible cards).
 * - Desktop: expanded cards.
 * - Filters out vendor-only sections (Recipe Cost Calculator never shown publicly).
 * - Template-driven: sections come from `infoSections` prop.
 */
export function ProductInfoDisplay({
  productInfo,
  infoSections,
}: {
  productInfo: ProductInfo;
  infoSections?: InfoSection[];
}) {
  const sections = React.useMemo(
    () => getSectionsForTemplate({ infoSections }),
    [infoSections]
  );

  // Filter to only sections that have data, respecting showWhen + vendorOnly
  const visibleSections = sections.filter((section) => {
    // Never show vendor-only sections publicly
    const isVendorOnly = section.fields.every((f) => f.vendorOnly);
    if (isVendorOnly) return false;

    // Check showWhen
    if (section.showWhen) {
      const val = (productInfo as any)[section.showWhen.field];
      if (section.showWhen.truthy && !val) return false;
      if (!section.showWhen.truthy && val) return false;
    }

    // Check if any visible field has data
    const visibleFields = section.fields.filter((field) => {
      if (field.vendorOnly) return false;
      if (field.showWhen) {
        const val = getNestedValue(productInfo, field.showWhen.field);
        return val === field.showWhen.equals;
      }
      return true;
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

      {/* Allergen warning banner */}
      {getAllergenWarningText(productInfo) && (
        <AllergenWarning productInfo={productInfo} />
      )}
    </div>
  );
}

function getNestedValue(obj: any, key: string): unknown {
  if (key.includes(".")) {
    const [parent, child] = key.split(".");
    return obj[parent]?.[child];
  }
  return obj[key];
}

function fieldHasData(field: InfoField, info: ProductInfo): boolean {
  const val = getNestedValue(info, field.key);
  if (val === undefined || val === null || val === "" || val === false) return false;
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

  const visibleFields = section.fields.filter((field) => {
    if (field.vendorOnly) return false;
    if (field.showWhen) {
      const val = getNestedValue(productInfo, field.showWhen.field);
      return val === field.showWhen.equals;
    }
    return true;
  });

  const fieldsWithData = visibleFields.filter((field) =>
    fieldHasData(field, productInfo)
  );

  if (fieldsWithData.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
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
              value={getNestedValue(productInfo, field.key)}
              productInfo={productInfo}
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
  productInfo,
}: {
  field: InfoField;
  value: unknown;
  productInfo: ProductInfo;
}) {
  if (field.type === "checkboxes") {
    const selected: string[] = Array.isArray(value) ? value : [];

    // Special handling for highlights — combine built-in + custom
    if (field.key === "highlights") {
      const allHighlights = getAllHighlights(productInfo);
      if (allHighlights.length === 0) return null;
      return (
        <div>
          <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">{field.label}</h3>
          <div className="flex flex-wrap gap-1.5">
            {allHighlights.map((item) => (
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

    if (selected.length === 0) return null;
    return (
      <div>
        <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">{field.label}</h3>
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

  if (field.type === "images") {
    const images: string[] = Array.isArray(value) ? value : [];
    if (images.length === 0) return null;
    return (
      <div>
        <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">{field.label}</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((img, idx) => (
            <div key={idx} className="aspect-square overflow-hidden rounded-lg border border-border">
              <img src={img} alt={`${field.label} ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // text, richtext, textarea, select
  let strVal: string;
  if (field.key === "shelfLife") {
    strVal = getShelfLifeText(productInfo) ?? "";
  } else {
    strVal = String(value ?? "");
  }
  if (!strVal.trim()) return null;

  const isRichText = field.type === "richtext" || field.type === "textarea";

  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
      <h3 className="text-xs font-medium text-muted-foreground sm:text-sm">{field.label}</h3>
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
          <h2 className="text-sm font-semibold text-red-800 dark:text-red-300">
            ⚠️ Allergen Warning
          </h2>
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
