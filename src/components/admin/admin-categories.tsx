"use client";

import * as React from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Tag as TagIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Brand colors (matching the admin panel) ────────────────────────────────
const CORAL = "#D85A30";
const CORAL_TINT = "#FAECE7";
const CORAL_DARK = "#993C1D";
const CORAL_BORDER = "#F0997B";
const PURPLE = "#7F77DD";
const PURPLE_TINT = "#EEEDFE";
const PURPLE_DARK = "#534AB7";
const PURPLE_BORDER = "#AFA9EC";
const GREEN_BG = "#EAF3DE";
const GREEN_TEXT = "#27500A";
const PENDING_BG = "#FAEEDA";
const PENDING_TEXT = "#633806";
const SURFACE = "#F1EFE8";
const BORDER_COLOR = "rgba(0,0,0,0.12)";
const MUTED = "rgba(0,0,0,0.5)";
const MUTED_LIGHT = "rgba(0,0,0,0.4)";

// ── Types ──────────────────────────────────────────────────────────────────
interface Subcategory {
  id: string;
  slug?: string;
  label: string;
  categoryId: string;
  active: boolean;
}

interface Category {
  id: string;
  slug?: string;
  label: string;
  ecosystem: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  active: boolean;
  subcategories: Subcategory[];
}

interface AdminCategoriesSectionProps {
  ecosystem: "FINDMYBITES" | "PIMPMYPARTY";
}

// ── Small UI atoms ─────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-black/5", className)} />;
}

function ActiveBadge({
  active,
  onClick,
  disabled,
}: {
  active: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const bg = active ? GREEN_BG : PENDING_BG;
  const color = active ? GREEN_TEXT : PENDING_TEXT;
  const label = active ? "Active" : "Inactive";
  if (!onClick) {
    return (
      <span
        className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
        style={{ background: bg, color }}
      >
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
      style={{ background: bg, color }}
      title={`Click to set ${active ? "inactive" : "active"}`}
    >
      {label}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function AdminCategoriesSection({ ecosystem }: AdminCategoriesSectionProps) {
  const isFood = ecosystem === "FINDMYBITES";
  const brandColor = isFood ? CORAL : PURPLE;
  const brandTint = isFood ? CORAL_TINT : PURPLE_TINT;
  const brandDark = isFood ? CORAL_DARK : PURPLE_DARK;
  const brandBorder = isFood ? CORAL_BORDER : PURPLE_BORDER;
  const title = isFood ? "FindMyBites Categories" : "PimpMyParty Categories";
  const subtitle = isFood
    ? "Manage food vendor categories and subcategories"
    : "Manage party vendor categories and subcategories";

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Add category form state
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [addLabel, setAddLabel] = React.useState("");
  const [addDescription, setAddDescription] = React.useState("");
  const [addLoading, setAddLoading] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);

  // Edit category state (one open at a time)
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editLabel, setEditLabel] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editActive, setEditActive] = React.useState(true);
  const [editLoading, setEditLoading] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  // Per-row action loading (toggles, deletes)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  // Inline add-subcategory state (one open at a time)
  const [addSubForCat, setAddSubForCat] = React.useState<string | null>(null);
  const [addSubLabel, setAddSubLabel] = React.useState("");
  const [addSubLoading, setAddSubLoading] = React.useState(false);
  const [addSubError, setAddSubError] = React.useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchCategories = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories?ecosystem=${ecosystem}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as { categories?: Category[] };
      setCategories(data.categories ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load categories"
      );
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [ecosystem]);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ── Mutations ────────────────────────────────────────────────────────────
  const handleAddCategory = async () => {
    const label = addLabel.trim();
    if (!label) {
      setAddError("Label is required");
      return;
    }
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          ecosystem,
          description: addDescription.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed (${res.status})`);
      }
      setAddLabel("");
      setAddDescription("");
      setShowAddForm(false);
      await fetchCategories();
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Failed to create category"
      );
    } finally {
      setAddLoading(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditLabel(cat.label);
    setEditDescription(cat.description ?? "");
    setEditActive(cat.active);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditLabel("");
    setEditDescription("");
    setEditActive(true);
    setEditError(null);
  };

  const saveEdit = async (cat: Category) => {
    const label = editLabel.trim();
    if (!label) {
      setEditError("Label is required");
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          description: editDescription.trim() || null,
          active: editActive,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed (${res.status})`);
      }
      cancelEdit();
      await fetchCategories();
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Failed to update category"
      );
    } finally {
      setEditLoading(false);
    }
  };

  const toggleCategoryActive = async (cat: Category) => {
    setActionLoading(cat.id);
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !cat.active }),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      await fetchCategories();
    } catch (err) {
      console.error("Toggle category failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteCategory = async (cat: Category) => {
    const ok = window.confirm(
      `Delete "${cat.label}"?\nThis will also remove its ${cat.subcategories.length} subcategor${cat.subcategories.length === 1 ? "y" : "ies"}. This action cannot be undone.`
    );
    if (!ok) return;
    setActionLoading(cat.id);
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      if (editId === cat.id) cancelEdit();
      await fetchCategories();
    } catch (err) {
      console.error("Delete category failed:", err);
      window.alert("Failed to delete category. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const startAddSub = (catId: string) => {
    setAddSubForCat(catId);
    setAddSubLabel("");
    setAddSubError(null);
  };

  const cancelAddSub = () => {
    setAddSubForCat(null);
    setAddSubLabel("");
    setAddSubError(null);
  };

  const submitAddSub = async (cat: Category) => {
    const label = addSubLabel.trim();
    if (!label) {
      setAddSubError("Label is required");
      return;
    }
    setAddSubLoading(true);
    setAddSubError(null);
    try {
      const res = await fetch(
        `/api/admin/categories/${cat.id}/subcategories`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed (${res.status})`);
      }
      cancelAddSub();
      await fetchCategories();
    } catch (err) {
      setAddSubError(
        err instanceof Error ? err.message : "Failed to add subcategory"
      );
    } finally {
      setAddSubLoading(false);
    }
  };

  const toggleSubcategoryActive = async (
    cat: Category,
    sub: Subcategory
  ) => {
    setActionLoading(`${cat.id}:${sub.id}`);
    try {
      const res = await fetch(
        `/api/admin/categories/${cat.id}/subcategories/${sub.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !sub.active }),
        }
      );
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      await fetchCategories();
    } catch (err) {
      console.error("Toggle subcategory failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteSubcategory = async (cat: Category, sub: Subcategory) => {
    const ok = window.confirm(
      `Delete subcategory "${sub.label}" from "${cat.label}"?`
    );
    if (!ok) return;
    setActionLoading(`${cat.id}:${sub.id}`);
    try {
      const res = await fetch(
        `/api/admin/categories/${cat.id}/subcategories/${sub.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      await fetchCategories();
    } catch (err) {
      console.error("Delete subcategory failed:", err);
      window.alert("Failed to delete subcategory. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const activeCount = categories.filter((c) => c.active).length;
  const totalSubs = categories.reduce(
    (sum, c) => sum + (c.subcategories?.length ?? 0),
    0
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4"
        style={{ border: `0.5px solid ${BORDER_COLOR}` }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="grid size-7 shrink-0 place-items-center rounded-lg"
              style={{ background: brandTint, color: brandDark }}
            >
              <TagIcon className="size-3.5" />
            </span>
            <h2 className="text-[14px] font-medium">{title}</h2>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: brandTint, color: brandDark }}
            >
              {categories.length} {categories.length === 1 ? "category" : "categories"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-black/50">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAddForm((s) => !s);
            setAddError(null);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: brandColor }}
        >
          <Plus className="size-3.5" />
          Add Category
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg p-3.5" style={{ background: SURFACE }}>
          <p className="mb-1.5 text-[11px] text-black/50">Total categories</p>
          <p className="text-[22px] font-medium tracking-tight">
            {loading ? "—" : categories.length}
          </p>
        </div>
        <div className="rounded-lg p-3.5" style={{ background: SURFACE }}>
          <p className="mb-1.5 text-[11px] text-black/50">Active</p>
          <p className="text-[22px] font-medium tracking-tight">
            {loading ? "—" : activeCount}
          </p>
        </div>
        <div className="rounded-lg p-3.5" style={{ background: SURFACE }}>
          <p className="mb-1.5 text-[11px] text-black/50">Subcategories</p>
          <p className="text-[22px] font-medium tracking-tight">
            {loading ? "—" : totalSubs}
          </p>
        </div>
      </div>

      {/* Add category inline form */}
      {showAddForm && (
        <div
          className="rounded-xl bg-white p-4"
          style={{ border: `0.5px solid ${brandBorder}` }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-medium" style={{ color: brandDark }}>
              New category
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setAddLabel("");
                setAddDescription("");
                setAddError(null);
              }}
              className="grid size-7 place-items-center rounded-lg text-black/40 hover:bg-black/5"
              aria-label="Cancel"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-black/40">
                Label
              </label>
              <input
                type="text"
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder="e.g. Cakes, Decorators"
                autoFocus
                className="h-9 w-full rounded-lg border px-3 text-[12px] outline-none focus:border-black/40"
                style={{ borderColor: BORDER_COLOR }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-black/40">
                Description (optional)
              </label>
              <input
                type="text"
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
                placeholder="Short description"
                className="h-9 w-full rounded-lg border px-3 text-[12px] outline-none focus:border-black/40"
                style={{ borderColor: BORDER_COLOR }}
              />
            </div>
          </div>
          {addError && (
            <p className="mt-2 text-[11px]" style={{ color: "#A32D2D" }}>
              {addError}
            </p>
          )}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setAddLabel("");
                setAddDescription("");
                setAddError(null);
              }}
              className="rounded-lg border px-3 py-1.5 text-[12px] font-medium text-black/60 hover:bg-black/5"
              style={{ borderColor: BORDER_COLOR }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={addLoading}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
              style={{ background: brandColor }}
            >
              {addLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              Create category
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-white p-4"
              style={{ border: `0.5px solid ${BORDER_COLOR}` }}
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="mt-3 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div
          className="flex flex-col items-center justify-center rounded-xl bg-white py-12 text-center"
          style={{ border: `0.5px solid ${BORDER_COLOR}` }}
        >
          <AlertCircle className="size-8" style={{ color: "#A32D2D" }} />
          <p className="mt-2 text-[13px] font-medium">Couldn&apos;t load categories</p>
          <p className="mt-1 text-[11px] text-black/50">{error}</p>
          <button
            type="button"
            onClick={fetchCategories}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium hover:bg-black/5"
            style={{ borderColor: BORDER_COLOR }}
          >
            <RefreshCw className="size-3.5" />
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && categories.length === 0 && (
        <div
          className="flex flex-col items-center justify-center rounded-xl bg-white py-12 text-center"
          style={{ border: `0.5px solid ${BORDER_COLOR}` }}
        >
          <span
            className="grid size-10 place-items-center rounded-lg"
            style={{ background: brandTint, color: brandDark }}
          >
            <TagIcon className="size-5" />
          </span>
          <p className="mt-3 text-[13px] font-medium">No categories yet</p>
          <p className="mt-1 text-[11px] text-black/50">
            Add your first {isFood ? "FindMyBites" : "PimpMyParty"} category to get started.
          </p>
          <button
            type="button"
            onClick={() => {
              setShowAddForm(true);
              setAddError(null);
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-white"
            style={{ background: brandColor }}
          >
            <Plus className="size-3.5" />
            Add Category
          </button>
        </div>
      )}

      {/* Category cards */}
      {!loading && !error && categories.length > 0 && (
        <div className="space-y-3">
          {categories.map((cat) => {
            const isEditing = editId === cat.id;
            const rowLoading = actionLoading === cat.id;
            return (
              <div
                key={cat.id}
                className="rounded-xl bg-white p-4"
                style={{ border: `0.5px solid ${BORDER_COLOR}` }}
              >
                {/* Card header */}
                {!isEditing && (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className="grid size-9 shrink-0 place-items-center rounded-lg text-[12px] font-medium"
                        style={{ background: brandTint, color: brandDark }}
                      >
                        {cat.label.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[13px] font-medium">{cat.label}</h3>
                          <ActiveBadge
                            active={cat.active}
                            onClick={() => toggleCategoryActive(cat)}
                            disabled={rowLoading}
                          />
                          {cat.subcategories.length > 0 && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{ background: SURFACE, color: MUTED }}
                            >
                              {cat.subcategories.length} subcategor{cat.subcategories.length === 1 ? "y" : "ies"}
                            </span>
                          )}
                        </div>
                        {cat.description ? (
                          <p className="mt-0.5 text-[12px] text-black/60">
                            {cat.description}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-[11px] italic text-black/30">
                            No description
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(cat)}
                        className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors hover:bg-black/5"
                        style={{ borderColor: BORDER_COLOR, color: MUTED }}
                      >
                        <Pencil className="size-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCategory(cat)}
                        disabled={rowLoading}
                        className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors hover:bg-red-50 disabled:opacity-50"
                        style={{ borderColor: "rgba(163,45,45,0.3)", color: "#A32D2D" }}
                      >
                        {rowLoading ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Trash2 className="size-3" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline edit form */}
                {isEditing && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3
                        className="text-[13px] font-medium"
                        style={{ color: brandDark }}
                      >
                        Edit category
                      </h3>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="grid size-7 place-items-center rounded-lg text-black/40 hover:bg-black/5"
                        aria-label="Cancel"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-black/40">
                          Label
                        </label>
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          autoFocus
                          className="h-9 w-full rounded-lg border px-3 text-[12px] outline-none focus:border-black/40"
                          style={{ borderColor: BORDER_COLOR }}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-black/40">
                          Description
                        </label>
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Short description"
                          className="h-9 w-full rounded-lg border px-3 text-[12px] outline-none focus:border-black/40"
                          style={{ borderColor: BORDER_COLOR }}
                        />
                      </div>
                    </div>
                    <label className="mt-3 flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editActive}
                        onChange={(e) => setEditActive(e.target.checked)}
                        className="size-3.5 accent-current"
                        style={{ accentColor: brandColor }}
                      />
                      <span className="text-[12px] text-black/70">
                        Active (visible to vendors and customers)
                      </span>
                    </label>
                    {editError && (
                      <p className="mt-2 text-[11px]" style={{ color: "#A32D2D" }}>
                        {editError}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg border px-3 py-1.5 text-[12px] font-medium text-black/60 hover:bg-black/5"
                        style={{ borderColor: BORDER_COLOR }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(cat)}
                        disabled={editLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
                        style={{ background: brandColor }}
                      >
                        {editLoading ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                        Save changes
                      </button>
                    </div>
                  </div>
                )}

                {/* Subcategories block (hide while editing) */}
                {!isEditing && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-black/40">
                        Subcategories
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          addSubForCat === cat.id
                            ? cancelAddSub()
                            : startAddSub(cat.id)
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-medium transition-colors hover:opacity-80"
                        style={{ color: brandDark }}
                      >
                        <Plus className="size-3" />
                        Add subcategory
                      </button>
                    </div>

                    {/* Inline add subcategory */}
                    {addSubForCat === cat.id && (
                      <div
                        className="mb-2 flex items-center gap-2 rounded-lg p-2"
                        style={{ background: brandTint }}
                      >
                        <input
                          type="text"
                          value={addSubLabel}
                          onChange={(e) => setAddSubLabel(e.target.value)}
                          placeholder="Subcategory name"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              submitAddSub(cat);
                            } else if (e.key === "Escape") {
                              cancelAddSub();
                            }
                          }}
                          className="h-8 flex-1 rounded-lg border bg-white px-2.5 text-[12px] outline-none focus:border-black/40"
                          style={{ borderColor: BORDER_COLOR }}
                        />
                        <button
                          type="button"
                          onClick={cancelAddSub}
                          className="grid size-8 place-items-center rounded-lg text-black/40 hover:bg-black/5"
                          aria-label="Cancel"
                        >
                          <X className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => submitAddSub(cat)}
                          disabled={addSubLoading}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white disabled:opacity-50"
                          style={{ background: brandColor }}
                        >
                          {addSubLoading ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Check className="size-3" />
                          )}
                          Add
                        </button>
                      </div>
                    )}
                    {addSubForCat === cat.id && addSubError && (
                      <p
                        className="mb-2 text-[11px]"
                        style={{ color: "#A32D2D" }}
                      >
                        {addSubError}
                      </p>
                    )}

                    {/* Subcategory list */}
                    {cat.subcategories.length === 0 ? (
                      <p className="rounded-lg py-3 text-center text-[11px] italic text-black/30">
                        No subcategories yet
                      </p>
                    ) : (
                      <div
                        className="overflow-hidden rounded-lg"
                        style={{
                          border: `0.5px solid ${BORDER_COLOR}`,
                          background: "#FAFAF8",
                        }}
                      >
                        {cat.subcategories.map((sub, idx) => {
                          const subLoading =
                            actionLoading === `${cat.id}:${sub.id}`;
                          return (
                            <div
                              key={sub.id}
                              className="flex items-center gap-2 px-3 py-2"
                              style={
                                idx > 0
                                  ? {
                                      borderTop: `0.5px solid ${BORDER_COLOR}`,
                                    }
                                  : undefined
                              }
                            >
                              <span
                                className="size-1.5 shrink-0 rounded-full"
                                style={{
                                  background: sub.active
                                    ? brandColor
                                    : "rgba(0,0,0,0.2)",
                                }}
                              />
                              <span
                                className={cn(
                                  "flex-1 truncate text-[12px]",
                                  !sub.active && "text-black/40 line-through"
                                )}
                              >
                                {sub.label}
                              </span>
                              <ActiveBadge
                                active={sub.active}
                                onClick={() =>
                                  toggleSubcategoryActive(cat, sub)
                                }
                                disabled={subLoading}
                              />
                              <button
                                type="button"
                                onClick={() => deleteSubcategory(cat, sub)}
                                disabled={subLoading}
                                className="grid size-6 place-items-center rounded-md text-black/30 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                aria-label={`Delete ${sub.label}`}
                                title="Delete subcategory"
                              >
                                {subLoading ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Trash2 className="size-3" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminCategoriesSection;
