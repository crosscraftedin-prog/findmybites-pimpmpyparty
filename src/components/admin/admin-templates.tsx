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
  Copy,
  Download,
  Upload,
  History,
  GitBranch,
  AlertTriangle,
  Globe,
  Search,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Tag,
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

import {
  FIELD_TYPE_CATALOG,
  type FieldType,
  type TemplateDef,
} from "@/lib/template-definitions";
import { TemplateForm } from "@/components/dashboard/TemplateForm";

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
// FIELD_TYPE_CATALOG is imported from @/lib/template-definitions so the
// admin UI stays in sync with the canonical field-type registry (which now
// includes the v2 catalog of 30+ types grouped by category).

// Field types grouped by category for the Field Editor dropdown.
const FIELD_TYPE_GROUPS = (() => {
  const groups = new Map<string, { type: FieldType; label: string }[]>();
  for (const entry of FIELD_TYPE_CATALOG) {
    if (!groups.has(entry.group)) groups.set(entry.group, []);
    groups.get(entry.group)!.push({ type: entry.type, label: entry.label });
  }
  return Array.from(groups.entries()); // [group, entries][]
})();

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
  // ── v2: Validation ──
  minLength?: number | null;
  maxLength?: number | null;
  pattern?: string | null;
  patternHint?: string | null;
  maxFileSize?: number | null; // KB
  // ── v2: Repeatable ──
  repeatable?: boolean | null;
  minRepeats?: number | null;
  maxRepeats?: number | null;
  repeatLabel?: string | null;
  repeatFields?: string | null;
  // ── v2: Search / SEO / AI flags ──
  searchable?: boolean | null;
  seoIndexed?: boolean | null;
  aiEnabled?: boolean | null;
  // ── v2: Global field provenance ──
  globalRef?: string | null;
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
  // ── v2 ──
  version?: number;
  isLatest?: boolean;
  parentTemplateId?: string | null;
  isGlobal?: boolean;
  aiEnabled?: boolean;
}

interface TemplateMapping {
  id: string;
  categoryId: string;
  subcategory?: string | null;
  templateId: string;
  template?: { id: string; name: string; slug: string };
}

interface TemplateVersionSnapshot {
  id: string;
  version: number;
  changeNote?: string | null;
  snapshot?: string | null; // JSON-stringified template at that version
  createdAt: string;
  adminEmail?: string | null;
}

interface TemplateAuditLog {
  id: string;
  action: string;
  changeSummary?: string | null;
  adminEmail?: string | null;
  createdAt: string;
  metadata?: string | null;
}

interface TemplateUsage {
  mappings?: TemplateMapping[] | { categoryId: string; subcategory?: string | null }[];
  categoryCount?: number;
  productCount?: number;
  vendorCount?: number;
}

interface SafeDeleteCheck {
  canDelete: boolean;
  productCount?: number;
  mappingCount?: number;
  warning?: string | null;
  blockReasons?: string[];
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
    // v2 types
    date: { bg: "#DBEAFE", text: "#1E40AF" },
    time: { bg: "#DBEAFE", text: "#1E40AF" },
    datetime: { bg: "#DBEAFE", text: "#1E40AF" },
    daterange: { bg: "#DBEAFE", text: "#1E40AF" },
    currency: { bg: "#FEF9C3", text: "#854D0E" },
    price: { bg: "#FEF9C3", text: "#854D0E" },
    address: { bg: "#ECFCCB", text: "#3F6212" },
    phone: { bg: "#FCE7F3", text: "#9D174D" },
    email: { bg: "#FCE7F3", text: "#9D174D" },
    url: { bg: "#FCE7F3", text: "#9D174D" },
    color: { bg: "#F3E8FF", text: "#6B21A8" },
    richtext: { bg: "#F1F5F9", text: "#334155" },
    tags: { bg: "#FEF3C7", text: "#92400E" },
    gallery: { bg: "#FCE7F3", text: "#9D174D" },
    videourl: { bg: "#FCE7F3", text: "#9D174D" },
    fileupload: { bg: "#FCE7F3", text: "#9D174D" },
    pdfupload: { bg: "#FCE7F3", text: "#9D174D" },
    repeater: { bg: "#E0E7FF", text: "#3730A3" },
    availability: { bg: "#DBEAFE", text: "#1E40AF" },
    bookingduration: { bg: "#DBEAFE", text: "#1E40AF" },
    radius: { bg: "#ECFCCB", text: "#3F6212" },
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

/**
 * Time-ago formatter for audit logs / snapshots.
 * Returns strings like "just now", "5m ago", "3h ago", "2d ago", or a date.
 */
function timeAgo(input?: string | null): string {
  if (!input) return "—";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 30) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return d.toLocaleDateString();
}

// ─── Sortable field row ───────────────────────────────────────────────────

function SortableFieldRow({
  field,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleEnabled,
}: {
  field: TemplateField;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
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
            onClick={onDuplicate}
            className="rounded-md border border-black/10 p-1.5 text-black/60 hover:bg-black/5"
            title="Duplicate field"
          >
            <Copy className="size-3.5" />
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
  // ── v2 ──
  minLength: number;
  maxLength: number;
  pattern: string;
  patternHint: string;
  maxFileSize: number;
  repeatable: boolean;
  minRepeats: number;
  maxRepeats: number;
  repeatLabel: string;
  repeatFields: string;
  searchable: boolean;
  seoIndexed: boolean;
  aiEnabled: boolean;
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
    // ── v2 ──
    minLength: 0,
    maxLength: 0,
    pattern: "",
    patternHint: "",
    maxFileSize: 0,
    repeatable: false,
    minRepeats: 0,
    maxRepeats: 0,
    repeatLabel: "",
    repeatFields: "",
    searchable: false,
    seoIndexed: false,
    aiEnabled: false,
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
    // ── v2 ──
    minLength: field.minLength ?? 0,
    maxLength: field.maxLength ?? 0,
    pattern: field.pattern ?? "",
    patternHint: field.patternHint ?? "",
    maxFileSize: field.maxFileSize ?? 0,
    repeatable: !!field.repeatable,
    minRepeats: field.minRepeats ?? 0,
    maxRepeats: field.maxRepeats ?? 0,
    repeatLabel: field.repeatLabel ?? "",
    repeatFields: field.repeatFields ?? "",
    searchable: !!field.searchable,
    seoIndexed: !!field.seoIndexed,
    aiEnabled: !!field.aiEnabled,
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
  if (form.type === "images" || form.type === "gallery")
    payload.maxImages = Number(form.maxImages) || 10;

  // ── v2: validation ──
  if (form.minLength && form.minLength > 0)
    payload.minLength = Number(form.minLength);
  if (form.maxLength && form.maxLength > 0)
    payload.maxLength = Number(form.maxLength);
  if (form.pattern.trim()) payload.pattern = form.pattern.trim();
  if (form.patternHint.trim()) payload.patternHint = form.patternHint.trim();
  if (
    (form.type === "fileupload" || form.type === "pdfupload") &&
    form.maxFileSize > 0
  ) {
    payload.maxFileSize = Number(form.maxFileSize);
  }

  // ── v2: repeatable ──
  if (form.repeatable) {
    payload.repeatable = true;
    if (form.minRepeats > 0) payload.minRepeats = Number(form.minRepeats);
    if (form.maxRepeats > 0) payload.maxRepeats = Number(form.maxRepeats);
    if (form.repeatLabel.trim())
      payload.repeatLabel = form.repeatLabel.trim();
    if (form.repeatFields.trim())
      payload.repeatFields = form.repeatFields.trim();
  }

  // ── v2: search / seo / ai flags ──
  if (form.searchable) payload.searchable = true;
  if (form.seoIndexed) payload.seoIndexed = true;
  if (form.aiEnabled) payload.aiEnabled = true;

  return payload;
}

function FieldEditorDialog({
  open,
  onOpenChange,
  mode,
  initial,
  sections,
  allFields,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  initial: FieldFormState;
  sections: string[];
  allFields: TemplateField[];
  onSave: (form: FieldFormState) => void;
  saving: boolean;
}) {
  const [form, setForm] = React.useState<FieldFormState>(initial);
  const [showValidation, setShowValidation] = React.useState(false);
  const [showRepeatable, setShowRepeatable] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm(initial);
      // auto-expand sections that already have v2 data
      setShowValidation(
        !!(
          initial.minLength ||
          initial.maxLength ||
          initial.pattern ||
          initial.maxFileSize
        )
      );
      setShowRepeatable(!!initial.repeatable);
    }
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
  const isImages = form.type === "images" || form.type === "gallery";
  const isNumber = form.type === "number";
  const isFileUpload =
    form.type === "fileupload" || form.type === "pdfupload";
  const isTextual =
    form.type === "text" ||
    form.type === "textarea" ||
    form.type === "richtext" ||
    form.type === "email" ||
    form.type === "url" ||
    form.type === "phone";

  // ── Visual Conditional Logic Builder ──
  // Available target fields = every other field key (excluding self).
  const conditionTargets = React.useMemo(() => {
    return allFields
      .filter((f) => f.key && f.key !== form.key)
      .map((f) => ({
        key: f.key,
        label: f.label || f.key,
        options: f.staticOptions ?? null,
        filterGroupName: f.filterGroupName ?? null,
      }));
  }, [allFields, form.key]);

  const conditionTarget = conditionTargets.find(
    (t) => t.key === form.conditionField
  );
  // Available value chips: from static options, or filter group (display only,
  // since the actual filter values come from the API at form-render time).
  const conditionValueOptions = conditionTarget?.options ?? null;
  const conditionValuesList = splitLines(form.conditionValues);

  const toggleConditionValue = (value: string) => {
    const set2 = new Set(conditionValuesList);
    if (set2.has(value)) set2.delete(value);
    else set2.add(value);
    set("conditionValues", Array.from(set2).join(", "));
  };

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
              {FIELD_TYPE_GROUPS.map(([group, entries]) => (
                <optgroup key={group} label={group}>
                  {entries.map((entry) => (
                    <option key={entry.type} value={entry.type}>
                      {entry.label} ({entry.type})
                    </option>
                  ))}
                </optgroup>
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

          {/* ── Visual Conditional Logic Builder ── */}
          <div className="space-y-2 sm:col-span-2 rounded-lg border border-black/10 bg-[#FBFAF6] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <GitBranch className="size-3.5" style={{ color: PURPLE }} />
                <p className="text-[12px] font-semibold">
                  Conditional Visibility
                </p>
              </div>
              {form.conditionField && (
                <button
                  type="button"
                  onClick={() => {
                    set("conditionField", "");
                    set("conditionValues", "");
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-black/10 px-2 py-0.5 text-[10px] font-medium text-black/60 hover:bg-black/5"
                >
                  <X className="size-3" /> Clear condition
                </button>
              )}
            </div>
            <p className="text-[10px] text-black/45">
              Show this field only when another field&apos;s value matches.
            </p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-black/50">
                  Show when field
                </label>
                <select
                  value={form.conditionField}
                  onChange={(e) => {
                    set("conditionField", e.target.value);
                    set("conditionValues", "");
                  }}
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-[12px]"
                >
                  <option value="">— No condition (always shown) —</option>
                  {conditionTargets.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label} ({t.key})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-black/50">
                  Match mode
                </label>
                <div className="flex h-[34px] items-center gap-1 rounded-lg border border-black/15 bg-white px-2 text-[11px] font-medium">
                  <span className="rounded bg-black/[0.04] px-2 py-0.5">
                    is one of
                  </span>
                  <span className="text-black/40">
                    (multi-select; empty string = shown by default)
                  </span>
                </div>
              </div>
            </div>

            {form.conditionField && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-black/50">
                  Match values
                </label>
                {conditionValueOptions && conditionValueOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {conditionValueOptions.map((opt) => {
                      const selected = conditionValuesList.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleConditionValue(opt)}
                          className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                          style={
                            selected
                              ? {
                                  background: CORAL,
                                  color: "#fff",
                                  borderColor: CORAL,
                                }
                              : {
                                  background: "#fff",
                                  color: "#444",
                                  borderColor: BORDER_COLOR,
                                }
                          }
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : conditionTarget?.filterGroupName ? (
                  <div className="rounded-md border border-dashed border-black/15 bg-white p-2">
                    <p className="text-[10px] text-black/50">
                      This field pulls options from the filter group{" "}
                      <code className="font-mono">
                        {conditionTarget.filterGroupName}
                      </code>{" "}
                      at runtime. Type the values that should show this field:
                    </p>
                    <input
                      value={form.conditionValues}
                      onChange={(e) => set("conditionValues", e.target.value)}
                      placeholder="Cakes, Cupcakes"
                      className="mt-1.5 w-full rounded-lg border border-black/15 px-3 py-2 text-[12px]"
                    />
                  </div>
                ) : (
                  <input
                    value={form.conditionValues}
                    onChange={(e) => set("conditionValues", e.target.value)}
                    placeholder="Comma-separated values, e.g. Cakes, Cupcakes"
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-[12px]"
                  />
                )}
                {conditionValuesList.length > 0 && (
                  <p className="text-[10px] text-black/45">
                    Selected:{" "}
                    {conditionValuesList.map((v) => (
                      <span
                        key={v}
                        className="ml-1 inline-block rounded bg-black/[0.04] px-1.5 py-0.5 font-mono"
                      >
                        {v || "(empty = default)"}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            )}
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

          {/* ── v2: Validation section (collapsible) ── */}
          {(isTextual || isNumber || isFileUpload) && (
            <div className="sm:col-span-2 rounded-lg border border-black/10 bg-[#FBFAF6]">
              <button
                type="button"
                onClick={() => setShowValidation((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
              >
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
                  <ShieldCheck className="size-3.5" style={{ color: CORAL }} />
                  Validation
                </span>
                {showValidation ? (
                  <ChevronDown className="size-3.5 text-black/40" />
                ) : (
                  <ChevronRight className="size-3.5 text-black/40" />
                )}
              </button>
              {showValidation && (
                <div className="grid grid-cols-1 gap-3 border-t border-black/5 p-3 sm:grid-cols-2">
                  {(isTextual || isNumber) && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wide text-black/50">
                          Min length / min value
                        </label>
                        <input
                          type="number"
                          value={form.minLength}
                          onChange={(e) =>
                            set("minLength", Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wide text-black/50">
                          Max length / max value
                        </label>
                        <input
                          type="number"
                          value={form.maxLength}
                          onChange={(e) =>
                            set("maxLength", Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
                        />
                      </div>
                    </>
                  )}
                  {isTextual && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wide text-black/50">
                          Pattern (regex)
                        </label>
                        <input
                          value={form.pattern}
                          onChange={(e) => set("pattern", e.target.value)}
                          placeholder="^[a-zA-Z0-9 ]+$"
                          className="w-full rounded-lg border border-black/15 px-3 py-2 font-mono text-[12px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wide text-black/50">
                          Pattern hint (shown to vendor)
                        </label>
                        <input
                          value={form.patternHint}
                          onChange={(e) => set("patternHint", e.target.value)}
                          placeholder="Letters and numbers only"
                          className="w-full rounded-lg border border-black/15 px-3 py-2 text-[12px]"
                        />
                      </div>
                    </>
                  )}
                  {isFileUpload && (
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-black/50">
                        Max file size (KB)
                      </label>
                      <input
                        type="number"
                        value={form.maxFileSize}
                        onChange={(e) =>
                          set("maxFileSize", Number(e.target.value))
                        }
                        placeholder="e.g. 5120 (5 MB)"
                        className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
                      />
                      <p className="text-[10px] text-black/40">
                        Leave 0 for no limit.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── v2: Repeatable section (collapsible, non-media types) ── */}
          {!isImages && !isFileUpload && form.type !== "section_toggle" && (
            <div className="sm:col-span-2 rounded-lg border border-black/10 bg-[#FBFAF6]">
              <button
                type="button"
                onClick={() => setShowRepeatable((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
              >
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
                  <Copy className="size-3.5" style={{ color: PURPLE }} />
                  Repeatable
                </span>
                <Switch
                  checked={form.repeatable}
                  onCheckedChange={(v) => {
                    set("repeatable", v);
                    setShowRepeatable(v);
                  }}
                />
              </button>
              {showRepeatable && form.repeatable && (
                <div className="grid grid-cols-1 gap-3 border-t border-black/5 p-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-black/50">
                      Min repeats
                    </label>
                    <input
                      type="number"
                      value={form.minRepeats}
                      onChange={(e) =>
                        set("minRepeats", Number(e.target.value))
                      }
                      className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-black/50">
                      Max repeats
                    </label>
                    <input
                      type="number"
                      value={form.maxRepeats}
                      onChange={(e) =>
                        set("maxRepeats", Number(e.target.value))
                      }
                      className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-black/50">
                      Repeat label (e.g. &quot;Add another&quot;)
                    </label>
                    <input
                      value={form.repeatLabel}
                      onChange={(e) => set("repeatLabel", e.target.value)}
                      className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-black/50">
                      Repeat fields (comma-separated keys)
                    </label>
                    <input
                      value={form.repeatFields}
                      onChange={(e) => set("repeatFields", e.target.value)}
                      placeholder="name, price, quantity"
                      className="w-full rounded-lg border border-black/15 px-3 py-2 font-mono text-[12px]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── v2: Flags section ── */}
          <div className="sm:col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="flex items-start justify-between gap-2 rounded-lg border border-black/10 px-3 py-2">
              <div>
                <p className="inline-flex items-center gap-1 text-[12px] font-semibold">
                  <Search className="size-3" /> Searchable
                </p>
                <p className="text-[10px] text-black/40">
                  Include this field in marketplace search.
                </p>
              </div>
              <Switch
                checked={form.searchable}
                onCheckedChange={(v) => set("searchable", v)}
              />
            </div>
            <div className="flex items-start justify-between gap-2 rounded-lg border border-black/10 px-3 py-2">
              <div>
                <p className="inline-flex items-center gap-1 text-[12px] font-semibold">
                  <Tag className="size-3" /> SEO indexed
                </p>
                <p className="text-[10px] text-black/40">
                  Surface value on SEO listing pages.
                </p>
              </div>
              <Switch
                checked={form.seoIndexed}
                onCheckedChange={(v) => set("seoIndexed", v)}
              />
            </div>
            <div className="flex items-start justify-between gap-2 rounded-lg border border-black/10 px-3 py-2">
              <div>
                <p className="inline-flex items-center gap-1 text-[12px] font-semibold">
                  <Sparkles className="size-3" /> AI enabled
                </p>
                <p className="text-[10px] text-black/40">
                  Available for AI-generated suggestions.
                </p>
              </div>
              <Switch
                checked={form.aiEnabled}
                onCheckedChange={(v) => set("aiEnabled", v)}
              />
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
  onOpenDuplicate,
}: {
  template: Template;
  onClose: () => void;
  onMutated: () => void;
  onOpenDuplicate?: (id: string) => void;
}) {
  const [meta, setMeta] = React.useState({
    name: template.name,
    slug: template.slug,
    description: template.description,
    ecosystem: template.ecosystem,
    icon: template.icon ?? "",
    active: template.active !== false,
  });
  const [fields, setFields] = React.useState<TemplateField[]>(
    Array.isArray(template.fields) ? template.fields : []
  );
  const [sections, setSections] = React.useState<TemplateSection[]>(
    Array.isArray(template.sections) ? template.sections : []
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

  // ── v2: enterprise state ──
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewData, setPreviewData] = React.useState<{
    template: TemplateDef | null;
    filterOptions: Record<string, string[]>;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [duplicating, setDuplicating] = React.useState(false);
  const [versionInfo, setVersionInfo] = React.useState<{
    currentVersion: number;
    snapshots: TemplateVersionSnapshot[];
  } | null>(null);
  const [showSnapshots, setShowSnapshots] = React.useState(false);
  const [bumpingVersion, setBumpingVersion] = React.useState(false);
  const [auditLogs, setAuditLogs] = React.useState<TemplateAuditLog[] | null>(
    null
  );
  const [usage, setUsage] = React.useState<TemplateUsage | null>(null);

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
    // Defensive: ensure fields and sections are always arrays
    setFields(Array.isArray(template.fields) ? template.fields : []);
    setSections(Array.isArray(template.sections) ? template.sections : []);
  }, [template]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // section names — include both declared sections and any sections referenced
  // by fields but missing from the sections[] array (defensive).
  const sectionNames = React.useMemo(() => {
    const seen = new Map<number, string>();
    const safeSections = Array.isArray(sections) ? sections : [];
    safeSections
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((s) => seen.set(s.sortOrder, s.name));
    const safeFields = Array.isArray(fields) ? fields : [];
    safeFields.forEach((f) => {
      if (!Array.from(seen.values()).includes(f.section)) {
        seen.set(9000 + f.sortOrder, f.section);
      }
    });
    return Array.from(seen.values());
  }, [sections, fields]);

  const fieldsBySection = React.useMemo(() => {
    const map = new Map<string, TemplateField[]>();
    sectionNames.forEach((s) => map.set(s, []));
    const safeFields = Array.isArray(fields) ? fields : [];
    safeFields
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

  // ── v2: fetch version + audit log + usage when template changes ─────────
  React.useEffect(() => {
    let cancelled = false;
    const id = template.id;
    const fetchVersion = async () => {
      try {
        const res = await fetch(`/api/admin/templates/${id}/version`);
        if (!res.ok) return;
        const d = await res.json();
        if (cancelled) return;
        setVersionInfo({
          currentVersion: d.currentVersion ?? d.version ?? template.version ?? 1,
          snapshots: Array.isArray(d.snapshots) ? d.snapshots : [],
        });
      } catch {
        /* non-fatal */
      }
    };
    const fetchAudit = async () => {
      try {
        const res = await fetch(`/api/admin/templates/${id}/audit-log`);
        if (!res.ok) return;
        const d = await res.json();
        if (cancelled) return;
        setAuditLogs(Array.isArray(d.logs) ? d.logs : []);
      } catch {
        /* non-fatal */
      }
    };
    const fetchUsage = async () => {
      try {
        const res = await fetch(`/api/admin/templates/${id}/usage`);
        if (!res.ok) return;
        const d = await res.json();
        if (cancelled) return;
        setUsage(d);
      } catch {
        /* non-fatal */
      }
    };
    fetchVersion();
    fetchAudit();
    fetchUsage();
    return () => {
      cancelled = true;
    };
  }, [template.id, template.version, template]);

  // ── v2: Preview ─────────────────────────────────────────────────────────
  const handleOpenPreview = async () => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const res = await fetch(`/api/admin/templates/${template.id}/preview`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Preview failed (${res.status})`);
      }
      const d = await res.json();
      setPreviewData({
        template: (d.template as TemplateDef) ?? null,
        filterOptions: (d.filterOptions as Record<string, string[]>) ?? {},
      });
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to load preview"
      );
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // ── v2: Duplicate template ─────────────────────────────────────────────
  const handleDuplicateTemplate = async () => {
    setDuplicating(true);
    try {
      const res = await fetch(
        `/api/admin/templates/${template.id}/duplicate`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Duplicate failed (${res.status})`);
      }
      const d = await res.json();
      toast.success("Template duplicated");
      onMutated();
      if (d?.template?.id && onOpenDuplicate) {
        onOpenDuplicate(d.template.id);
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to duplicate template"
      );
    } finally {
      setDuplicating(false);
    }
  };

  // ── v2: Duplicate field ────────────────────────────────────────────────
  const handleDuplicateField = async (field: TemplateField) => {
    try {
      const res = await fetch(
        `/api/admin/templates/${template.id}/fields/${field.id}/duplicate`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Duplicate failed (${res.status})`);
      }
      toast.success(`Field "${field.label}" duplicated`);
      onMutated();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to duplicate field"
      );
    }
  };

  // ── v2: Bump version ───────────────────────────────────────────────────
  const handleBumpVersion = async () => {
    const changeNote =
      prompt("Bump version — add a change note (optional):") ?? "";
    setBumpingVersion(true);
    try {
      const res = await fetch(`/api/admin/templates/${template.id}/version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeNote: changeNote.trim() || undefined }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Bump failed (${res.status})`);
      }
      const d = await res.json();
      toast.success(`Version bumped to v${d.version ?? "?"}`);
      onMutated();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to bump version"
      );
    } finally {
      setBumpingVersion(false);
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenPreview}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3 py-1.5 text-[12px] font-semibold hover:bg-black/5"
              title="Preview how this template renders for vendors"
            >
              <Eye className="size-3.5" /> Preview
            </button>
            <button
              type="button"
              onClick={handleDuplicateTemplate}
              disabled={duplicating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3 py-1.5 text-[12px] font-semibold hover:bg-black/5 disabled:opacity-50"
              title="Duplicate this template"
            >
              {duplicating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Copy className="size-3.5" />
              )}
              Duplicate
            </button>
          </div>
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
                                    onDuplicate={() =>
                                      handleDuplicateField(field)
                                    }
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

            {/* ── C. Version & Audit (v2) ────────────────────────────────── */}
            <section className="rounded-xl border border-black/10 bg-white p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <GitBranch className="size-4" style={{ color: PURPLE }} />
                <h3 className="text-[15px] font-bold">Versioning</h3>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: PURPLE_TINT, color: PURPLE }}
                >
                  v{versionInfo?.currentVersion ?? template.version ?? 1}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleBumpVersion}
                  disabled={bumpingVersion}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-1.5 text-[12px] font-semibold hover:bg-black/5 disabled:opacity-50"
                >
                  {bumpingVersion ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <GitBranch className="size-3.5" />
                  )}
                  Bump Version
                </button>
                {versionInfo && versionInfo.snapshots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSnapshots((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-lg border border-black/15 px-3 py-1.5 text-[12px] font-medium hover:bg-black/5"
                  >
                    {showSnapshots ? (
                      <ChevronDown className="size-3.5" />
                    ) : (
                      <ChevronRight className="size-3.5" />
                    )}
                    {versionInfo.snapshots.length} snapshot
                    {versionInfo.snapshots.length === 1 ? "" : "s"}
                  </button>
                )}
              </div>

              {showSnapshots && versionInfo && (
                <div className="mt-3 space-y-2">
                  {versionInfo.snapshots.length === 0 ? (
                    <p className="text-[12px] text-black/40">
                      No version snapshots yet.
                    </p>
                  ) : (
                    versionInfo.snapshots.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-black/10 bg-[#FBFAF6] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold">
                            v{s.version}
                            {s.changeNote ? (
                              <span className="ml-1.5 text-black/55">
                                — {s.changeNote}
                              </span>
                            ) : null}
                          </p>
                          {s.adminEmail && (
                            <p className="text-[10px] text-black/45">
                              by {s.adminEmail}
                            </p>
                          )}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] text-black/45">
                          <Clock className="size-3" /> {timeAgo(s.createdAt)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>

            {/* ── D. Usage Statistics (v2) ───────────────────────────────── */}
            <section className="rounded-xl border border-black/10 bg-white p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="size-4" style={{ color: CORAL }} />
                <h3 className="text-[15px] font-bold">Usage</h3>
              </div>

              {!usage ? (
                <p className="text-[12px] text-black/40">
                  Loading usage statistics…
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      {
                        label: "Categories",
                        value: usage.categoryCount ?? 0,
                      },
                      {
                        label: "Products",
                        value: usage.productCount ?? 0,
                      },
                      {
                        label: "Vendors",
                        value: usage.vendorCount ?? 0,
                      },
                      {
                        label: "Mappings",
                        value:
                          (usage.mappings && Array.isArray(usage.mappings)
                            ? usage.mappings.length
                            : 0) ||
                          template._count?.mappings ||
                          0,
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-lg border border-black/10 bg-[#FBFAF6] px-3 py-2 text-center"
                      >
                        <p
                          className="text-[20px] font-bold"
                          style={{ color: CORAL }}
                        >
                          {stat.value}
                        </p>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-black/50">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {usage.mappings && Array.isArray(usage.mappings) && (
                    usage.mappings.length > 0 ? (
                      <div className="mt-3">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-black/50">
                          Mapped categories
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {usage.mappings.map((m, idx) => {
                            const cat = m.categoryId;
                            const sub = m.subcategory;
                            return (
                              <span
                                key={`${cat}-${sub ?? ""}-${idx}`}
                                className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium text-black/70"
                              >
                                <code className="font-mono">{cat}</code>
                                {sub && (
                                  <span className="text-black/40">/{sub}</span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-[11px] text-black/40">
                        Not assigned to any categories yet.
                      </p>
                    )
                  )}
                </>
              )}
            </section>

            {/* ── E. Audit Log (v2) ──────────────────────────────────────── */}
            <section className="rounded-xl border border-black/10 bg-white p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <History className="size-4" style={{ color: PURPLE }} />
                <h3 className="text-[15px] font-bold">Audit Log</h3>
              </div>

              {!auditLogs ? (
                <p className="text-[12px] text-black/40">Loading audit log…</p>
              ) : auditLogs.length === 0 ? (
                <p className="text-[12px] text-black/40">
                  No changes recorded yet.
                </p>
              ) : (
                <ol className="relative space-y-3 border-l border-black/10 pl-4">
                  {auditLogs.map((log) => (
                    <li key={log.id} className="relative">
                      <span
                        className="absolute -left-[1.18rem] top-1.5 size-2.5 rounded-full"
                        style={{ background: CORAL }}
                      />
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-[12px] font-semibold">
                          {log.action}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-black/45">
                          <Clock className="size-3" /> {timeAgo(log.createdAt)}
                        </span>
                      </div>
                      {log.changeSummary && (
                        <p className="mt-0.5 text-[12px] text-black/60">
                          {log.changeSummary}
                        </p>
                      )}
                      {log.adminEmail && (
                        <p className="mt-0.5 text-[10px] text-black/45">
                          by {log.adminEmail}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
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
          allFields={fields}
          onSave={handleSaveField}
          saving={savingField}
        />
      )}

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              <Eye className="mr-1.5 inline size-4" style={{ color: CORAL }} />
              Vendor Form Preview
            </DialogTitle>
            <DialogDescription>
              This is exactly what vendors will see when filling out a listing
              with the &quot;{template.name}&quot; template.
            </DialogDescription>
          </DialogHeader>

          {previewLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin" style={{ color: CORAL }} />
            </div>
          ) : previewData?.template ? (
            <PreviewForm template={previewData.template} filterOptions={previewData.filterOptions} />
          ) : (
            <p className="py-8 text-center text-[13px] text-black/40">
              No preview data available.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Preview Form (wraps TemplateForm with sample/empty state) ────────────

function PreviewForm({
  template,
  filterOptions,
}: {
  template: TemplateDef;
  filterOptions: Record<string, string[]>;
}) {
  const [form, setForm] = React.useState<Record<string, unknown>>({});

  const set = React.useCallback((key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleArray = React.useCallback((key: string, value: string) => {
    setForm((prev) => {
      const arr = Array.isArray(prev[key]) ? (prev[key] as string[]) : [];
      const next = arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value];
      return { ...prev, [key]: next };
    });
  }, []);

  return (
    <div className="rounded-lg border border-black/10 bg-[#FBFAF6] p-3">
      <TemplateForm
        template={template}
        filterOptions={filterOptions}
        form={form}
        set={set}
        toggleArray={toggleArray}
        currencySymbol="$"
      />
      <p className="mt-3 border-t border-black/10 pt-2 text-[10px] text-black/40">
        Preview only — values entered above are not saved.
      </p>
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
  onDuplicate,
}: {
  template: Template;
  onOpen: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const fieldCount = template.fields?.length ?? 0;
  const mappingCount =
    template._count?.mappings ?? template.mappings?.length ?? 0;
  const active = template.active !== false;

  // Lazy-fetch product usage count for the badge.
  const [productCount, setProductCount] = React.useState<number | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    const fetchUsage = async () => {
      try {
        const res = await fetch(`/api/admin/templates/${template.id}/usage`);
        if (!res.ok) return;
        const d = await res.json();
        if (!cancelled) {
          setProductCount(
            typeof d.productCount === "number" ? d.productCount : null
          );
        }
      } catch {
        /* non-fatal */
      }
    };
    fetchUsage();
    return () => {
      cancelled = true;
    };
  }, [template.id]);

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
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded-md border border-black/15 p-1.5 text-black/60 hover:bg-black/5"
            title="Duplicate template"
          >
            <Copy className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
            title="Delete template"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-[12px] text-black/55">
        {template.description || (
          <span className="italic text-black/30">No description</span>
        )}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {ecosystemBadge(template.ecosystem)}
        {template.isGlobal && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: PURPLE_TINT, color: PURPLE }}
          >
            <Globe className="size-2.5" /> Global
          </span>
        )}
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
        {typeof template.version === "number" && template.version > 1 && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: "#EEEDFE", color: "#5B21B6" }}
          >
            <GitBranch className="size-2.5" /> v{template.version}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium text-black/55">
          <LayoutTemplate className="size-2.5" /> {fieldCount} fields
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] font-medium text-black/55">
          <Link2 className="size-2.5" /> {mappingCount} mapping
          {mappingCount === 1 ? "" : "s"}
        </span>
        {productCount !== null && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: CORAL_TINT, color: CORAL }}
            title="Products using this template"
          >
            <TrendingUp className="size-2.5" /> {productCount} product
            {productCount === 1 ? "" : "s"}
          </span>
        )}
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

  // v2: import/export + safe-delete state
  const [exporting, setExporting] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [safeDelete, setSafeDelete] = React.useState<{
    template: Template;
    check: SafeDeleteCheck;
  } | null>(null);

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

  // ── Delete template (v2: safe-delete check first) ─────────────────────
  const handleDeleteTemplate = async (template: Template) => {
    // First, call the safe-delete-check endpoint.
    try {
      const res = await fetch(
        `/api/admin/templates/${template.id}/safe-delete-check`
      );
      if (res.ok) {
        const check: SafeDeleteCheck = await res.json();
        if (check && check.canDelete === false) {
          // Block deletion — show the safe-delete dialog with reasons.
          setSafeDelete({ template, check });
          return;
        }
      }
      // If check passed (or endpoint missing), fall through to confirm flow.
    } catch {
      /* non-fatal — fall through to standard confirm */
    }

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

  // ── v2: Confirm safe-delete (force through dialog) ───────────────────
  const handleConfirmSafeDelete = async () => {
    if (!safeDelete) return;
    const { template } = safeDelete;
    try {
      const res = await fetch(`/api/admin/templates/${template.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      toast.success("Template deleted");
      setSafeDelete(null);
      fetchTemplates();
      fetchMappings();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete template");
    }
  };

  // ── v2: Duplicate template ───────────────────────────────────────────
  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const res = await fetch(
        `/api/admin/templates/${template.id}/duplicate`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Duplicate failed (${res.status})`);
      }
      toast.success("Template duplicated");
      await fetchTemplates();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to duplicate template"
      );
    }
  };

  // ── v2: Export all templates as JSON download ────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/templates/export");
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `templates-export-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Templates exported");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to export templates");
    } finally {
      setExporting(false);
    }
  };

  // ── v2: Import templates from JSON file ──────────────────────────────
  const handleImportFile = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON file");
      }
      const body =
        parsed && typeof parsed === "object" && "templates" in parsed
          ? parsed
          : { templates: parsed };
      const res = await fetch("/api/admin/templates/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Import failed (${res.status})`);
      }
      const d = await res.json();
      const imported = d.imported ?? d.templates?.length ?? 0;
      const updated = d.updated ?? 0;
      const mapCount = d.mappings ?? 0;
      toast.success(
        `Import complete — ${imported} imported, ${updated} updated, ${mapCount} mappings`
      );
      fetchTemplates();
      fetchMappings();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to import templates");
    } finally {
      setImporting(false);
      // reset input so the same file can be re-picked
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── v2: Open the editor on a template by id (after duplicate) ────────
  const handleOpenDuplicate = React.useCallback(
    (id: string) => {
      const t = templates.find((x) => x.id === id);
      if (t) setSelectedTemplate(t);
    },
    [templates]
  );

  // Global-shared template (created by /seed).
  const globalTemplate = React.useMemo(
    () =>
      templates.find(
        (t) => t.isGlobal === true || t.slug === "global-shared"
      ) ?? null,
    [templates]
  );

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
        onOpenDuplicate={handleOpenDuplicate}
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
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg border border-black/15 bg-white px-3 py-2 text-[13px] font-semibold hover:bg-black/5 disabled:opacity-50"
            title="Export all templates as JSON"
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Export
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-lg border border-black/15 bg-white px-3 py-2 text-[13px] font-semibold hover:bg-black/5 disabled:opacity-50"
            title="Import templates from JSON"
          >
            {importing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
            }}
          />
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
          <TabsTrigger value="global">
            <Globe className="size-3.5" /> Global Fields
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
                  onDuplicate={() => handleDuplicateTemplate(t)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Global Fields Tab (v2) ─────────────────────────────────── */}
        <TabsContent value="global">
          <div
            className="mb-4 flex items-start gap-3 rounded-xl border px-4 py-3"
            style={{
              background: PURPLE_TINT,
              borderColor: PURPLE,
              color: "#3B2A6B",
            }}
          >
            <Globe className="mt-0.5 size-5 shrink-0" style={{ color: PURPLE }} />
            <div>
              <p className="text-[13px] font-semibold">
                Global Fields are inherited by ALL templates automatically.
              </p>
              <p className="mt-0.5 text-[12px]" style={{ color: "#5B4A8B" }}>
                Edit once here and the changes propagate to every listing
                template in the marketplace. Use this for shared fields like
                tags, SEO metadata, or vendor contact info.
              </p>
            </div>
          </div>

          {globalTemplate ? (
            <TemplateCard
              template={globalTemplate}
              onOpen={() => setSelectedTemplate(globalTemplate)}
              onDelete={() => handleDeleteTemplate(globalTemplate)}
              onDuplicate={() => handleDuplicateTemplate(globalTemplate)}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-black/15 bg-white py-16 text-center">
              <Globe
                className="mx-auto size-10"
                style={{ color: MUTED_LIGHT }}
              />
              <p className="mt-3 text-[15px] font-medium">
                No global template yet
              </p>
              <p className="mt-1 text-[13px]" style={{ color: MUTED_LIGHT }}>
                Click <strong>Seed Templates</strong> above to create the
                &quot;global-shared&quot; template.
              </p>
              <button
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
                style={{ background: CORAL }}
              >
                {seeding ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Database className="size-4" />
                )}
                Seed Global Fields
              </button>
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

      {/* Safe-delete dialog (v2) */}
      <Dialog
        open={!!safeDelete}
        onOpenChange={(v) => {
          if (!v) setSafeDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5">
              <AlertTriangle
                className="size-4"
                style={{ color: RED_TEXT }}
              />
              Cannot delete template
            </DialogTitle>
            <DialogDescription>
              &quot;{safeDelete?.template.name}&quot; is in use and cannot be
              deleted safely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {safeDelete?.check.warning && (
              <div
                className="rounded-lg border p-3 text-[12px]"
                style={{
                  background: RED_BG,
                  borderColor: "#F5C6CB",
                  color: RED_TEXT,
                }}
              >
                {safeDelete.check.warning}
              </div>
            )}
            {safeDelete?.check.blockReasons &&
              safeDelete.check.blockReasons.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-[12px] text-black/70">
                  {safeDelete.check.blockReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-black/10 bg-[#FBFAF6] px-3 py-2 text-center">
                <p
                  className="text-[18px] font-bold"
                  style={{ color: CORAL }}
                >
                  {safeDelete?.check.productCount ?? 0}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-black/50">
                  Products
                </p>
              </div>
              <div className="rounded-lg border border-black/10 bg-[#FBFAF6] px-3 py-2 text-center">
                <p
                  className="text-[18px] font-bold"
                  style={{ color: CORAL }}
                >
                  {safeDelete?.check.mappingCount ?? 0}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-black/50">
                  Mappings
                </p>
              </div>
            </div>
            <p className="text-[11px] text-black/45">
              Reassign or remove the dependent items first, or use the force
              option below to delete anyway (may break listings).
            </p>
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setSafeDelete(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-4 py-2 text-[13px] font-medium hover:bg-black/5"
            >
              <X className="size-4" /> Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSafeDelete}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold text-white"
              style={{ background: "#B91C1C" }}
            >
              <Trash2 className="size-4" /> Force delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
