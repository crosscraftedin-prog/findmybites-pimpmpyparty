"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Plus,
  Package,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/marketplace/image-upload";
import { cn } from "@/lib/utils";
import type {
  TemplateDef,
  TemplateFieldDef,
  TemplateSectionDef,
} from "@/lib/template-definitions";

// ────────────────────────────────────────────────────────────────────────────
// Icon registry — maps section icon names to Lucide components
// ────────────────────────────────────────────────────────────────────────────
const ICONS: Record<string, LucideIcon> = {
  Package,
  Sparkles,
  Check,
};

function getIcon(name?: string): LucideIcon | undefined {
  if (!name) return undefined;
  return ICONS[name];
}

// ────────────────────────────────────────────────────────────────────────────
// Collapsible Section — matches the existing Products.tsx Section component
// ────────────────────────────────────────────────────────────────────────────
function Section({
  title,
  children,
  defaultOpen = true,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: LucideIcon;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-3 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {Icon && <Icon className="size-3.5" />}
          {title}
        </span>
        {open ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="space-y-3 p-3 pt-0">{children}</div>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Toggle Chip — matches the existing Products.tsx Chip component
// ────────────────────────────────────────────────────────────────────────────
function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors",
        active
          ? "bg-brand text-white"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      {active && <Check className="mr-0.5 inline size-2.5" />}
      {label}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// TagsInput — free-text tag input (comma/Enter separated, stored as array)
// Extracted as a separate component so the useState hook isn't called
// conditionally inside the FieldRenderer switch.
// ────────────────────────────────────────────────────────────────────────────
function TagsInput({
  label,
  required,
  tags,
  placeholder,
  onChange,
  colSpan,
}: {
  label: string;
  required?: boolean;
  tags: string[];
  placeholder: string;
  onChange: (tags: string[]) => void;
  colSpan: string;
}) {
  const [tagInput, setTagInput] = React.useState("");
  return (
    <div className={colSpan}>
      <Label className="text-xs font-semibold">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      <div className="mt-1 flex flex-wrap gap-1.5 rounded-lg border border-black/15 p-2">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((_, j) => j !== i))}
              className="text-brand/60 hover:text-brand"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && tagInput.trim()) {
              e.preventDefault();
              onChange([...tags, tagInput.trim()]);
              setTagInput("");
            }
          }}
          placeholder={placeholder}
          className="min-w-[120px] flex-1 border-0 bg-transparent text-[12px] outline-none"
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Field renderer — renders a single field based on its type
// ────────────────────────────────────────────────────────────────────────────

interface FieldRendererProps {
  field: TemplateFieldDef;
  value: any;
  set: (key: string, value: any) => void;
  filterOptions: Record<string, string[]>;
  currencySymbol: string;
  toggleArray: (key: string, value: string) => void;
}

function FieldRenderer({
  field,
  value,
  set,
  filterOptions,
  currencySymbol,
  toggleArray,
}: FieldRendererProps) {
  // Resolve options: filter group first, then static fallback
  const resolveOptions = (): string[] => {
    if (field.filterGroupName) {
      const filterVals = filterOptions[field.filterGroupName];
      if (filterVals && filterVals.length > 0) return filterVals;
    }
    return field.staticOptions ?? [];
  };

  const labelWithUnit = field.unit
    ? `${field.label} (${field.unit})`
    : field.label;

  // Price field gets currency symbol in label
  const displayLabel =
    field.key === "price" ? `${field.label} (${currencySymbol})` : labelWithUnit;

  const colSpan = field.span === 2 ? "sm:col-span-2" : "";

  switch (field.type) {
    case "text":
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <Input
            type="text"
            value={value ?? ""}
            onChange={(e) => set(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="mt-1 h-10"
          />
        </div>
      );

    case "number":
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <Input
            type="number"
            value={value ?? ""}
            onChange={(e) => set(field.key, e.target.value)}
            placeholder={field.placeholder}
            min={field.minValue}
            max={field.maxValue}
            step={field.step}
            className="mt-1 h-10"
          />
        </div>
      );

    case "textarea":
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <Textarea
            value={value ?? ""}
            onChange={(e) => set(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={2}
            maxLength={300}
            className="mt-1 resize-none"
          />
        </div>
      );

    case "select": {
      const options = resolveOptions();
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <Select
            value={value ?? ""}
            onValueChange={(v) => set(field.key, v)}
          >
            <SelectTrigger className="mt-1 h-10">
              <SelectValue placeholder={field.placeholder ?? "Select"} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.helpText && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              {field.helpText}
            </p>
          )}
        </div>
      );
    }

    case "chips": {
      const options = resolveOptions();
      const selected: string[] = Array.isArray(value) ? value : [];
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {options.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                active={selected.includes(opt)}
                onClick={() => toggleArray(field.key, opt)}
              />
            ))}
          </div>
          {field.helpText && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              {field.helpText}
            </p>
          )}
        </div>
      );
    }

    case "chips_single": {
      const options = resolveOptions();
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {options.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                active={value === opt}
                onClick={() => set(field.key, value === opt ? "" : opt)}
              />
            ))}
          </div>
        </div>
      );
    }

    case "toggle":
      return (
        <div className={colSpan}>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => set(field.key, e.target.checked)}
              className="size-4 rounded"
            />
            <span className="text-xs font-semibold">{displayLabel}</span>
          </label>
        </div>
      );

    case "toggle_group": {
      const options = field.toggleOptions ?? ["Yes", "No"];
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">{displayLabel}</Label>
          <div className="mt-1 flex gap-2">
            {options.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                active={value === opt}
                onClick={() => set(field.key, value === opt ? "" : opt)}
              />
            ))}
          </div>
        </div>
      );
    }

    case "images": {
      const images: string[] = Array.isArray(value) ? value : [];
      const max = field.maxImages ?? 10;
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-lg border border-border"
              >
                <img
                  src={img}
                  alt={`Product ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    set(
                      field.key,
                      images.filter((_, j) => j !== i)
                    )
                  }
                  className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/60 text-white"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            {images.length < max && (
              <div className="aspect-square">
                <ImageUpload
                  label=""
                  aspect="square"
                  value=""
                  onChange={(url) =>
                    url && set(field.key, [...images, url])
                  }
                  hint=""
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    case "section_toggle":
      return (
        <div className={colSpan}>
          <div className="rounded-lg border border-border p-3">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => set(field.key, e.target.checked)}
                className="size-4 rounded"
              />
              <span className="text-xs font-semibold">{displayLabel}</span>
            </label>
            {/* Sub-fields are rendered by the parent TemplateForm */}
          </div>
        </div>
      );

    // ────────────────────────────────────────────────────────────────────────
    // v2 Field Types
    // ────────────────────────────────────────────────────────────────────────

    case "date":
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <Input
            type="date"
            value={value ?? ""}
            onChange={(e) => set(field.key, e.target.value)}
            className="mt-1 h-10"
          />
        </div>
      );

    case "time":
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <Input
            type="time"
            value={value ?? ""}
            onChange={(e) => set(field.key, e.target.value)}
            className="mt-1 h-10"
          />
        </div>
      );

    case "datetime": {
      const dtVal = value ?? "";
      const [dPart, tPart] = dtVal.split("T");
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={dPart ?? ""}
              onChange={(e) =>
                set(field.key, `${e.target.value}T${tPart ?? "00:00"}`)
              }
              className="h-10"
            />
            <Input
              type="time"
              value={tPart ?? ""}
              onChange={(e) =>
                set(field.key, `${dPart ?? ""}T${e.target.value}`)
              }
              className="h-10"
            />
          </div>
        </div>
      );
    }

    case "daterange": {
      const range = value ?? { start: "", end: "" };
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={range.start ?? ""}
              onChange={(e) =>
                set(field.key, { ...range, start: e.target.value })
              }
              className="h-10"
            />
            <Input
              type="date"
              value={range.end ?? ""}
              onChange={(e) =>
                set(field.key, { ...range, end: e.target.value })
              }
              className="h-10"
            />
          </div>
        </div>
      );
    }

    case "currency":
    case "price":
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              {currencySymbol}
            </span>
            <Input
              type="number"
              value={value ?? ""}
              onChange={(e) => set(field.key, e.target.value)}
              placeholder={field.placeholder ?? "0"}
              min={field.minValue}
              max={field.maxValue}
              step={field.step ?? (field.type === "price" ? 1 : 0.01)}
              className="h-10 pl-7"
            />
          </div>
        </div>
      );

    case "address": {
      const addr = value ?? { street: "", city: "", state: "", zip: "", country: "" };
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <div className="mt-1 space-y-2">
            <Input
              value={addr.street ?? ""}
              onChange={(e) => set(field.key, { ...addr, street: e.target.value })}
              placeholder="Street address"
              className="h-10"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={addr.city ?? ""}
                onChange={(e) => set(field.key, { ...addr, city: e.target.value })}
                placeholder="City"
                className="h-10"
              />
              <Input
                value={addr.state ?? ""}
                onChange={(e) => set(field.key, { ...addr, state: e.target.value })}
                placeholder="State / Province"
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={addr.zip ?? ""}
                onChange={(e) => set(field.key, { ...addr, zip: e.target.value })}
                placeholder="ZIP / Postal code"
                className="h-10"
              />
              <Input
                value={addr.country ?? ""}
                onChange={(e) => set(field.key, { ...addr, country: e.target.value })}
                placeholder="Country"
                className="h-10"
              />
            </div>
          </div>
        </div>
      );
    }

    case "phone":
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <Input
            type="tel"
            value={value ?? ""}
            onChange={(e) => set(field.key, e.target.value)}
            placeholder={field.placeholder ?? "+1 234 567 890"}
            className="mt-1 h-10"
          />
        </div>
      );

    case "email":
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <Input
            type="email"
            value={value ?? ""}
            onChange={(e) => set(field.key, e.target.value)}
            placeholder={field.placeholder ?? "name@example.com"}
            className="mt-1 h-10"
          />
        </div>
      );

    case "url":
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <Input
            type="url"
            value={value ?? ""}
            onChange={(e) => set(field.key, e.target.value)}
            placeholder={field.placeholder ?? "https://"}
            className="mt-1 h-10"
          />
        </div>
      );

    case "videourl":
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <Input
            type="url"
            value={value ?? ""}
            onChange={(e) => set(field.key, e.target.value)}
            placeholder={field.placeholder ?? "https://youtube.com/watch?v=..."}
            className="mt-1 h-10"
          />
          {value && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              Video URL saved — preview shown on the product page
            </p>
          )}
        </div>
      );

    case "color":
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={value ?? "#000000"}
              onChange={(e) => set(field.key, e.target.value)}
              className="size-10 cursor-pointer rounded-lg border border-border"
            />
            <Input
              value={value ?? ""}
              onChange={(e) => set(field.key, e.target.value)}
              placeholder="#000000"
              className="h-10 flex-1"
            />
          </div>
        </div>
      );

    case "richtext":
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <Textarea
            value={value ?? ""}
            onChange={(e) => set(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            maxLength={field.maxLength ?? 2000}
            className="mt-1 resize-y"
          />
          {field.maxLength && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              {(value ?? "").length}/{field.maxLength} characters
            </p>
          )}
        </div>
      );

    case "tags": {
      const tags: string[] = Array.isArray(value) ? value : [];
      return (
        <TagsInput
          label={displayLabel}
          required={field.required}
          tags={tags}
          placeholder={field.placeholder ?? "Type and press Enter..."}
          onChange={(newTags) => set(field.key, newTags)}
          colSpan={colSpan}
        />
      );
    }

    case "gallery": {
      const images: string[] = Array.isArray(value) ? value : [];
      const max = field.maxImages ?? 20;
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative aspect-video overflow-hidden rounded-lg border border-border"
              >
                <img
                  src={img}
                  alt={`Gallery ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    set(
                      field.key,
                      images.filter((_, j) => j !== i)
                    )
                  }
                  className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/60 text-white"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            {images.length < max && (
              <div className="aspect-video">
                <ImageUpload
                  label=""
                  aspect="video"
                  value=""
                  onChange={(url) =>
                    url && set(field.key, [...images, url])
                  }
                  hint=""
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    case "fileupload":
    case "pdfupload":
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <div className="mt-1 rounded-lg border border-dashed border-border p-4 text-center">
            {value ? (
              <div className="flex items-center justify-between">
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-xs font-medium text-brand hover:underline"
                >
                  {value.split("/").pop() || "View file"}
                </a>
                <button
                  type="button"
                  onClick={() => set(field.key, "")}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div>
                <ImageUpload
                  label=""
                  aspect="square"
                  value=""
                  onChange={(url) => url && set(field.key, url)}
                  hint=""
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {field.type === "pdfupload" ? "PDF files only" : "Any file type"}
                  {field.maxFileSize ? ` (max ${field.maxFileSize}KB)` : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      );

    case "availability": {
      // Simple JSON-based availability: array of { date, slots: [...] }
      const slots: { date: string; times: string }[] = Array.isArray(value) ? value : [];
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <div className="mt-1 space-y-2">
            {slots.map((slot, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input
                  type="date"
                  value={slot.date ?? ""}
                  onChange={(e) => {
                    const next = [...slots];
                    next[i] = { ...next[i], date: e.target.value };
                    set(field.key, next);
                  }}
                  className="h-10"
                />
                <Input
                  type="text"
                  value={slot.times ?? ""}
                  onChange={(e) => {
                    const next = [...slots];
                    next[i] = { ...next[i], times: e.target.value };
                    set(field.key, next);
                  }}
                  placeholder="e.g. 10:00-14:00"
                  className="h-10"
                />
                <button
                  type="button"
                  onClick={() => set(field.key, slots.filter((_, j) => j !== i))}
                  className="grid size-10 place-items-center text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set(field.key, [...slots, { date: "", times: "" }])}
              className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted/80"
            >
              <Plus className="size-3" /> Add availability slot
            </button>
          </div>
        </div>
      );
    }

    case "bookingduration": {
      const dur = value ?? { hours: "", minutes: "" };
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <div className="relative">
              <Input
                type="number"
                value={dur.hours ?? ""}
                onChange={(e) => set(field.key, { ...dur, hours: e.target.value })}
                placeholder="0"
                min={0}
                className="h-10 pr-12"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                hrs
              </span>
            </div>
            <div className="relative">
              <Input
                type="number"
                value={dur.minutes ?? ""}
                onChange={(e) => set(field.key, { ...dur, minutes: e.target.value })}
                placeholder="0"
                min={0}
                max={59}
                className="h-10 pr-12"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                min
              </span>
            </div>
          </div>
        </div>
      );
    }

    case "radius":
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <div className="relative mt-1">
            <Input
              type="number"
              value={value ?? ""}
              onChange={(e) => set(field.key, e.target.value)}
              placeholder={field.placeholder ?? "0"}
              min={field.minValue ?? 0}
              className="h-10 pr-12"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
              {field.unit ?? "km"}
            </span>
          </div>
        </div>
      );

    case "repeater": {
      // Repeatable field: vendors can add unlimited entries
      const entries: string[] = Array.isArray(value) ? value : [];
      const maxRepeats = field.maxRepeats ?? 50;
      const minRepeats = field.minRepeats ?? 0;
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
            <span className="ml-1 text-[10px] font-normal text-muted-foreground">
              ({entries.length} {field.repeatLabel?.toLowerCase() || "entries"})
            </span>
          </Label>
          <div className="mt-1 space-y-2">
            {entries.map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {i + 1}.
                </span>
                <Input
                  value={entry ?? ""}
                  onChange={(e) => {
                    const next = [...entries];
                    next[i] = e.target.value;
                    set(field.key, next);
                  }}
                  placeholder={field.placeholder ?? `Enter ${field.repeatLabel?.toLowerCase() || "value"}`}
                  className="h-10 flex-1"
                />
                <button
                  type="button"
                  onClick={() => set(field.key, entries.filter((_, j) => j !== i))}
                  className="grid size-9 place-items-center text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {entries.length < maxRepeats && (
              <button
                type="button"
                onClick={() => set(field.key, [...entries, ""])}
                className="inline-flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted/80"
              >
                <Plus className="size-3" /> Add {field.repeatLabel?.toLowerCase() || "entry"}
              </button>
            )}
            {entries.length < minRepeats && (
              <p className="text-[10px] text-amber-600">
                Minimum {minRepeats} entries required
              </p>
            )}
          </div>
        </div>
      );
    }

    default:
      // Unknown v2 type — render as text input fallback
      return (
        <div className={colSpan}>
          <Label className="text-xs font-semibold">
            {displayLabel}
            {field.required && <span className="ml-0.5 text-red-500">*</span>}
          </Label>
          <Input
            type="text"
            value={value ?? ""}
            onChange={(e) => set(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="mt-1 h-10"
          />
          <p className="mt-1 text-[10px] text-amber-600">
            Field type "{field.type}" — using text input fallback
          </p>
        </div>
      );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Main TemplateForm component
// ────────────────────────────────────────────────────────────────────────────

export interface TemplateFormProps {
  template: TemplateDef;
  filterOptions: Record<string, string[]>;
  form: Record<string, any>;
  set: (key: string, value: any) => void;
  toggleArray: (key: string, value: string) => void;
  currencySymbol: string;
}

export function TemplateForm({
  template,
  filterOptions,
  form,
  set,
  toggleArray,
  currencySymbol,
}: TemplateFormProps) {
  // Sort sections by sortOrder
  const sections = [...template.sections].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  // Sort fields by sortOrder within each section
  const fieldsBySection = React.useMemo(() => {
    const map: Record<string, TemplateFieldDef[]> = {};
    for (const field of template.fields) {
      if (!field.enabled) continue;
      if (!map[field.section]) map[field.section] = [];
      map[field.section].push(field);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return map;
  }, [template.fields]);

  // Check if a field is visible based on its condition
  const isFieldVisible = (field: TemplateFieldDef): boolean => {
    if (!field.condition) return true;
    const condField = field.condition.field;
    const condValues = field.condition.values;
    const currentValue = form[condField] ?? "";
    return condValues.includes(String(currentValue));
  };

  // Check if a field is visible as a sub-field of a section_toggle
  const isSubFieldVisible = (field: TemplateFieldDef): boolean => {
    // Find if any section_toggle has this field as a subField
    for (const f of template.fields) {
      if (f.type === "section_toggle" && f.subFields?.includes(field.key)) {
        // Sub-field visible only if the toggle is on AND the toggle itself is visible
        return Boolean(form[f.key]) && isFieldVisible(f);
      }
    }
    return false;
  };

  // Determine if a field should render:
  // - Regular field: visible by condition
  // - Sub-field of a section_toggle: visible only if parent toggle is on
  const shouldRenderField = (field: TemplateFieldDef): boolean => {
    // Check if this field is a sub-field of any section_toggle
    const isSubField = template.fields.some(
      (f) => f.type === "section_toggle" && f.subFields?.includes(field.key)
    );

    if (isSubField) {
      return isSubFieldVisible(field);
    }
    return isFieldVisible(field);
  };

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const sectionFields = fieldsBySection[section.name] ?? [];
        // A section is visible if at least one of its fields is visible
        const visibleFields = sectionFields.filter(shouldRenderField);
        if (visibleFields.length === 0) return null;

        const icon = getIcon(section.icon);

        return (
          <Section
            key={section.name}
            title={section.name}
            defaultOpen={section.defaultOpen ?? true}
            icon={icon}
          >
            <div className="grid grid-cols-2 gap-3">
              {visibleFields.map((field) => (
                <FieldRenderer
                  key={field.key}
                  field={field}
                  value={form[field.key]}
                  set={set}
                  filterOptions={filterOptions}
                  currencySymbol={currencySymbol}
                  toggleArray={toggleArray}
                />
              ))}
            </div>
          </Section>
        );
      })}
    </div>
  );
}
