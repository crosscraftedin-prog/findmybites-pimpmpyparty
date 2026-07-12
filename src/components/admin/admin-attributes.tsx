"use client";

/**
 * Admin Global Attribute Manager
 * ─────────────────────────────────────────────────────────────────────────
 * Lists, creates, edits, deletes, toggles, and reorders canonical attributes
 * grouped by their `group` field. All operations go through the admin API:
 *   GET    /api/admin/attributes
 *   POST   /api/admin/attributes                 (create)
 *   POST   /api/admin/attributes?action=seed     (re-seed canonical set)
 *   PUT    /api/admin/attributes/[id]            (partial update / toggle / reorder)
 *   DELETE /api/admin/attributes/[id]            (cascades to join tables)
 */

import * as React from "react";
import {
  Plus,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Loader2,
  CheckCircle2,
  Search,
  Tag,
  // Curated icon set used by seeded attributes (keeps bundle small):
  Candy,
  Wheat,
  Flame,
  Leaf,
  Egg,
  MilkOff,
  Nut,
  Sprout,
  HeartPulse,
  Dumbbell,
  ShieldCheck,
  Palette,
  Truck,
  Moon,
  Store,
  Home,
  Building2,
  Package,
  Gift,
  Star,
  Crown,
  Hand,
  Sunrise,
  ChefHat,
  Calendar,
  BadgeCheck,
  Receipt,
  Building,
  Users,
  Trees,
  Plane,
  Wallet,
  Baby,
  Music,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

interface AttributeDTO {
  id: string;
  slug: string;
  name: string;
  group: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  sortOrder: number;
  active: boolean;
  ecosystem: string;
}

interface GroupMeta {
  key: string;
  label: string;
  description: string;
}

const ATTRIBUTE_GROUPS: GroupMeta[] = [
  { key: "dietary", label: "Dietary", description: "Dietary preferences & restrictions" },
  { key: "service", label: "Service", description: "Delivery & service capabilities" },
  { key: "product_feature", label: "Product Features", description: "Product marketing badges" },
  { key: "business", label: "Business Features", description: "Vendor credentials & business type" },
];

const ECOSYSTEMS = ["FINDMYBITES", "PIMPMYPARTY", "BOTH"] as const;
type Ecosystem = (typeof ECOSYSTEMS)[number];

// ── Icon map (curated; falls back to Tag for unknown names) ─────────────────

type LucideIcon = React.ComponentType<{ className?: string }>;

const ICON_MAP: Record<string, LucideIcon> = {
  Candy,
  Wheat,
  Flame,
  Leaf,
  Egg,
  MilkOff,
  Nut,
  Sprout,
  CheckCircle2,
  HeartPulse,
  Dumbbell,
  ShieldCheck,
  Palette,
  Truck,
  Moon,
  Store,
  Home,
  Building2,
  Package,
  Gift,
  Star,
  Crown,
  Hand,
  Sunrise,
  ChefHat,
  Calendar,
  Sparkles,
  BadgeCheck,
  Receipt,
  Building,
  Users,
  Trees,
  Plane,
  Wallet,
  Baby,
  Music,
  Camera,
};

function IconFor({ name, className }: { name: string | null; className?: string }) {
  const Comp = (name && ICON_MAP[name]) || Tag;
  return <Comp className={className} />;
}

// ── Color swatch map ───────────────────────────────────────────────────────
// Data-driven: reflects the stored `color` token. NOT used for primary actions.

const COLOR_MAP: Record<string, string> = {
  emerald: "bg-emerald-500",
  green: "bg-green-500",
  lime: "bg-lime-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  yellow: "bg-yellow-500",
  orange: "bg-orange-500",
  rose: "bg-rose-500",
  pink: "bg-pink-500",
  fuchsia: "bg-fuchsia-500",
  violet: "bg-violet-500",
  indigo: "bg-indigo-500",
  blue: "bg-blue-500",
  sky: "bg-sky-500",
  slate: "bg-slate-500",
  zinc: "bg-zinc-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
  cyan: "bg-cyan-500",
};

function swatchClass(color: string | null): string {
  if (!color) return "bg-muted-foreground/40";
  return COLOR_MAP[color] ?? "bg-muted-foreground/40";
}

// ── Ecosystem badge colors (brand-aligned, NOT indigo/blue) ────────────────

function ecosystemBadgeClass(eco: string): string {
  switch (eco) {
    case "FINDMYBITES":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
    case "PIMPMYPARTY":
      return "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-300";
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

// ── Slug helper ────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Form state ─────────────────────────────────────────────────────────────

interface FormState {
  slug: string;
  name: string;
  group: string;
  icon: string;
  color: string;
  description: string;
  ecosystem: Ecosystem;
}

const EMPTY_FORM: FormState = {
  slug: "",
  name: "",
  group: "dietary",
  icon: "",
  color: "emerald",
  description: "",
  ecosystem: "BOTH",
};

// ── Component ──────────────────────────────────────────────────────────────

export function AdminAttributes() {
  const [attributes, setAttributes] = React.useState<AttributeDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [groupFilter, setGroupFilter] = React.useState<string>("all");

  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<AttributeDTO | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [seeding, setSeeding] = React.useState(false);
  const [reorderingId, setReorderingId] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<AttributeDTO | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // ── Load ────────────────────────────────────────────────────────────────
  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/attributes");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setAttributes(Array.isArray(data.attributes) ? data.attributes : []);
    } catch {
      setAttributes([]);
      toast.error("Failed to load attributes");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // ── Derived grouped list ────────────────────────────────────────────────
  const grouped = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = attributes.filter((a) => {
      if (groupFilter !== "all" && a.group !== groupFilter) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q) ||
        (a.icon ?? "").toLowerCase().includes(q)
      );
    });

    return ATTRIBUTE_GROUPS.map((meta) => ({
      meta,
      items: filtered
        .filter((a) => a.group === meta.key)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    })).filter((g) => g.items.length > 0);
  }, [attributes, search, groupFilter]);

  const stats = React.useMemo(
    () => ({
      total: attributes.length,
      active: attributes.filter((a) => a.active).length,
      disabled: attributes.filter((a) => !a.active).length,
    }),
    [attributes],
  );

  // ── Form helpers ────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setShowForm(true);
  };

  const openEdit = (a: AttributeDTO) => {
    setEditing(a);
    setForm({
      slug: a.slug,
      name: a.name,
      group: a.group,
      icon: a.icon ?? "",
      color: a.color ?? "",
      description: a.description ?? "",
      ecosystem: (ECOSYSTEMS as readonly string[]).includes(a.ecosystem)
        ? (a.ecosystem as Ecosystem)
        : "BOTH",
    });
    setSlugTouched(true); // don't auto-overwrite an existing slug
    setShowForm(true);
  };

  const onNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: slugTouched ? f.slug : slugify(name),
    }));
  };

  const onSlugChange = (slug: string) => {
    setSlugTouched(true);
    setForm((f) => ({ ...f, slug: slugify(slug) }));
  };

  // ── Save (create or update) ─────────────────────────────────────────────
  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (!form.group) {
      toast.error("Group is required");
      return;
    }

    setSaving(true);
    try {
      const body = {
        slug: form.slug,
        name: form.name,
        group: form.group,
        icon: form.icon.trim() || null,
        color: form.color.trim() || null,
        description: form.description.trim() || null,
        ecosystem: form.ecosystem,
      };

      const url = editing
        ? `/api/admin/attributes/${editing.id}`
        : "/api/admin/attributes";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        toast.error(e.error || "Failed to save attribute");
        return;
      }

      toast.success(editing ? "Attribute updated" : "Attribute created");
      setShowForm(false);
      setEditing(null);
      load();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/attributes/${pendingDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        toast.error(e.error || "Failed to delete");
        return;
      }
      toast.success(`Deleted "${pendingDelete.name}"`);
      setAttributes((prev) =>
        prev.filter((a) => a.id !== pendingDelete.id),
      );
      setPendingDelete(null);
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  // ── Toggle active (optimistic) ──────────────────────────────────────────
  const toggleActive = async (a: AttributeDTO) => {
    const next = !a.active;
    setAttributes((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, active: next } : x)),
    );
    try {
      const res = await fetch(`/api/admin/attributes/${a.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      });
      if (!res.ok) throw new Error("toggle failed");
      toast.success(`${a.name} ${next ? "enabled" : "disabled"}`);
    } catch {
      // Rollback
      setAttributes((prev) =>
        prev.map((x) => (x.id === a.id ? { ...x, active: a.active } : x)),
      );
      toast.error("Failed to toggle");
    }
  };

  // ── Reorder within group (swap with neighbor) ───────────────────────────
  const move = async (a: AttributeDTO, dir: "up" | "down") => {
    const groupItems = attributes
      .filter((x) => x.group === a.group)
      .sort((x, y) => x.sortOrder - y.sortOrder);
    const idx = groupItems.findIndex((x) => x.id === a.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= groupItems.length) return;
    const other = groupItems[swapIdx];

    setReorderingId(a.id);
    const aOrder = a.sortOrder;
    const oOrder = other.sortOrder;

    // Optimistic swap
    setAttributes((prev) =>
      prev.map((x) => {
        if (x.id === a.id) return { ...x, sortOrder: oOrder };
        if (x.id === other.id) return { ...x, sortOrder: aOrder };
        return x;
      }),
    );

    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/admin/attributes/${a.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: oOrder }),
        }),
        fetch(`/api/admin/attributes/${other.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: aOrder }),
        }),
      ]);
      if (!r1.ok || !r2.ok) throw new Error("reorder failed");
      toast.success("Order updated");
    } catch {
      toast.error("Failed to reorder");
      load();
    } finally {
      setReorderingId(null);
    }
  };

  // ── Seed canonical ──────────────────────────────────────────────────────
  const seed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/attributes?action=seed", {
        method: "POST",
      });
      if (!res.ok) throw new Error("seed failed");
      const data = await res.json();
      toast.success(
        `Seed complete: ${data.created ?? 0} created, ${data.updated ?? 0} updated (${data.total ?? 0} total)`,
      );
      load();
    } catch {
      toast.error("Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Global Attribute Manager
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage canonical attributes shared across vendors &amp; products. Attributes power filters, badges, and search.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={seed}
            disabled={seeding || loading}
          >
            {seeding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Seed Canonical
          </Button>
          <Button
            size="sm"
            onClick={openCreate}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="size-4" />
            Add Attribute
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Active" value={stats.active} accent="emerald" />
        <StatCard label="Disabled" value={stats.disabled} accent="amber" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, slug, description, or icon…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search attributes"
          />
        </div>
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filter by group">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            {ATTRIBUTE_GROUPS.map((g) => (
              <SelectItem key={g.key} value={g.key}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grouped lists */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Tag className="mx-auto size-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-foreground">No attributes found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try clearing filters, or click &ldquo;Seed Canonical&rdquo; to load defaults.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ meta, items }) => (
            <section
              key={meta.key}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              {/* Group header */}
              <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 p-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{meta.label}</h3>
                  <p className="truncate text-xs text-muted-foreground">{meta.description}</p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {items.length}
                </Badge>
              </header>

              {/* Items (scrollable) */}
              <div className="custom-scrollbar max-h-96 divide-y divide-border overflow-y-auto">
                {items.map((a, i) => (
                  <div
                    key={a.id}
                    className={cn(
                      "flex flex-col gap-3 p-4 transition-colors hover:bg-accent/30 sm:flex-row sm:items-center sm:gap-4",
                      !a.active && "opacity-60",
                    )}
                  >
                    {/* Left: swatch + icon + name/slug/desc (click to edit) */}
                    <button
                      type="button"
                      onClick={() => openEdit(a)}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      title="Click to edit"
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg text-white",
                          swatchClass(a.color),
                        )}
                      >
                        <IconFor name={a.icon} className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {a.name}
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {a.slug}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "border-0 text-[9px] uppercase tracking-wide",
                              ecosystemBadgeClass(a.ecosystem),
                            )}
                          >
                            {a.ecosystem}
                          </Badge>
                          {!a.active && (
                            <Badge
                              variant="outline"
                              className="border-0 bg-amber-50 text-[9px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            >
                              Inactive
                            </Badge>
                          )}
                        </div>
                        {a.description ? (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {a.description}
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                          icon: <span className="font-mono">{a.icon ?? "—"}</span>
                          {" · "}color: <span className="font-mono">{a.color ?? "—"}</span>
                          {" · "}order: {a.sortOrder}
                        </p>
                      </div>
                    </button>

                    {/* Right: controls */}
                    <div className="flex items-center gap-1 sm:shrink-0">
                      <button
                        type="button"
                        onClick={() => move(a, "up")}
                        disabled={i === 0 || reorderingId === a.id}
                        className="grid size-8 place-items-center rounded-md hover:bg-accent disabled:pointer-events-none disabled:opacity-30"
                        title="Move up"
                        aria-label={`Move ${a.name} up`}
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(a, "down")}
                        disabled={i === items.length - 1 || reorderingId === a.id}
                        className="grid size-8 place-items-center rounded-md hover:bg-accent disabled:pointer-events-none disabled:opacity-30"
                        title="Move down"
                        aria-label={`Move ${a.name} down`}
                      >
                        <ArrowDown className="size-3.5" />
                      </button>

                      <div className="mx-1 flex items-center gap-1.5">
                        <Switch
                          checked={a.active}
                          onCheckedChange={() => toggleActive(a)}
                          aria-label={`Toggle ${a.name} active`}
                        />
                        <span className="hidden text-[10px] text-muted-foreground sm:inline">
                          {a.active ? "On" : "Off"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => openEdit(a)}
                        className="grid size-8 place-items-center rounded-md hover:bg-accent"
                        title="Edit"
                        aria-label={`Edit ${a.name}`}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(a)}
                        className="grid size-8 place-items-center rounded-md text-destructive hover:bg-destructive/10"
                        title="Delete"
                        aria-label={`Delete ${a.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(o) => {
          setShowForm(o);
          if (!o) setEditing(null);
        }}
      >
        <DialogContent className="custom-scrollbar max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Attribute" : "Add Attribute"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the attribute details. Changes apply wherever this attribute is used."
                : "Create a new global attribute. It will be available to vendors & products immediately."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="attr-name">Name *</Label>
              <Input
                id="attr-name"
                value={form.name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="e.g. Sugar Free"
              />
            </div>

            {/* Slug + Group */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="attr-slug">Slug *</Label>
                <Input
                  id="attr-slug"
                  value={form.slug}
                  onChange={(e) => onSlugChange(e.target.value)}
                  placeholder="sugar-free"
                  className="font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  Auto-generated from name if left empty.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Group *</Label>
                <Select
                  value={form.group}
                  onValueChange={(v) => setForm((f) => ({ ...f, group: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTRIBUTE_GROUPS.map((g) => (
                      <SelectItem key={g.key} value={g.key}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Icon + Color + Ecosystem */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="attr-icon">Icon</Label>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-lg text-white",
                      swatchClass(form.color || null),
                    )}
                  >
                    <IconFor name={form.icon || null} className="size-4" />
                  </span>
                  <Input
                    id="attr-icon"
                    value={form.icon}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, icon: e.target.value }))
                    }
                    placeholder="Leaf"
                    className="font-mono text-sm"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Lucide icon name.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="attr-color">Color</Label>
                <Input
                  id="attr-color"
                  value={form.color}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, color: e.target.value }))
                  }
                  placeholder="emerald"
                  className="font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  Tailwind color token.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Ecosystem</Label>
                <Select
                  value={form.ecosystem}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, ecosystem: v as Ecosystem }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOTH">Both</SelectItem>
                    <SelectItem value="FINDMYBITES">FindMyBites</SelectItem>
                    <SelectItem value="PIMPMYPARTY">PimpMyParty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="attr-desc">Description</Label>
              <Textarea
                id="attr-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Short description shown to vendors & customers."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={saving}
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {editing ? "Save Changes" : "Create Attribute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => {
          if (!o) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attribute?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">
                {pendingDelete?.name}
              </span>{" "}
              (
              <span className="font-mono text-xs">{pendingDelete?.slug}</span>) and
              remove it from all vendors &amp; products it&apos;s assigned to. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── StatCard helper ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "emerald" | "amber";
}) {
  const valueColor =
    accent === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <div className={cn("text-2xl font-bold", valueColor)}>{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

export default AdminAttributes;
