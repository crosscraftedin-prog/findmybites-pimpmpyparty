"use client";

import * as React from "react";
import { ChevronDown, Info, Sparkles, Loader2, X, Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getSectionsForTemplate,
  type ProductInfo,
  type InfoSection,
  type InfoField,
} from "@/lib/products/product-info";

/**
 * ProductInfoForm V2 — fully template-driven.
 *
 * No category logic. Sections come from `infoSections` prop (from template).
 * Supports: text, richtext, textarea, select, checkboxes, checkbox, images, table.
 * AI generation with replace/append modal.
 * Custom highlights as chips.
 */

export function ProductInfoForm({
  productInfo,
  onChange,
  infoSections,
  productName,
  productDescription,
  showVendorOnly = false,
}: {
  productInfo: ProductInfo;
  onChange: (info: ProductInfo) => void;
  infoSections?: InfoSection[];
  productName?: string;
  productDescription?: string;
  /** Show vendor-only sections (Recipe Cost Calculator). */
  showVendorOnly?: boolean;
}) {
  const sections = React.useMemo(
    () => getSectionsForTemplate({ infoSections }),
    [infoSections]
  );

  const setField = (key: string, value: unknown) => {
    onChange({ ...productInfo, [key]: value });
  };

  // Handle nested keys like "recipeCost.packagingCost"
  const setNestedField = (key: string, value: unknown) => {
    if (key.includes(".")) {
      const [parent, child] = key.split(".");
      const parentVal = (productInfo as any)[parent] ?? {};
      onChange({
        ...productInfo,
        [parent]: { ...parentVal, [child]: value },
      });
    } else {
      setField(key, value);
    }
  };

  const getNestedValue = (key: string): unknown => {
    if (key.includes(".")) {
      const [parent, child] = key.split(".");
      return (productInfo as any)[parent]?.[child];
    }
    return (productInfo as any)[key];
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
    if (section.showWhen) {
      const val = (productInfo as any)[section.showWhen.field];
      if (section.showWhen.truthy && !val) return false;
      if (!section.showWhen.truthy && val) return false;
    }
    // Hide vendor-only sections unless showVendorOnly is true
    const isVendorOnly = section.fields.every((f) => f.vendorOnly);
    if (isVendorOnly && !showVendorOnly) return false;
    return true;
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
          setField={setNestedField}
          toggleArrayValue={toggleArrayValue}
          getValue={getNestedValue}
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
  getValue,
  productName,
  productDescription,
}: {
  section: InfoSection;
  productInfo: ProductInfo;
  setField: (key: string, value: unknown) => void;
  toggleArrayValue: (key: string, value: string) => void;
  getValue: (key: string) => unknown;
  productName?: string;
  productDescription?: string;
}) {
  const [collapsed, setCollapsed] = React.useState(false);

  const visibleFields = section.fields.filter((field) => {
    if (field.showWhen) {
      const val = getValue(field.showWhen.field);
      return val === field.showWhen.equals;
    }
    return true;
  });

  const hasData = visibleFields.some((f) => {
    const val = getValue(f.key);
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
              value={getValue(field.key)}
              setField={setField}
              toggleArrayValue={toggleArrayValue}
              productName={productName}
              productDescription={productDescription}
              productInfo={productInfo}
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
  productInfo,
}: {
  field: InfoField;
  value: unknown;
  setField: (key: string, value: unknown) => void;
  toggleArrayValue: (key: string, value: string) => void;
  productName?: string;
  productDescription?: string;
  productInfo: ProductInfo;
}) {
  const [aiLoading, setAiLoading] = React.useState(false);
  const [showAIModal, setShowAIModal] = React.useState(false);
  const [aiResult, setAiResult] = React.useState<string>("");
  const [customHighlightInput, setCustomHighlightInput] = React.useState("");

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
        setAiResult(data.ingredients);
        setShowAIModal(true);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate ingredients");
    }
    setAiLoading(false);
  };

  const applyAIResult = (mode: "replace" | "append") => {
    const existing = (value as string) ?? "";
    if (mode === "replace") {
      setField(field.key, aiResult);
    } else {
      setField(field.key, existing ? `${existing}\n${aiResult}` : aiResult);
    }
    setShowAIModal(false);
    setAiResult("");
    toast.success(mode === "replace" ? "Ingredients replaced!" : "Ingredients appended!");
  };

  if (field.type === "text") {
    // Special handling for customHighlights — render as chips + input
    if (field.key === "customHighlights") {
      const highlights: string[] = Array.isArray(value) ? value : [];
      return (
        <div>
          <Label className="text-xs">{field.label}</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {highlights.map((h) => (
              <span
                key={h}
                className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              >
                {h}
                <button
                  type="button"
                  onClick={() => setField(field.key, highlights.filter((x) => x !== h))}
                  className="text-amber-600 hover:text-amber-800"
                  aria-label={`Remove ${h}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              value={customHighlightInput}
              onChange={(e) => setCustomHighlightInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customHighlightInput.trim()) {
                  e.preventDefault();
                  if (!highlights.includes(customHighlightInput.trim())) {
                    setField(field.key, [...highlights, customHighlightInput.trim()]);
                  }
                  setCustomHighlightInput("");
                }
              }}
              placeholder={field.placeholder}
              className="h-9 flex-1 text-sm"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (customHighlightInput.trim() && !highlights.includes(customHighlightInput.trim())) {
                  setField(field.key, [...highlights, customHighlightInput.trim()]);
                  setCustomHighlightInput("");
                }
              }}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
        </div>
      );
    }

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

        {/* AI Replace/Append Modal */}
        {showAIModal && (
          <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50/50 p-3 dark:border-amber-700 dark:bg-amber-950/20">
            <p className="mb-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
              AI generated ingredients. How would you like to apply them?
            </p>
            <Textarea
              value={aiResult}
              onChange={(e) => setAiResult(e.target.value)}
              className="mb-2 min-h-[60px] text-sm"
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => applyAIResult("replace")} className="gap-1">
                Replace existing
              </Button>
              <Button size="sm" variant="outline" onClick={() => applyAIResult("append")} className="gap-1">
                Append to existing
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowAIModal(false); setAiResult(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
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

  if (field.type === "images") {
    const images: string[] = Array.isArray(value) ? value : [];
    return (
      <div>
        <Label className="text-xs">
          {field.label}
          {field.optional && <span className="ml-1 text-muted-foreground">(optional)</span>}
        </Label>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img, idx) => (
            <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
              <img src={img} alt={`Package ${idx + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setField(field.key, images.filter((_, i) => i !== idx))}
                className="absolute right-1 top-1 grid size-5 place-items-center rounded bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove image"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={async () => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append("file", file);
                fd.append("folder", "package");
                try {
                  const res = await fetch("/api/upload", { method: "POST", body: fd });
                  const data = await res.json();
                  if (data.url) {
                    setField(field.key, [...images, data.url]);
                    toast.success("Image uploaded!");
                  }
                } catch {
                  toast.error("Upload failed");
                }
              };
              input.click();
            }}
            className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border hover:bg-muted/50"
          >
            <Upload className="size-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  if (field.type === "table") {
    // Recipe cost calculator table
    const rows: any[] = Array.isArray(value) ? value : [];
    const columns = field.columns ?? [];
    return (
      <div>
        <Label className="text-xs">{field.label}</Label>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th key={col.key} className="px-2 py-1 text-left font-medium text-muted-foreground">
                    {col.label}
                  </th>
                ))}
                <th className="px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b border-border/50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-1 py-1">
                      <Input
                        value={row[col.key] ?? ""}
                        onChange={(e) => {
                          const newRows = [...rows];
                          newRows[idx] = { ...row, [col.key]: e.target.value };
                          setField(field.key, newRows);
                        }}
                        className="h-8 text-xs"
                        type={col.type === "number" ? "number" : "text"}
                      />
                    </td>
                  ))}
                  <td className="px-1 py-1">
                    <button
                      type="button"
                      onClick={() => setField(field.key, rows.filter((_, i) => i !== idx))}
                      className="text-red-600 hover:bg-red-50"
                      aria-label="Remove row"
                    >
                      <X className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 gap-1"
          onClick={() => {
            const newRow: Record<string, string> = {};
            columns.forEach((col) => (newRow[col.key] = ""));
            setField(field.key, [...rows, newRow]);
          }}
        >
          <Plus className="size-3.5" /> Add Row
        </Button>
      </div>
    );
  }

  return null;
}
