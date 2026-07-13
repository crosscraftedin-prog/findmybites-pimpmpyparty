"use client";

import * as React from "react";
import { ChevronDown, Info, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  getLegacySectionsForCategory,
  type ProductInfo,
  type InfoSection,
  type InfoField,
} from "@/lib/products/product-info";

/**
 * ProductInfoForm — template-engine driven product information editor.
 *
 * Sections come from the `infoSections` prop (template-driven) or the legacy
 * category fallback. Supports AI generation for fields with `aiGeneratable`.
 */
export function ProductInfoForm({
  productInfo,
  onChange,
  infoSections,
  category,
  productName,
  productDescription,
}: {
  productInfo: ProductInfo;
  onChange: (info: ProductInfo) => void;
  infoSections?: InfoSection[];
  category?: string | null;
  /** Product name — used as context for AI ingredient generation. */
  productName?: string;
  /** Product description — used as context for AI ingredient generation. */
  productDescription?: string;
}) {
  const sections = React.useMemo(() => {
    if (infoSections && infoSections.length > 0) return infoSections;
    return getLegacySectionsForCategory(category);
  }, [infoSections, category]);

  const setField = (key: string, value: unknown) => {
    onChange({ ...productInfo, [key]: value });
  };

  const toggleArrayValue = (key: string, value: string) => {
    const current: string[] = (productInfo as any)[key] ?? [];
    if (current.includes(value)) {
      setField(key, current.filter((v) => v !== value));
    } else {
      setField(key, [...current, value]);
    }
  };

  const visibleSections = sections.filter((section) => {
    if (!section.showWhen) return true;
    const val = (productInfo as any)[section.showWhen.field];
    return section.showWhen.truthy ? !!val : !val;
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            All fields below are optional. Filling them in improves SEO, builds customer trust,
            and reduces customer questions.
          </p>
        </div>
      </div>

      {visibleSections.map((section) => (
        <SectionCard
          key={section.key}
          section={section}
          productInfo={productInfo}
          setField={setField}
          toggleArrayValue={toggleArrayValue}
          productName={productName}
          productDescription={productDescription}
        />
      ))}
    </div>
  );
}

function SectionCard({
  section,
  productInfo,
  setField,
  toggleArrayValue,
  productName,
  productDescription,
}: {
  section: InfoSection;
  productInfo: ProductInfo;
  setField: (key: string, value: unknown) => void;
  toggleArrayValue: (key: string, value: string) => void;
  productName?: string;
  productDescription?: string;
}) {
  const [collapsed, setCollapsed] = React.useState(false);

  const visibleFields = section.fields.filter((field) => {
    if (!field.showWhen) return true;
    const val = (productInfo as any)[field.showWhen.field];
    return val === field.showWhen.equals;
  });

  const hasData = visibleFields.some((f) => {
    const val = (productInfo as any)[f.key];
    return val && (typeof val !== "object" || (Array.isArray(val) && val.length > 0));
  });

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/30 sm:hidden"
        aria-expanded={!collapsed}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-base">{section.icon}</span>
          {section.heading}
          {hasData && (
            <span className="ml-1 inline-flex size-2 rounded-full bg-amber-500" aria-label="has data" />
          )}
        </span>
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", collapsed ? "" : "rotate-180")}
        />
      </button>

      <div className="hidden items-center gap-2 border-b border-border p-4 sm:flex">
        <span className="text-lg">{section.icon}</span>
        <h4 className="text-sm font-bold">{section.heading}</h4>
        {hasData && (
          <span className="ml-1 inline-flex size-2 rounded-full bg-amber-500" aria-label="has data" />
        )}
      </div>

      <div className={cn("p-4", collapsed && "hidden sm:block")}>
        <div className="space-y-3">
          {visibleFields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={(productInfo as any)[field.key]}
              setField={setField}
              toggleArrayValue={toggleArrayValue}
              productName={productName}
              productDescription={productDescription}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  setField,
  toggleArrayValue,
  productName,
  productDescription,
}: {
  field: InfoField;
  value: unknown;
  setField: (key: string, value: unknown) => void;
  toggleArrayValue: (key: string, value: string) => void;
  productName?: string;
  productDescription?: string;
}) {
  const [aiLoading, setAiLoading] = React.useState(false);

  // AI generation for ingredients
  const generateWithAI = async () => {
    if (!productName?.trim()) {
      toast.error("Enter a product name first");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/vendor/ai/generate-ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          productDescription: productDescription || "",
          field: field.key,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI generation failed");
      if (data.ingredients) {
        setField(field.key, data.ingredients);
        toast.success("Ingredients generated!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate ingredients");
    }
    setAiLoading(false);
  };

  if (field.type === "text") {
    return (
      <div>
        <Label className="text-xs">
          {field.label}
          {field.optional && <span className="ml-1 text-muted-foreground">(optional)</span>}
        </Label>
        <Input
          value={(value as string) ?? ""}
          onChange={(e) => setField(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="mt-1 h-9 text-sm"
        />
      </div>
    );
  }

  if (field.type === "richtext") {
    return (
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">
            {field.label}
            {field.optional && <span className="ml-1 text-muted-foreground">(optional)</span>}
          </Label>
          {field.aiGeneratable && (
            <button
              type="button"
              onClick={generateWithAI}
              disabled={aiLoading}
              className="flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
            >
              {aiLoading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
              {aiLoading ? "Generating…" : "Generate with AI"}
            </button>
          )}
        </div>
        <Textarea
          value={(value as string) ?? ""}
          onChange={(e) => setField(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="mt-1 min-h-[80px] text-sm"
          rows={3}
        />
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Supports line breaks — press Enter for a new line.
        </p>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <Label className="text-xs">
          {field.label}
          {field.optional && <span className="ml-1 text-muted-foreground">(optional)</span>}
        </Label>
        <Textarea
          value={(value as string) ?? ""}
          onChange={(e) => setField(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="mt-1 min-h-[60px] text-sm"
          rows={2}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        <Label className="text-xs">
          {field.label}
          {field.optional && <span className="ml-1 text-muted-foreground">(optional)</span>}
        </Label>
        <select
          value={(value as string) ?? ""}
          onChange={(e) => setField(field.key, e.target.value)}
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt || "Select…"}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => setField(field.key, e.target.checked)}
          className="size-4 rounded border-border"
        />
        {field.label}
      </label>
    );
  }

  if (field.type === "checkboxes") {
    const selected: string[] = Array.isArray(value) ? value : [];
    return (
      <div>
        <Label className="text-xs">{field.label}</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {field.options?.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleArrayValue(field.key, opt)}
                aria-pressed={isSelected}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                  isSelected
                    ? "border-amber-400 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                    : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:bg-muted/50"
                )}
              >
                {isSelected && <span className="text-[10px]">✓</span>}
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
