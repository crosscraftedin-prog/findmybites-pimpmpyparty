"use client";

/**
 * AdminTemplates — Template Engine Admin Panel
 * ==============================================
 *
 * Comprehensive admin panel for managing listing templates, fields, and
 * category→template mappings.
 *
 * Tabs:
 *   1. Templates — grid of all templates + Seed + New Template buttons
 *   2. Mappings  — category→template assignment table
 *
 * Clicking a template opens a full-screen editor panel containing:
 *   A. Template Metadata (name, slug, description, ecosystem, icon, active)
 *   B. Fields Manager — per-section DnD-sortable list with edit/delete/toggle
 *   C. Field Editor Dialog — add/edit a single field with all properties
 *
 * API contract:
 *   GET    /api/admin/templates                       → Template[]
 *   POST   /api/admin/templates                       → create
 *   PUT    /api/admin/templates/[id]                  → update metadata
 *   DELETE /api/admin/templates/[id]                  → delete
 *   POST   /api/admin/templates/[id]/fields           → add field
 *   PUT    /api/admin/templates/[id]/fields           → bulk-update fields
 *   PUT    /api/admin/templates/[id]/fields/[fieldId] → update single field
 *   DELETE /api/admin/templates/[id]/fields/[fieldId] → delete field
 *   GET    /api/admin/templates/mappings              → TemplateMapping[]
 *   POST   /api/admin/templates/mappings              → create mapping
 *   DELETE /api/admin/templates/mappings?categoryId=&subcategory= → delete
 *   POST   /api/admin/templates/seed                  → sync seed → DB
 */

import * as React from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Loader2,
  LayoutTemplate,
  ArrowLeft,
  GripVertical,
  Sparkles,
  Database,
  Link2,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Brand colors (matching the rest of the admin panel) ──────────────────
const CORAL = "#D85A30";
const CORAL_TINT = "#FAECE7";
const CORAL_BORDER = "#F0997B";
const PURPLE = "#7F77DD";
const PURPLE_TINT = "#EEEDFE";
const GREEN_BG = "#EAF3DE";
const GREEN_TEXT = "#27500A";
const RED_BG = "#FDECEA";
const RED_TEXT = "#8B1A1A";
const BORDER_COLOR = "rgba(0,0,0,0.12)";
const MUTED = "rgba(0,0,0,0.5)";
const MUTED_LIGHT = "rgba(0,0,0,0.4)";

// ─── Field-type metadata ──────────────────────────────────────────────────
const FIELD_TYPES = [
  "text",
  "number",
  "textarea",
  "select",
  "chips",
  "chips_single",
  "toggle",
  "toggle_group",
  "images",
  "section_toggle",
] as const;

const ECOSYSTEMS = ["FINDMYBITES", "PIMPMYPARTY", "BOTH"] as const;

const ECOSYSTEM_COLOR: Record<string, { bg: string; text: string }> = {
  FINDMYBITES: { bg: CORAL_TINT, text: CORAL },
  PIMPMYPARTY: { bg: PURPLE_TINT, text: PURPLE },
  BOTH: { bg: "#F1EFE8", text: "#444" },
};

// Common Lucide icon names that admins can pick from (kept short on purpose).
const ICON_SUGGESTIONS = [
  "Cake",
  "Camera",
  "Music",
  "MapPin",
  "Flower2",
  "Car",
  "Sparkles",
  "Package",
  "Gift",
  "Brush",
  "Users",
  "Printer",
  "Utensils",
  "Palette",
];

// ─── Types ────────────────────────────────────────────────────────────────
type FieldType = (typeof FIELD_TYPES)[number];
type Ecosystem = (typeof ECOSYSTEMS)[number];

interface TemplateSection {
  name: string;
  icon?: string;
  defaultOpen?: boolean;
  sortOrder: number;
}

interface TemplateField {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  section: string;
  sortOrder: number;
  required?: boolean;
  enabled?: boolean;
  placeholder?: string | null;
  helpText?: string | null;
  unit?: string | null;
  span?: 1 | 2 | null;
  filterGroupName?: string | null;
  staticOptions?: string[] | null;
  condition?: { field: string; values: string[] } | null;
  subFields?: string[] | null;
  toggleOptions?: string[] | null;
  maxImages?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  step?: number | null;
}

interface Template {
  id: string;
  slug: string;
  name: string;
  description: string;
  ecosystem: Ecosystem;
  icon?: string | null;
  active?: boolean;
  sections: TemplateSection[];
  fields: TemplateField[];
  _count?: { mappings?: number };
  mappings?: TemplateMapping[];
}

interface TemplateMapping {
  id: string;
  categoryId: string;
  subcategory?: string | null;
  templateId: string;
  template?: { id: string; name: string; slug: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Split a textarea string into a string[].
 * Accepts both newline-separated and comma-separated entries.
 */
function splitLines(value: string): string[] {
  if (!value) return [];
  return value
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinLines(arr?: string[] | null): string {
  if (!arr || arr.length === 0) return "";
  return arr.join("\n");
}

function ecosystemBadge(ecosystem: Ecosystem | string) {
  const c = ECOSYSTEM_COLOR[ecosystem] ?? ECOSYSTEM_COLOR.BOTH;
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: c.bg, color: c.text }}
    >
      {ecosystem}
    </span>
  );
}

function fieldTypeBadge(type: FieldType) {
  const colors: Record<string, { bg: string; text: string }> = {
    text: { bg: "#EEF2FF", text: "#3B3B98" },
    number: { bg: "#E0F2FE", text: "#075985" },
    textarea: { bg: "#F1F5F9", text: "#334155" },
    select: { bg: "#F0E7FE", text: "#6B21A8" },
    chips: { bg: "#FEF3C7", text: "#92400E" },
    chips_single: { bg: "#FFEDD5", text: "#9A3412" },
    toggle: { bg: "#DCFCE7", text: "#166534" },
    toggle_group: { bg: "#D1FAE5", text: "#065F46" },
    images: { bg: "#FCE7F3", text: "#9D174D" },
    section_toggle: { bg: "#E0E7FF", text: "#3730A3" },
  };
  const c = colors[type] ?? { bg: "#F1EFE8", text: "#444" };
  return (
    <span
      className="inline-block rounded-md px-1.5 py-0.5 text-[10px] font-mono font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      {type}
    </span>
  );
}

// ─── Sortable field row ───────────────────────────────────────────────────

function SortableFieldRow({
  field,
  onEdit,
  onDelete,
  onToggleEnabled,
}: {
  field: TemplateField;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEnabled: (next: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 hover:border-black/20"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-black/30 hover:text-black/60 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        title="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[13px] font-semibold text-black/85">
              {field.label || (
                <span className="italic text-black/40">no label</span>
              )}
            </span>
            {field.required && (
              <span
                className="rounded px-1 text-[9px] font-bold uppercase"
                style={{ background: RED_BG, color: RED_TEXT }}
              >
                required
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-black/45">
            <code className="font-mono">{field.key}</code>
            {fieldTypeBadge(field.type)}
            {field.unit && (
              <span className="text-black/40">unit: {field.unit}</span>
            )}
            {field.span === 2 && <span className="text-black/40">span: 2</span>}
            {field.filterGroupName && (
              <span
                className="rounded px-1 font-mono"
                style={{ background: PURPLE_TINT, color: PURPLE }}
              >
                filter: {field.filterGroupName}
              </span>
            )}
            {field.condition && (
              <span className="text-black/40">
                if {field.condition.field} ∈ [
                {field.condition.values.join(", ")}]
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase text-black/40">
              {field.enabled === false ? "off" : "on"}
            </span>
            <Switch
              checked={field.enabled !== false}
              onCheckedChange={onToggleEnabled}
            />
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md border border-black/10 p-1.5 text-black/60 hover:bg-black/5"
            title="Edit field"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
            title="Delete field"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Field Editor Dialog ──────────────────────────────────────────────────

interface FieldFormState {
  key: string;
  label: string;
  type: FieldType;
  section: string;
  sortOrder: number;
  required: boolean;
  enabled: boolean;
  placeholder: string;
  helpText: string;
  unit: string;
  span: 1 | 2;
  filterGroupName: string;
  staticOptions: string;
  conditionField: string;
  conditionValues: string;
  subFields: string;
  toggleOptions: string;
  maxImages: number;
}

function emptyFieldForm(section: string, sortOrder: number): FieldFormState {
  return {
    key: "",
    label: "",
    type: "text",
    section,
    sortOrder,
    required: false,
    enabled: true,
    placeholder: "",
    helpText: "",
    unit: "",
    span: 1,
    filterGroupName: "",
    staticOptions: "",
    conditionField: "",
    conditionValues: "",
    subFields: "",
    toggleOptions: "",
    maxImages: 10,
  };
}

function fieldToForm(field: TemplateField): FieldFormState {
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    section: field.section,
    sortOrder: field.sortOrder,
    required: !!field.required,
    enabled: field.enabled !== false,
    placeholder: field.placeholder ?? "",
    helpText: field.helpText ?? "",
    unit: field.unit ?? "",
    span: (field.span === 2 ? 2 : 1) as 1 | 2,
    filterGroupName: field.filterGroupName ?? "",
    staticOptions: joinLines(field.staticOptions),
    conditionField: field.condition?.field ?? "",
    conditionValues: joinLines(field.condition?.values),
    subFields: joinLines(field.subFields),
    toggleOptions: joinLines(field.toggleOptions),
    maxImages: field.maxImages ?? 10,
  };
}

function formToPayload(form: FieldFormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    key: form.key.trim(),
    label: form.label.trim(),
    type: form.type,
    section: form.section.trim(),
    sortOrder: Number(form.sortOrder) || 0,
    required: form.required,
    enabled: form.enabled,
  };
  if (form.placeholder.trim()) payload.placeholder = form.placeholder.trim();
  if (form.helpText.trim()) payload.helpText = form.helpText.trim();
  if (form.unit.trim()) payload.unit = form.unit.trim();
  payload.span = form.span;
  if (form.filterGroupName.trim())
    payload.filterGroupName = form.filterGroupName.trim();
  const staticOptions = splitLines(form.staticOptions);
  if (staticOptions.length) payload.staticOptions = staticOptions;
  if (form.conditionField.trim()) {
    payload.condition = {
      field: form.conditionField.trim(),
      values: splitLines(form.conditionValues),
    };
  }
  const subFields = splitLines(form.subFields);
  if (subFields.length) payload.subFields = subFields;
  const toggleOptions = splitLines(form.toggleOptions);
  if (toggleOptions.length) payload.toggleOptions = toggleOptions;
  if (form.type === "images") payload.maxImages = Number(form.maxImages) || 10;
  return payload;
}

function FieldEditorDialog({
  open,
  onOpenChange,
  mode,
  initial,
  sections,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  initial: FieldFormState;
  sections: string[];
  onSave: (form: FieldFormState) => void;
  saving: boolean;
}) {
  const [form, setForm] = React.useState<FieldFormState>(initial);

  React.useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const set = <K extends keyof FieldFormState>(
    key: K,
    value: FieldFormState[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const isOptionType =
    form.type === "select" ||
    form.type === "chips" ||
    form.type === "chips_single";
  const isToggleGroup = form.type === "toggle_group";
  const isSectionToggle = form.type === "section_toggle";
  const isImages = form.type === "images";
  const isNumber = form.type === "number";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Field" : "Edit Field"}
          </DialogTitle>
          <DialogDescription>
            Configure how this field appears and behaves in vendor listing
            forms.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* key */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
              Key <span className="text-red-500">*</span>
            </label>
            <input
              value={form.key}
              onChange={(e) => set("key", e.target.value)}
              placeholder="e.g. cakeSize"
              className="w-full rounded-lg border border-black/15 px-3 py-2 font-mono text-[13px]"
            />
          </div>

          {/* label */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
              Label <span className="text-red-500">*</span>
            </label>
            <input
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="e.g. Cake Size"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
          </div>

          {/* type */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value as FieldType)}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            >
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* section */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
              Section
            </label>
            <input
              list="tpl-sections-list"
              value={form.section}
              onChange={(e) => set("section", e.target.value)}
              placeholder="Pick or type a section name"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
            <datalist id="tpl-sections-list">
              {sections.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          {/* sortOrder */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
              Sort order
            </label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", Number(e.target.value))}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
          </div>

          {/* span */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
              Span (column width)
            </label>
            <select
              value={form.span}
              onChange={(e) =>
                set("span", Number(e.target.value) === 2 ? 2 : 1)
              }
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            >
              <option value={1}>1 column</option>
              <option value={2}>2 columns (full width)</option>
            </select>
          </div>

          {/* placeholder */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
              Placeholder
            </label>
            <input
              value={form.placeholder}
              onChange={(e) => set("placeholder", e.target.value)}
              placeholder="e.g. 1"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
          </div>

          {/* unit */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
              Unit {isNumber && "(suffix, e.g. kg)"}
            </label>
            <input
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
              placeholder="e.g. kg"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
          </div>

          {/* helpText */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
              Help text
            </label>
            <input
              value={form.helpText}
              onChange={(e) => set("helpText", e.target.value)}
              placeholder="Shown under the field"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
          </div>

          {/* filterGroupName */}
          {isOptionType && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
                Filter group name
              </label>
              <input
                value={form.filterGroupName}
                onChange={(e) => set("filterGroupName", e.target.value)}
                placeholder="e.g. Flavour"
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
              />
              <p className="text-[10px] text-black/40">
                Pulls options from the Universal Filter Engine.
              </p>
            </div>
          )}

          {/* staticOptions */}
          {isOptionType && (
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
                Static options (one per line, or comma-separated)
              </label>
              <textarea
                value={form.staticOptions}
                onChange={(e) => set("staticOptions", e.target.value)}
                placeholder={"round\nsquare\nheart"}
                rows={3}
                className="w-full rounded-lg border border-black/15 px-3 py-2 font-mono text-[12px]"
              />
              <p className="text-[10px] text-black/40">
                Used as a fallback when no filter group is set.
              </p>
            </div>
          )}

          {/* toggleOptions */}
          {isToggleGroup && (
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
                Toggle options (one per line, or comma-separated)
              </label>
              <textarea
                value={form.toggleOptions}
                onChange={(e) => set("toggleOptions", e.target.value)}
                placeholder={"Included\nAdd-on\nNot available"}
                rows={3}
                className="w-full rounded-lg border border-black/15 px-3 py-2 font-mono text-[12px]"
              />
            </div>
          )}

          {/* subFields */}
          {isSectionToggle && (
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
                Sub-fields (keys revealed when this toggle is on)
              </label>
              <textarea
                value={form.subFields}
                onChange={(e) => set("subFields", e.target.value)}
                placeholder={"nameOnCakeText\nnameOnCakeMaxChars"}
                rows={3}
                className="w-full rounded-lg border border-black/15 px-3 py-2 font-mono text-[12px]"
              />
            </div>
          )}

          {/* maxImages */}
          {isImages && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
                Max images
              </label>
              <input
                type="number"
                value={form.maxImages}
                onChange={(e) => set("maxImages", Number(e.target.value))}
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
              />
            </div>
          )}

          {/* condition */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
              Condition — show when field
            </label>
            <input
              value={form.conditionField}
              onChange={(e) => set("conditionField", e.target.value)}
              placeholder="e.g. productType"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
              …matches value(s)
            </label>
            <input
              value={form.conditionValues}
              onChange={(e) => set("conditionValues", e.target.value)}
              placeholder="Cakes, Cupcakes (or empty)"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
            <p className="text-[10px] text-black/40">
              Empty string means &quot;shown by default&quot;.
            </p>
          </div>

          {/* toggles */}
          <div className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2">
            <div>
              <p className="text-[12px] font-semibold">Required</p>
              <p className="text-[10px] text-black/40">
                Vendor must fill this to publish
              </p>
            </div>
            <Switch
              checked={form.required}
              onCheckedChange={(v) => set("required", v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2">
            <div>
              <p className="text-[12px] font-semibold">Enabled</p>
              <p className="text-[10px] text-black/40">
                Disabled fields are hidden from forms
              </p>
            </div>
            <Switch
              checked={form.enabled}
              onCheckedChange={(v) => set("enabled", v)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-4 py-2 text-[13px] font-medium hover:bg-black/5"
          >
            <X className="size-4" /> Cancel
          </button>
          <button
            type="button"
            disabled={saving || !form.key.trim() || !form.label.trim()}
            onClick={() => onSave(form)}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
            style={{ background: CORAL }}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {mode === "create" ? "Add field" : "Save changes"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Template Editor Panel ────────────────────────────────────────────────

function TemplateEditorPanel({
  template,
  onClose,
  onMutated,
}: {
  template: Template;
  onClose: () => void;
  onMutated: () => void;
}) {
  const [meta, setMeta] = React.useState({
    name: template.name,
    slug: template.slug,
    description: template.description,
    ecosystem: template.ecosystem,
    icon: template.icon ?? "",
    active: template.active !== false,
  });
  const [fields, setFields] = React.useState<TemplateField[]>(template.fields);
  const [sections, setSections] = React.useState<TemplateSection[]>(
    template.sections
  );

  // editor dialog state
  const [fieldDialog, setFieldDialog] = React.useState<{
    open: boolean;
    mode: "create" | "edit";
    section: string;
    initial: FieldFormState;
    editingId: string | null;
  } | null>(null);

  const [savingMeta, setSavingMeta] = React.useState(false);
  const [savingField, setSavingField] = React.useState(false);
  const [reordering, setReordering] = React.useState(false);

  // keep local state in sync when the parent swaps templates
  React.useEffect(() => {
    setMeta({
      name: template.name,
      slug: template.slug,
      description: template.description,
      ecosystem: template.ecosystem,
      icon: template.icon ?? "",
      active: template.active !== false,
    });
    setFields(template.fields);
    setSections(template.sections);
  }, [template]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // section names — include both declared sections and any sections referenced
  // by fields but missing from the sections[] array (defensive).
  const sectionNames = React.useMemo(() => {
    const seen = new Map<number, string>();
    sections
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((s) => seen.set(s.sortOrder, s.name));
    fields.forEach((f) => {
      if (!Array.from(seen.values()).includes(f.section)) {
        seen.set(9000 + f.sortOrder, f.section);
      }
    });
    return Array.from(seen.values());
  }, [sections, fields]);

  const fieldsBySection = React.useMemo(() => {
    const map = new Map<string, TemplateField[]>();
    sectionNames.forEach((s) => map.set(s, []));
    fields
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((f) => {
        if (!map.has(f.section)) map.set(f.section, []);
        map.get(f.section)!.push(f);
      });
    return map;
  }, [fields, sectionNames]);

  // ── metadata save ───────────────────────────────────────────────────────
  const handleSaveMeta = async () => {
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/admin/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: meta.name.trim(),
          slug: meta.slug.trim(),
          description: meta.description,
          ecosystem: meta.ecosystem,
          icon: meta.icon || null,
          active: meta.active,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Update failed (${res.status})`);
      }
      toast.success("Template metadata saved");
      onMutated();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to save template metadata"
      );
    } finally {
      setSavingMeta(false);
    }
  };

  // ── field editor: open create ───────────────────────────────────────────
  const openCreateField = (sectionName: string) => {
    const sameSection = fields.filter((f) => f.section === sectionName);
    const nextOrder = sameSection.length
      ? Math.max(...sameSection.map((f) => f.sortOrder)) + 1
      : 1;
    setFieldDialog({
      open: true,
      mode: "create",
      section: sectionName,
      initial: emptyFieldForm(sectionName, nextOrder),
      editingId: null,
    });
  };

  const openEditField = (field: TemplateField) => {
    setFieldDialog({
      open: true,
      mode: "edit",
      section: field.section,
      initial: fieldToForm(field),
      editingId: field.id,
    });
  };

  // ── field editor: save ──────────────────────────────────────────────────
  const handleSaveField = async (form: FieldFormState) => {
    if (!form.key.trim() || !form.label.trim()) {
      toast.error("Key and label are required");
      return;
    }
    setSavingField(true);
    try {
      const payload = formToPayload(form);
      const isEdit = fieldDialog?.mode === "edit";
      const url = isEdit
        ? `/api/admin/templates/${template.id}/fields/${fieldDialog?.editingId}`
        : `/api/admin/templates/${template.id}/fields`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Save failed (${res.status})`);
      }
      toast.success(isEdit ? "Field updated" : "Field added");
      setFieldDialog(null);
      onMutated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save field");
    } finally {
      setSavingField(false);
    }
  };

  // ── field delete ────────────────────────────────────────────────────────
  const handleDeleteField = async (field: TemplateField) => {
    if (!confirm(`Delete field "${field.label}" (${field.key})?`)) return;
    try {
      const res = await fetch(
        `/api/admin/templates/${template.id}/fields/${field.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      toast.success("Field deleted");
      onMutated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete field");
    }
  };

  // ── field enable/disable ────────────────────────────────────────────────
  const handleToggleEnabled = async (field: TemplateField, next: boolean) => {
    // optimistic update
    setFields((prev) =>
      prev.map((f) => (f.id === field.id ? { ...f, enabled: next } : f))
    );
    try {
      const res = await fetch(
        `/api/admin/templates/${template.id}/fields/${field.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: next }),
        }
      );
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      toast.success(`${field.label} ${next ? "enabled" : "disabled"}`);
    } catch (e) {
      // revert
      setFields((prev) =>
        prev.map((f) =>
          f.id === field.id ? { ...f, enabled: !next } : f
        )
      );
      toast.error(
        e instanceof Error ? e.message : "Failed to toggle field"
      );
    }
  };

  // ── DnD reorder ─────────────────────────────────────────────────────────
  const handleDragEnd = async (
    sectionName: string,
    event: DragEndEvent
  ) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sectionFields = fieldsBySection.get(sectionName) ?? [];
    const oldIndex = sectionFields.findIndex((f) => f.id === active.id);
    const newIndex = sectionFields.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(sectionFields, oldIndex, newIndex);
    // reassign sortOrder within this section starting from the smallest
    // existing sortOrder in the section (preserves gaps intentionally).
    const baseSort = sectionFields.length
      ? Math.min(...sectionFields.map((f) => f.sortOrder))
      : 1;
    const reorderedWithSort = reordered.map((f, i) => ({
      ...f,
      sortOrder: baseSort + i,
    }));

    // build new full field list (other sections unchanged)
    const otherFields = fields.filter((f) => f.section !== sectionName);
    const newFields = [...otherFields, ...reorderedWithSort];
    setFields(newFields);

    setReordering(true);
    try {
      const res = await fetch(
        `/api/admin/templates/${template.id}/fields`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: reorderedWithSort.map((f) => ({
              id: f.id,
              sortOrder: f.sortOrder,
            })),
          }),
        }
      );
      if (!res.ok) throw new Error(`Reorder failed (${res.status})`);
      toast.success("Order saved");
      onMutated();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to save order"
      );
      // refetch to restore canonical state
      onMutated();
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black/30">
      <div className="flex h-full flex-col bg-[#FAFAF7]">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 border-b border-black/10 bg-white px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-1.5 text-[13px] font-medium hover:bg-black/5"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="flex size-8 items-center justify-center rounded-lg text-white"
                style={{ background: CORAL }}
              >
                <LayoutTemplate className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold">
                  {template.name}
                </p>
                <p className="truncate text-[11px] text-black/45">
                  /{template.slug}
                </p>
              </div>
            </div>
          </div>
          {reordering && (
            <span className="hidden items-center gap-1.5 text-[11px] text-black/50 sm:flex">
              <Loader2 className="size-3 animate-spin" /> Saving order…
            </span>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
            {/* ── A. Metadata ──────────────────────────────────────────── */}
            <section className="rounded-xl border border-black/10 bg-white p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="size-4" style={{ color: CORAL }} />
                <h3 className="text-[15px] font-bold">Template Metadata</h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
                    Name
                  </label>
                  <input
                    value={meta.name}
                    onChange={(e) =>
                      setMeta({ ...meta, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
                    Slug
                  </label>
                  <input
                    value={meta.slug}
                    onChange={(e) =>
                      setMeta({ ...meta, slug: e.target.value })
                    }
                    className="w-full rounded-lg border border-black/15 px-3 py-2 font-mono text-[13px]"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
                    Description
                  </label>
                  <textarea
                    value={meta.description}
                    onChange={(e) =>
                      setMeta({ ...meta, description: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
                    Ecosystem
                  </label>
                  <select
                    value={meta.ecosystem}
                    onChange={(e) =>
                      setMeta({
                        ...meta,
                        ecosystem: e.target.value as Ecosystem,
                      })
                    }
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
                  >
                    {ECOSYSTEMS.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
                    Icon (Lucide name)
                  </label>
                  <input
                    list="tpl-icon-suggestions"
                    value={meta.icon}
                    onChange={(e) =>
                      setMeta({ ...meta, icon: e.target.value })
                    }
                    placeholder="e.g. Cake"
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
                  />
                  <datalist id="tpl-icon-suggestions">
                    {ICON_SUGGESTIONS.map((i) => (
                      <option key={i} value={i} />
                    ))}
                  </datalist>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2">
                  <div>
                    <p className="text-[12px] font-semibold">Active</p>
                    <p className="text-[10px] text-black/40">
                      Inactive templates can&apos;t be assigned to categories
                    </p>
                  </div>
                  <Switch
                    checked={meta.active}
                    onCheckedChange={(v) => setMeta({ ...meta, active: v })}
                  />
                </div>
                <div className="flex items-end justify-end sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleSaveMeta}
                    disabled={savingMeta}
                    className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
                    style={{ background: CORAL }}
                  >
                    {savingMeta ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Save metadata
                  </button>
                </div>
              </div>
            </section>

            {/* ── B. Fields Manager ────────────────────────────────────── */}
            <section className="rounded-xl border border-black/10 bg-white p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutTemplate
                    className="size-4"
                    style={{ color: PURPLE }}
                  />
                  <h3 className="text-[15px] font-bold">Fields Manager</h3>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: PURPLE_TINT, color: PURPLE }}
                  >
                    {fields.length} total
                  </span>
                </div>
              </div>

              {sectionNames.length === 0 && (
                <div className="rounded-lg border border-dashed border-black/15 py-10 text-center">
                  <p className="text-[13px] font-medium text-black/60">
                    No sections defined
                  </p>
                  <p className="mt-1 text-[12px] text-black/40">
                    Add a field and type a section name to create one.
                  </p>
                  <button
                    type="button"
                    onClick={() => openCreateField("Basic Information")}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white"
                    style={{ background: CORAL }}
                  >
                    <Plus className="size-3.5" /> Add first field
                  </button>
                </div>
              )}

              <div className="space-y-5">
                {sectionNames.map((sectionName) => {
                  const sectionFields =
                    fieldsBySection.get(sectionName) ?? [];
                  return (
                    <div
                      key={sectionName}
                      className="rounded-lg border border-black/10 bg-[#FBFAF6]"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-black/5 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-bold">{sectionName}</p>
                          <span className="text-[10px] font-medium text-black/40">
                            {sectionFields.length} field
                            {sectionFields.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openCreateField(sectionName)}
                          className="inline-flex items-center gap-1 rounded-md border border-black/15 px-2 py-1 text-[11px] font-medium hover:bg-black/5"
                        >
                          <Plus className="size-3" /> Add field
                        </button>
                      </div>

                      <div className="p-3">
                        {sectionFields.length === 0 ? (
                          <p className="py-4 text-center text-[12px] text-black/40">
                            No fields in this section.
                          </p>
                        ) : (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(e) => handleDragEnd(sectionName, e)}
                          >
                            <SortableContext
                              items={sectionFields.map((f) => f.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-2">
                                {sectionFields.map((field) => (
                                  <SortableFieldRow
                                    key={field.id}
                                    field={field}
                                    onEdit={() => openEditField(field)}
                                    onDelete={() => handleDeleteField(field)}
                                    onToggleEnabled={(v) =>
                                      handleToggleEnabled(field, v)
                                    }
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add field at the bottom (uses first section or a default) */}
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    openCreateField(sectionNames[0] ?? "Basic Information")
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-2 text-[12px] font-semibold text-black/60 hover:border-black/30"
                  style={{ borderColor: BORDER_COLOR }}
                >
                  <Plus className="size-4" /> Add field
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Field editor dialog (rendered at panel root so it stays above overlay) */}
      {fieldDialog && (
        <FieldEditorDialog
          open={fieldDialog.open}
          onOpenChange={(v) =>
            setFieldDialog((prev) => (prev ? { ...prev, open: v } : null))
          }
          mode={fieldDialog.mode}
          initial={fieldDialog.initial}
          sections={sectionNames}
          onSave={handleSaveField}
          saving={savingField}
        />
      )}
    </div>
  );
}

// ─── New Template Dialog ──────────────────────────────────────────────────

interface NewTemplateForm {
  slug: string;
  name: string;
  description: string;
  ecosystem: Ecosystem;
  icon: string;
}

function NewTemplateDialog({
  open,
  onOpenChange,
  onCreate,
  creating,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (form: NewTemplateForm) => void;
  creating: boolean;
}) {
  const [form, setForm] = React.useState<NewTemplateForm>({
    slug: "",
    name: "",
    description: "",
    ecosystem: "FINDMYBITES",
    icon: "Package",
  });

  React.useEffect(() => {
    if (open) {
      setForm({
        slug: "",
        name: "",
        description: "",
        ecosystem: "FINDMYBITES",
        icon: "Package",
      });
    }
  }, [open]);

  // auto-slug from name (only while typing, won't override manual edits once set)
  const [slugTouched, setSlugTouched] = React.useState(false);
  React.useEffect(() => {
    if (!slugTouched && form.name) {
      setForm((prev) => ({
        ...prev,
        slug: prev.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      }));
    }
  }, [form.name, slugTouched]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Template</DialogTitle>
          <DialogDescription>
            Create a blank template. Add fields and assign categories next.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Cake & Bakery Template"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              value={form.slug}
              onChange={(e) => {
                setForm({ ...form, slug: e.target.value });
                setSlugTouched(true);
              }}
              placeholder="cake-bakery"
              className="w-full rounded-lg border border-black/15 px-3 py-2 font-mono text-[13px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
                Ecosystem
              </label>
              <select
                value={form.ecosystem}
                onChange={(e) =>
                  setForm({ ...form, ecosystem: e.target.value as Ecosystem })
                }
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
              >
                {ECOSYSTEMS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
                Icon
              </label>
              <input
                list="tpl-icon-suggestions"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
              />
              <datalist id="tpl-icon-suggestions">
                {ICON_SUGGESTIONS.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-4 py-2 text-[13px] font-medium hover:bg-black/5"
          >
            <X className="size-4" /> Cancel
          </button>
          <button
            type="button"
            disabled={creating || !form.name.trim() || !form.slug.trim()}
            onClick={() => onCreate(form)}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
            style={{ background: CORAL }}
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Create template
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── New Mapping Dialog ───────────────────────────────────────────────────

interface NewMappingForm {
  categoryId: string;
  subcategory: string;
  templateId: string;
}

function NewMappingDialog({
  open,
  onOpenChange,
  templates,
  onCreate,
  creating,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  templates: Template[];
  onCreate: (form: NewMappingForm) => void;
  creating: boolean;
}) {
  const [form, setForm] = React.useState<NewMappingForm>({
    categoryId: "",
    subcategory: "",
    templateId: "",
  });

  React.useEffect(() => {
    if (open) {
      setForm({ categoryId: "", subcategory: "", templateId: "" });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Category Mapping</DialogTitle>
          <DialogDescription>
            Assign a template to a category (optionally a subcategory).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
              Category ID <span className="text-red-500">*</span>
            </label>
            <input
              value={form.categoryId}
              onChange={(e) =>
                setForm({ ...form, categoryId: e.target.value })
              }
              placeholder="e.g. bakers-bakery"
              className="w-full rounded-lg border border-black/15 px-3 py-2 font-mono text-[13px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
              Subcategory (optional)
            </label>
            <input
              value={form.subcategory}
              onChange={(e) =>
                setForm({ ...form, subcategory: e.target.value })
              }
              placeholder="e.g. Wedding Cakes — leave blank for category-level"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-black/50">
              Template <span className="text-red-500">*</span>
            </label>
            <select
              value={form.templateId}
              onChange={(e) =>
                setForm({ ...form, templateId: e.target.value })
              }
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            >
              <option value="">Pick a template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (/{t.slug})
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-4 py-2 text-[13px] font-medium hover:bg-black/5"
          >
            <X className="size-4" /> Cancel
          </button>
          <button
            type="button"
            disabled={
              creating ||
              !form.categoryId.trim() ||
              !form.templateId.trim()
            }
            onClick={() => onCreate(form)}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
            style={{ background: CORAL }}
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Add mapping
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Template Card ────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onOpen,
  onDelete,
}: {
  template: Template;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const fieldCount = template.fields?.length ?? 0;
  const mappingCount =
    template._count?.mappings ?? template.mappings?.length ?? 0;
  const active = template.active !== false;

  return (
    <div
      className="group flex flex-col rounded-xl border border-black/10 bg-white p-4 transition-all hover:border-black/25 hover:shadow-sm"
      style={{ borderColor: BORDER_COLOR }}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white"
            style={{ background: CORAL }}
          >
            <LayoutTemplate className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold">{template.name}</p>
            <p className="truncate font-mono text-[11px] text-black/45">
              /{template.slug}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md border border-red-200 p-1.5 text-red-600 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100"
          title="Delete template"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-[12px] text-black/55">
        {template.description || (
          <span className="italic text-black/30">No description</span>
        )}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {ecosystemBadge(template.ecosystem)}
        {active ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: GREEN_BG, color: GREEN_TEXT }}
          >
            <Eye className="size-2.5" /> Active
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: "#FAEEDA", color: "#633806" }}
          >
            <EyeOff className="size-2.5" /> Inactive
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium text-black/55">
          <LayoutTemplate className="size-2.5" /> {fieldCount} fields
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium text-black/55">
          <Link2 className="size-2.5" /> {mappingCount} mapping
          {mappingCount === 1 ? "" : "s"}
        </span>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-3 w-full rounded-lg border border-black/15 px-3 py-1.5 text-[12px] font-semibold text-black/70 hover:bg-black/5"
      >
        Edit template →
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export function AdminTemplates() {
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [mappings, setMappings] = React.useState<TemplateMapping[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string>("templates");
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<Template | null>(null);

  // dialog state
  const [showNewTemplate, setShowNewTemplate] = React.useState(false);
  const [showNewMapping, setShowNewMapping] = React.useState(false);
  const [creatingTemplate, setCreatingTemplate] = React.useState(false);
  const [creatingMapping, setCreatingMapping] = React.useState(false);
  const [seeding, setSeeding] = React.useState(false);

  // ── Fetch templates ───────────────────────────────────────────────────
  const fetchTemplates = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/templates");
      const data = await res.json();
      // API may return { templates: [...] } or [...] — handle both.
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.templates)
          ? data.templates
          : [];
      setTemplates(list);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch mappings ────────────────────────────────────────────────────
  const fetchMappings = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/templates/mappings");
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.mappings)
          ? data.mappings
          : [];
      setMappings(list);
    } catch {
      setMappings([]);
    }
  }, []);

  React.useEffect(() => {
    fetchTemplates();
    fetchMappings();
  }, [fetchTemplates, fetchMappings]);

  // when a template is selected, keep it in sync with the latest fetched data
  // so the editor reflects mutations immediately.
  React.useEffect(() => {
    if (!selectedTemplate) return;
    const fresh = templates.find((t) => t.id === selectedTemplate.id);
    if (fresh && fresh !== selectedTemplate) {
      setSelectedTemplate(fresh);
    }
  }, [templates, selectedTemplate]);

  // ── Seed ──────────────────────────────────────────────────────────────
  const handleSeed = async () => {
    if (
      !confirm(
        "Sync seed templates from code into the database?\n\nThis will CREATE any missing templates (matched by slug). Existing templates and your edits will NOT be overwritten."
      )
    )
      return;
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/templates/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Seed failed (${res.status})`);
      }
      const data = await res.json().catch(() => ({}));
      const count =
        data?.created ?? data?.count ?? data?.total ?? "all";
      toast.success(`Seed complete — synced ${count} templates`);
      fetchTemplates();
      fetchMappings();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  // ── Create template ───────────────────────────────────────────────────
  const handleCreateTemplate = async (form: NewTemplateForm) => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    setCreatingTemplate(true);
    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug.trim(),
          name: form.name.trim(),
          description: form.description,
          ecosystem: form.ecosystem,
          icon: form.icon || "Package",
          sections: [
            {
              name: "Basic Information",
              icon: "Package",
              defaultOpen: true,
              sortOrder: 0,
            },
          ],
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Create failed (${res.status})`);
      }
      const created = await res.json().catch(() => null);
      toast.success("Template created");
      setShowNewTemplate(false);
      await fetchTemplates();
      // open the new template's editor immediately if we got an id back
      if (created?.id) {
        const fresh = (await fetch("/api/admin/templates").then((r) =>
          r.json()
        )) as Template[] | { templates?: Template[] };
        const list = Array.isArray(fresh)
          ? fresh
          : fresh?.templates ?? [];
        const match = list.find((t) => t.id === created.id);
        if (match) setSelectedTemplate(match);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create template");
    } finally {
      setCreatingTemplate(false);
    }
  };

  // ── Delete template ───────────────────────────────────────────────────
  const handleDeleteTemplate = async (template: Template) => {
    if (
      !confirm(
        `Delete template "${template.name}"?\n\nThis also removes its fields. Mappings to this template may break.`
      )
    )
      return;
    try {
      const res = await fetch(`/api/admin/templates/${template.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      toast.success("Template deleted");
      fetchTemplates();
      fetchMappings();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete template");
    }
  };

  // ── Create mapping ────────────────────────────────────────────────────
  const handleCreateMapping = async (form: NewMappingForm) => {
    if (!form.categoryId.trim() || !form.templateId.trim()) {
      toast.error("Category ID and template are required");
      return;
    }
    setCreatingMapping(true);
    try {
      const res = await fetch("/api/admin/templates/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: form.categoryId.trim(),
          subcategory: form.subcategory.trim() || undefined,
          templateId: form.templateId.trim(),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Create failed (${res.status})`);
      }
      toast.success("Mapping created");
      setShowNewMapping(false);
      fetchMappings();
      fetchTemplates(); // mapping counts on cards
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create mapping");
    } finally {
      setCreatingMapping(false);
    }
  };

  // ── Delete mapping ────────────────────────────────────────────────────
  const handleDeleteMapping = async (m: TemplateMapping) => {
    if (
      !confirm(
        `Delete mapping for ${m.categoryId}${
          m.subcategory ? ` / ${m.subcategory}` : ""
        }?`
      )
    )
      return;
    try {
      const params = new URLSearchParams({ categoryId: m.categoryId });
      if (m.subcategory) params.set("subcategory", m.subcategory);
      const res = await fetch(
        `/api/admin/templates/mappings?${params.toString()}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      toast.success("Mapping deleted");
      fetchMappings();
      fetchTemplates();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete mapping");
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin" style={{ color: CORAL }} />
      </div>
    );
  }

  // ── Template editor overlay ──────────────────────────────────────────
  if (selectedTemplate) {
    return (
      <TemplateEditorPanel
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onMutated={() => {
          fetchTemplates();
        }}
      />
    );
  }

  // ── Main render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight">
            Template Engine
          </h2>
          <p className="mt-1 text-[13px]" style={{ color: MUTED }}>
            Manage listing templates, fields, and category→template mappings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-2 rounded-lg border border-black/15 bg-white px-3 py-2 text-[13px] font-semibold hover:bg-black/5 disabled:opacity-50"
          >
            {seeding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Database className="size-4" />
            )}
            Seed Templates
          </button>
          <button
            type="button"
            onClick={() => setShowNewTemplate(true)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white"
            style={{ background: CORAL }}
          >
            <Plus className="size-4" /> New Template
          </button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">
            <LayoutTemplate className="size-3.5" /> Templates
          </TabsTrigger>
          <TabsTrigger value="mappings">
            <Link2 className="size-3.5" /> Mappings
          </TabsTrigger>
        </TabsList>

        {/* ── Templates Tab ─────────────────────────────────────────── */}
        <TabsContent value="templates">
          {templates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/15 bg-white py-16 text-center">
              <LayoutTemplate
                className="mx-auto size-10 text-black/20"
                style={{ color: MUTED_LIGHT }}
              />
              <p className="mt-3 text-[15px] font-medium">
                No templates in the database yet
              </p>
              <p className="mt-1 text-[13px]" style={{ color: MUTED_LIGHT }}>
                Click <strong>Seed Templates</strong> to sync the 14 canonical
                templates from code,
                <br />
                or <strong>New Template</strong> to build one from scratch.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onOpen={() => setSelectedTemplate(t)}
                  onDelete={() => handleDeleteTemplate(t)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Mappings Tab ──────────────────────────────────────────── */}
        <TabsContent value="mappings">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px]" style={{ color: MUTED }}>
              {mappings.length} mapping{mappings.length === 1 ? "" : "s"} —
              resolution order: subcategory → category → ecosystem default.
            </p>
            <button
              type="button"
              onClick={() => setShowNewMapping(true)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-white"
              style={{ background: CORAL }}
            >
              <Plus className="size-4" /> Add Mapping
            </button>
          </div>

          {mappings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/15 bg-white py-16 text-center">
              <Link2
                className="mx-auto size-10"
                style={{ color: MUTED_LIGHT }}
              />
              <p className="mt-3 text-[15px] font-medium">No mappings yet</p>
              <p className="mt-1 text-[13px]" style={{ color: MUTED_LIGHT }}>
                Click <strong>Add Mapping</strong> to assign a template to a
                category.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/10 bg-black/[0.02]">
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-black/50">
                        Category ID
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-black/50">
                        Subcategory
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-black/50">
                        Template
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-black/50">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.map((m) => (
                      <tr
                        key={m.id}
                        className="border-b border-black/5 hover:bg-black/[0.015]"
                      >
                        <td className="px-4 py-3">
                          <code className="font-mono text-[12px] font-medium">
                            {m.categoryId}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[13px]">
                          {m.subcategory ? (
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                              {m.subcategory}
                            </span>
                          ) : (
                            <span className="text-black/30">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {m.template ? (
                            <span className="text-[13px] font-medium">
                              {m.template.name}{" "}
                              <span
                                className="font-mono text-[11px]"
                                style={{ color: MUTED_LIGHT }}
                              >
                                /{m.template.slug}
                              </span>
                            </span>
                          ) : (
                            <span
                              className="text-[11px] italic"
                              style={{ color: MUTED_LIGHT }}
                            >
                              template missing
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteMapping(m)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-[12px] text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NewTemplateDialog
        open={showNewTemplate}
        onOpenChange={setShowNewTemplate}
        onCreate={handleCreateTemplate}
        creating={creatingTemplate}
      />
      <NewMappingDialog
        open={showNewMapping}
        onOpenChange={setShowNewMapping}
        templates={templates}
        onCreate={handleCreateMapping}
        creating={creatingMapping}
      />
    </div>
  );
}
