"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Loader2,
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

    default:
      return null;
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
