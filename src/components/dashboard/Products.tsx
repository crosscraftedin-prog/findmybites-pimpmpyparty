"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, Package, Check, Loader2, Star, Search, Eye, Copy,
  EyeOff, Globe, TrendingUp, FileText, MoreVertical, X, ChevronDown,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Vendor, Product } from "@/lib/types";
import type { TemplateDef } from "@/lib/template-definitions";
import { TemplateForm } from "./TemplateForm";
import { ProductWizard } from "./product-wizard";
import { StatusBadge, StockPill } from "@/components/inventory/status-badge";
import { InventoryManager } from "@/components/inventory/inventory-manager";
import { InventoryDashboard } from "@/components/inventory/inventory-dashboard";

interface ProductsProps {
  vendor: Vendor;
}

const STANDARD_FIELDS = new Set([
  "name","description","packageType","price","comparePrice","currency","images",
  "isAvailable","productType","leadTime","capacity","duration","dietaryTags",
  "allergens","extraFields","templateSlug","templateVersion",
]);
const BOOLEAN_FIELDS = new Set([
  "eggless","vegetarian","vegan","halal","glutenFree","sugarFree","deliveryAvailable",
  "pickupAvailable","customOrder","sameDay","isFeatured","travelAvailable",
  "startingFromPrice","hidePrice","priceOnRequest","inStock","limitedTime",
  "customOrderOnly","featured",
]);
const ARRAY_FIELDS = new Set([
  "sizes","flavours","tags","includes","includedServices","optionalServices",
  "addOns","bulkDiscount","depositRequired","chauffeurIncluded","decorIncluded",
  "driverBata","fuelIncluded","giftWrapping",
]);

type SortOption = "newest" | "oldest" | "name" | "price_high" | "price_low" | "views";
type StatusFilter = "all" | "active" | "draft" | "out_of_stock" | "temporarily_unavailable" | "seasonal" | "archived";

export function Products({ vendor }: ProductsProps) {
  // ── Unified API: /api/vendor/products (ownership resolved from session, NOT frontend) ──
  const [allProducts, setAllProducts] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const reload = React.useCallback(() => setRefreshKey(k => k + 1), []);

  React.useEffect(() => {
    setIsLoading(true);
    fetch("/api/vendor/products?limit=100")
      .then(res => res.ok ? res.json() : { products: [], stats: null })
      .then(data => {
        setAllProducts(data.products ?? []);
        if (data.stats) setStatsData(data.stats);
      })
      .catch(() => setAllProducts([]))
      .finally(() => setIsLoading(false));
  }, [refreshKey]);

  // UI state
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [sortBy, setSortBy] = React.useState<SortOption>("newest");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = React.useState(false);
  const [statsData, setStatsData] = React.useState<any>(null);

  // Existing form state (preserved)
  const [showModal, setShowModal] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [template, setTemplate] = React.useState<TemplateDef | null>(null);
  // Inventory manager dialog
  const [inventoryProduct, setInventoryProduct] = React.useState<{ id: string; name: string } | null>(null);
  const [filterOptions, setFilterOptions] = React.useState<Record<string, string[]>>({});
  const [templateLoading, setTemplateLoading] = React.useState(true);
  const [form, setForm] = React.useState<Record<string, any>>({});

  const symbol = CURRENCY_SYMBOLS[vendor.currency] ?? vendor.currency ?? "$";
  const isFood = vendor.ecosystem === "FINDMYBITES";

  // ── Stats (prefer server-side, fallback to client-side) ──
  const stats = React.useMemo(() => {
    if (statsData) return statsData;
    const total = allProducts.length;
    const active = allProducts.filter(p => (p.status || "active") === "active").length;
    const draft = allProducts.filter(p => p.status === "draft").length;
    const outOfStock = allProducts.filter(p => p.status === "out_of_stock").length;
    const seasonal = allProducts.filter(p => p.status === "seasonal").length;
    const totalViews = allProducts.reduce((sum, p) => sum + (p.views ?? 0), 0);
    const featured = allProducts.filter(p => p.isFeatured || p.featured).length;
    return { total, active, draft, outOfStock, seasonal, totalViews, featured, totalEnquiries: 0 };
  }, [allProducts, statsData]);

  // ── Filtered + sorted products ──
  const filteredProducts = React.useMemo(() => {
    let result = [...allProducts];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.productType?.toLowerCase().includes(q) ||
        p.subCategory?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(p => (p.status || "active") === statusFilter);
    }

    // Sort
    switch (sortBy) {
      case "oldest": result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "price_high": result.sort((a, b) => b.price - a.price); break;
      case "price_low": result.sort((a, b) => a.price - b.price); break;
      case "views": result.sort((a, b) => (b.views ?? 0) - (a.views ?? 0)); break;
      default: result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [allProducts, search, statusFilter, sortBy]);

  // ── Template loading (preserved) ──
  React.useEffect(() => {
    if (!vendor.category) { setTemplateLoading(false); return; }
    setTemplateLoading(true);
    const params = new URLSearchParams({ category: vendor.category });
    if (vendor.subcategory) params.set("subcategory", vendor.subcategory);
    fetch(`/api/templates/resolve?${params.toString()}&t=${Date.now()}`)
      .then(r => r.json())
      .then(data => {
        if (data.template) { setTemplate(data.template); setFilterOptions(data.filterOptions || {}); }
        setTemplateLoading(false);
      })
      .catch(() => setTemplateLoading(false));
  }, [vendor.category, vendor.subcategory]);

  const buildEmptyForm = React.useCallback((): Record<string, any> => {
    const f: Record<string, any> = { name: "", description: "", packageType: "standard", price: "", comparePrice: "", currency: vendor.currency || "USD", images: [], isAvailable: true, productType: "" };
    if (!template) return f;
    for (const field of template.fields) {
      if (field.key in f) continue;
      if (BOOLEAN_FIELDS.has(field.key)) f[field.key] = false;
      else if (ARRAY_FIELDS.has(field.key) || field.type === "chips") f[field.key] = [];
      else if (field.type === "toggle" || field.type === "section_toggle") f[field.key] = false;
      else if (field.type === "toggle_group") f[field.key] = "";
      else if (field.type === "images") f[field.key] = [];
      else f[field.key] = "";
    }
    return f;
  }, [template, vendor.currency]);

  React.useEffect(() => { setForm(buildEmptyForm()); }, [buildEmptyForm]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const toggleArray = (key: string, value: string) => {
    const arr = Array.isArray(form[key]) ? form[key] : [];
    set(key, arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value]);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/vendor/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Product deleted");
      reload();
    } catch { toast.error("Failed to delete"); }
  };

  const handleDuplicate = async (p: any) => {
    try {
      const res = await fetch(`/api/vendor/products/${p.id}?action=duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to duplicate");
      toast.success("Product duplicated as draft");
      reload();
    } catch { toast.error("Failed to duplicate"); }
  };

  const handleToggleVisibility = async (p: any) => {
    const cur = p.status || "active";
    const newStatus = cur === "draft" ? "active" : "draft";
    try {
      const res = await fetch(`/api/vendor/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(newStatus === "draft" ? "Moved to draft" : "Product published");
      reload();
    } catch { toast.error("Failed to update"); }
  };

  const openAdd = () => { setEditingProduct(null); setForm(buildEmptyForm()); setShowModal(true); };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    const newForm = buildEmptyForm();
    newForm.name = p.name || ""; newForm.description = p.description || "";
    newForm.packageType = (p as any).packageType || "standard";
    newForm.price = String(p.price); newForm.comparePrice = (p as any).comparePrice ? String((p as any).comparePrice) : "";
    newForm.currency = (p as any).currency || vendor.currency || "USD";
    newForm.images = p.images || []; newForm.isAvailable = (p as any).isAvailable !== false;
    newForm.productType = (p as any).productType || p.productType || "";
    newForm.leadTime = (p as any).leadTime || ""; newForm.capacity = (p as any).capacity ? String((p as any).capacity) : "";
    newForm.duration = (p as any).duration || "";
    if ((p as any).dietaryTags) { try { newForm.dietaryTags = typeof (p as any).dietaryTags === "string" ? JSON.parse((p as any).dietaryTags) : (p as any).dietaryTags; } catch {} }
    if ((p as any).allergens) { try { newForm.allergens = typeof (p as any).allergens === "string" ? JSON.parse((p as any).allergens) : (p as any).allergens; } catch {} }
    if ((p as any).extraFields) { try { const extra = typeof (p as any).extraFields === "string" ? JSON.parse((p as any).extraFields) : (p as any).extraFields; Object.assign(newForm, extra); } catch {} }
    setForm(newForm); setShowModal(true);
  };

  const save = async () => {
    if (!form.name?.trim() || !form.price) { toast.error("Name and price are required"); return; }
    setSaving(true);
    try {
      const extraFieldsObj: Record<string, any> = {};
      for (const [key, value] of Object.entries(form)) { if (STANDARD_FIELDS.has(key)) continue; extraFieldsObj[key] = value; }
      const payload: any = { ...form, price: Number(form.price), comparePrice: form.comparePrice ? Number(form.comparePrice) : null, capacity: form.capacity ? Number(form.capacity) : null, dietaryTags: form.dietaryTags || [], allergens: form.allergens || [], extraFields: extraFieldsObj, templateSlug: template?.slug, templateVersion: template?.version ?? 1 };
      if (editingProduct) {
        const res = await fetch(`/api/vendor/products/${editingProduct.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Update failed");
        toast.success("Product updated!");
      } else {
        const res = await fetch("/api/vendor/products", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Create failed");
        toast.success("Product created!");
      }
      setShowModal(false); setForm(buildEmptyForm());
      reload();
    } catch (e: any) { toast.error(e.message || "Failed to save"); }
    setSaving(false);
  };

  // ── Bulk actions ──
  const toggleSelect = (id: string) => {
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) { next.delete(id); } else { next.add(id); } return next; });
  };
  const toggleSelectAll = () => {
    if (selected.size === filteredProducts.length) setSelected(new Set());
    else setSelected(new Set(filteredProducts.map(p => p.id)));
  };
  const bulkAction = async (action: string) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    for (const id of ids) {
      try {
        if (action === "delete") {
          await fetch(`/api/vendor/products/${id}`, { method: "DELETE" });
        } else if (action === "hide" || action === "publish") {
          await fetch(`/api/vendor/products/${id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: action === "hide" ? "archived" : "active" }),
          });
        }
      } catch {}
    }
    toast.success(`${ids.length} products ${action === "delete" ? "deleted" : action === "hide" ? "archived" : "published"}`);
    setSelected(new Set()); setShowBulkActions(false);
    reload();
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      {/* Inventory Dashboard widget */}
      {!isLoading && allProducts.length > 0 && (
        <div className="mb-6">
          <InventoryDashboard onManageProduct={(id, name) => setInventoryProduct({ id, name })} />
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{isFood ? "Your Products" : "Your Packages"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFood ? "Add the dishes you offer so customers know exactly what to order" : "Add the services you offer so customers know exactly what to book"}
          </p>
        </div>
        <Button onClick={openAdd} className="bg-brand text-brand-foreground hover:bg-brand/90">
          <Plus className="size-4" /> {isFood ? "Add Product" : "Add Package"}
        </Button>
      </div>

      {/* Stats Cards */}
      {!isLoading && allProducts.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {[
            { label: "Total", val: stats.total, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Active", val: stats.active, icon: Check, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Draft", val: stats.draft, icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Out of Stock", val: (stats as any).outOfStock ?? 0, icon: X, color: "text-red-600", bg: "bg-red-50" },
            { label: "Seasonal", val: (stats as any).seasonal ?? 0, icon: Star, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Views", val: stats.totalViews, icon: Eye, color: "text-cyan-600", bg: "bg-cyan-50" },
            { label: "Featured", val: stats.featured, icon: Star, color: "text-purple-600", bg: "bg-purple-50" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={cn("rounded-xl border border-border p-3", s.bg)}>
                <div className="flex items-center justify-between mb-1">
                  <Icon className={cn("size-4", s.color)} />
                </div>
                <p className={cn("text-xl font-bold", s.color)}>{s.val}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Search + Filters + Sort */}
      {!isLoading && allProducts.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${isFood ? "products" : "packages"}…`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="temporarily_unavailable">Temp. Unavailable</option>
            <option value="seasonal">Seasonal</option>
            <option value="archived">Archived</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">A–Z</option>
            <option value="price_high">Price: High→Low</option>
            <option value="price_low">Price: Low→High</option>
            <option value="views">Most Viewed</option>
          </select>
          {selected.size > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2 py-1">
              <span className="text-xs font-medium">{selected.size} selected</span>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => bulkAction("publish")}>Publish</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => bulkAction("hide")}>Hide</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => bulkAction("delete")}>Delete</Button>
              <Button size="sm" variant="ghost" className="h-7" onClick={() => setSelected(new Set())}><X className="size-3" /></Button>
            </div>
          )}
        </div>
      )}

      {/* Products */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : allProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <Package className="mx-auto size-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-bold">No {isFood ? "products" : "packages"} yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first {isFood ? "product" : "package"} to help customers understand what you offer
          </p>
          <Button onClick={openAdd} className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90">
            <Plus className="size-4" /> Add your first {isFood ? "product" : "package"}
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center">
          <p className="text-sm font-medium">No results found</p>
          <p className="mt-1 text-xs text-muted-foreground">Try a different search or filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select All */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <button onClick={toggleSelectAll} className="flex items-center gap-1.5 hover:text-foreground">
              <div className={cn("grid size-4 place-items-center rounded border", selected.size === filteredProducts.length && filteredProducts.length > 0 ? "border-brand bg-brand" : "border-muted-foreground/30")}>
                {selected.size === filteredProducts.length && filteredProducts.length > 0 && <Check className="size-3 text-white" />}
              </div>
              Select All
            </button>
          </div>

          {/* Product Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((p, idx) => {
              const isSelected = selected.has(p.id);
              const isAvailable = p.isAvailable !== false;
              const status = p.status || (isAvailable ? "active" : "unavailable");
              const views = p.views ?? 0;
              const isFeatured = p.isFeatured || p.featured;
              const stockType = (p as any).stockType || "unlimited";
              const stockCount = (p as any).stockCount ?? null;
              const lowStockThreshold = (p as any).lowStockThreshold ?? 10;

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    "rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-md",
                    isSelected ? "border-brand ring-1 ring-brand" : "border-border"
                  )}
                >
                  {/* Image + Checkbox */}
                  <div className="relative h-32 bg-muted">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : p.images && p.images.length > 0 ? (
                      <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="size-8 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(p.id)}
                      className={cn(
                        "absolute left-2 top-2 grid size-5 place-items-center rounded border transition-colors",
                        isSelected ? "border-brand bg-brand" : "border-white/80 bg-black/20 backdrop-blur hover:bg-black/40"
                      )}
                    >
                      {isSelected && <Check className="size-3 text-white" />}
                    </button>
                    {/* Status badge */}
                    <div className="absolute right-2 top-2">
                      <StatusBadge status={status} />
                    </div>
                    {/* Featured star */}
                    {isFeatured && (
                      <div className="absolute bottom-2 right-2">
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className="truncate text-sm font-bold">{p.name}</h3>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {p.productType || p.category || (isFood ? "Food Product" : "Service Package")}
                    </p>

                    {/* Stock pill */}
                    <div className="mt-1.5">
                      <StockPill stockType={stockType} stockCount={stockCount} lowStockThreshold={lowStockThreshold} />
                    </div>

                    {/* Price + Views */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-brand">
                        {symbol}{p.price.toLocaleString()}
                        {p.comparePrice && (
                          <span className="ml-1 text-xs text-muted-foreground line-through">
                            {symbol}{p.comparePrice.toLocaleString()}
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Eye className="size-3" /> {views}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-1 border-t border-border pt-2">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(p)}>
                        <Pencil className="size-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" title="Inventory & Availability" onClick={() => setInventoryProduct({ id: p.id, name: p.name })}>
                        <Boxes className="size-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleDuplicate(p)}>
                        <Copy className="size-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleToggleVisibility(p)}>
                        {status === "draft" ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                      </Button>
                      <a href={`/product/${p.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 px-2">
                          <Globe className="size-3" />
                        </Button>
                      </a>
                      <Button size="sm" variant="ghost" className="h-7 px-2 ml-auto text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id, p.name)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-Step Product Wizard (replaces old dialog) */}
      {showModal && (
        <ProductWizard
          vendor={vendor}
          initialData={editingProduct || undefined}
          onSave={async (data) => {
            setSaving(true);
            try {
              if (editingProduct) {
                const res = await fetch(`/api/vendor/products/${editingProduct.id}`, {
                  method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
                });
                if (!res.ok) {
                  const errBody = await res.json().catch(() => ({}));
                  throw new Error(errBody.error || `Update failed (HTTP ${res.status})`);
                }
                toast.success("Product updated!");
                return { slug: editingProduct.slug, id: editingProduct.id };
              } else {
                const res = await fetch("/api/vendor/products", {
                  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
                });
                if (!res.ok) {
                  const errBody = await res.json().catch(() => ({}));
                  throw new Error(errBody.error || `Create failed (HTTP ${res.status})`);
                }
                const body = await res.json();
                toast.success("Product created!");
                return { slug: body.product?.slug, id: body.product?.id };
              }
            } catch (e: any) {
              toast.error(e.message || "Failed to save");
              // Re-throw so the wizard's handlePublish catch block can show the error
              // and NOT display the fake success screen.
              throw e;
            } finally {
              setSaving(false);
              reload();
            }
          }}
          onClose={() => setShowModal(false)}
          saving={saving}
        />
      )}

      {/* Inventory & Availability Manager (full-screen sheet on mobile, dialog on desktop) */}
      {inventoryProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true">
          <div className="flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-2xl border bg-background shadow-xl sm:max-w-3xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b p-3">
              <h2 className="text-sm font-semibold">Manage Inventory</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setInventoryProduct(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <InventoryManager
                productId={inventoryProduct.id}
                productName={inventoryProduct.name}
                ecosystem={vendor.ecosystem}
                onClose={() => setInventoryProduct(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
