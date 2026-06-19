"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Store,
  Clock,
  CheckCircle2,
  CalendarCheck,
  Star,
  TrendingUp,
  Plus,
  Edit3,
  Eye,
  MapPin,
  Mail,
  Calendar,
  Users,
  ExternalLink,
  Package,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMarketplace } from "@/lib/store";
import {
  useVendorDashboard,
  useProducts,
  useCreateProduct,
  useDeleteProduct,
} from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { getCategory, CURRENCY_SYMBOLS } from "@/lib/constants";
import { getCategoryFields } from "@/lib/category-fields";
import { CategoryIcon } from "@/components/marketplace/icon";
import { formatPrice, countryCodeToFlag, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  declined: "bg-rose-100 text-rose-700",
};

export function VendorDashboard() {
  const open = useMarketplace((s) => s.vendorDashboardOpen);
  const close = useMarketplace((s) => s.closeVendorDashboard);
  const openListVendor = useMarketplace((s) => s.openListVendor);
  const openEditVendor = useMarketplace((s) => s.openEditVendor);
  const openVendor = useMarketplace((s) => s.openVendor);
  const { user } = useSupabaseSession();
  const { data, isLoading } = useVendorDashboard(open && !!user);

  const stats = data?.stats ?? {
    totalListings: 0,
    pending: 0,
    approved: 0,
    totalBookings: 0,
    pendingBookings: 0,
    avgRating: 0,
  };

  const statCards = [
    {
      icon: Store,
      label: "Listings",
      value: stats.totalListings,
      sub: `${stats.approved} live`,
      color: "bg-amber-500",
    },
    {
      icon: Clock,
      label: "Pending",
      value: stats.pending,
      sub: "awaiting approval",
      color: "bg-orange-500",
    },
    {
      icon: CalendarCheck,
      label: "Bookings",
      value: stats.totalBookings,
      sub: `${stats.pendingBookings} pending`,
      color: "bg-fuchsia-500",
    },
    {
      icon: Star,
      label: "Avg rating",
      value: stats.avgRating.toFixed(1),
      sub: "across listings",
      color: "bg-purple-500",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[95vh] gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogTitle className="sr-only">Vendor dashboard</DialogTitle>
        <DialogDescription className="sr-only">
          Manage your business listings, bookings and reviews.
        </DialogDescription>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-gradient-to-r from-brand-soft to-background px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-brand text-brand-foreground shadow-sm">
              <Store className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">My Dashboard</h2>
              <p className="text-xs text-muted-foreground">
                {user?.email ?? "Vendor"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              const firstVendor = data?.vendors[0];
              if (firstVendor) {
                close();
                setTimeout(() => openEditVendor(firstVendor.slug), 150);
              } else {
                close();
                setTimeout(() => openListVendor(), 150);
              }
            }}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <Edit3 className="size-4" />
            {data?.vendors.length ? "Edit business" : "Create business"}
          </Button>
        </div>

        <ScrollArea className="max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-6 p-5 sm:p-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl" />
                  ))
                : statCards.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.label}
                        className="rounded-2xl border border-border bg-card p-4"
                      >
                        <div
                          className={cn(
                            "mb-2 grid size-9 place-items-center rounded-xl text-white",
                            s.color
                          )}
                        >
                          <Icon className="size-4.5" />
                        </div>
                        <p className="text-2xl font-extrabold tabular-nums">
                          {s.value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                          {s.sub}
                        </p>
                      </div>
                    );
                  })}
            </div>

            {/* My listings */}
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Store className="size-4 text-brand" />
                My listings
              </h3>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-2xl" />
                  ))}
                </div>
              ) : !data?.vendors.length ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                  <Store className="mx-auto size-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm font-medium">No listings yet</p>
                  <p className="text-xs text-muted-foreground">
                    Click "New listing" to create your first business listing.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.vendors.map((v) => {
                    const cat = getCategory(v.category);
                    return (
                      <div
                        key={v.id}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                      >
                        {/* thumbnail */}
                        <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                          {v.heroImage && (
                            <img
                              src={v.heroImage}
                              alt={v.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        {/* info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold">{v.name}</p>
                            {v.approved ? (
                              <Badge className="border-0 bg-emerald-100 text-[10px] text-emerald-700">
                                ✅ Live
                              </Badge>
                            ) : (
                              <Badge className="border-0 bg-amber-100 text-[10px] text-amber-700">
                                ⏳ Pending
                              </Badge>
                            )}
                            {v.featured && (
                              <Badge className="border-0 bg-brand-soft text-[10px] text-brand-soft-foreground">
                                ⭐ Featured
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {countryCodeToFlag(v.countryCode)} {v.city} ·{" "}
                            {cat?.label ?? v.category}
                            {v.subcategory ? ` · ${v.subcategory}` : ""}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-0.5">
                              <Star className="size-3 fill-amber-400 text-amber-400" />
                              {v.rating.toFixed(1)} ({v.reviewCount})
                            </span>
                            <span className="text-muted-foreground">
                              · from {formatPrice(v.basePrice, v.currency)}
                            </span>
                          </div>
                        </div>
                        {/* actions */}
                        <div className="flex shrink-0 gap-1">
                          <button
                            title="Edit listing"
                            onClick={() => {
                              close();
                              setTimeout(() => openEditVendor(v.slug), 150);
                            }}
                            className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <Edit3 className="size-4" />
                          </button>
                          <button
                            title="View listing"
                            onClick={() => {
                              close();
                              setTimeout(() => openVendor(v.slug), 150);
                            }}
                            className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <Eye className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Products / Services */}
            <ProductsSection vendorId={data?.vendors[0]?.id ?? null} currency={data?.vendors[0]?.currency} ecosystem={data?.vendors[0]?.ecosystem} category={data?.vendors[0]?.category} />

            {/* Recent bookings + reviews */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Bookings */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <CalendarCheck className="size-4 text-brand" />
                  Recent bookings
                </h3>
                {isLoading ? (
                  <Skeleton className="h-32 rounded-xl" />
                ) : !data?.bookings.length ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No bookings yet
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {data.bookings.slice(0, 5).map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center gap-2 rounded-lg border border-border bg-background p-2.5"
                      >
                        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                          <Users className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">
                            {b.name}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {b.eventType} · {b.vendorName}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase",
                            STATUS_STYLE[b.status]
                          )}
                        >
                          {b.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Reviews */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Star className="size-4 text-brand" />
                  Recent reviews
                </h3>
                {isLoading ? (
                  <Skeleton className="h-32 rounded-xl" />
                ) : !data?.reviews.length ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No reviews yet
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {data.reviews.slice(0, 5).map((r) => (
                      <li
                        key={r.id}
                        className="rounded-lg border border-border bg-background p-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-semibold">
                            {r.author}
                          </p>
                          <span className="inline-flex items-center gap-0.5 text-[11px]">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            {r.rating}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                          &ldquo;{r.comment}&rdquo;
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                          on {r.vendorName} · {timeAgo(r.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ── Products / Services section ─────────────────────────────────────────────

function ProductsSection({
  vendorId,
  currency,
  ecosystem,
  category,
}: {
  vendorId: string | null;
  currency?: string;
  ecosystem?: string;
  category?: string;
}) {
  const { data, isLoading } = useProducts(vendorId);
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // category-specific field config
  const catConfig = getCategoryFields(category ?? "");
  const isFMB = ecosystem === "FINDMYBITES";

  // form state — includes all fields
  const EMPTY_FORM = {
    name: "", price: "", description: "", productType: "",
    sizes: "", flavours: "", weight: "", prepTime: "",
    deliveryAvailable: false, minGuests: "", pricePerHead: "",
    servings: "", shape: "", eggless: false,
    sameDay: false, customOrder: false, pickupAvailable: false,
    featured: false, videoUrl: "",
  };
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [extraFieldsForm, setExtraFieldsForm] = React.useState<Record<string, string>>({});

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setExtraFieldsForm({});
    setEditingId(null);
  };

  const onEdit = (p: typeof products[0]) => {
    setEditingId(p.id);
    setShowForm(false);
    setForm({
      name: p.name,
      price: String(p.price),
      description: p.description ?? "",
      productType: p.productType ?? "",
      sizes: p.sizes ?? "",
      flavours: p.flavours ?? "",
      weight: p.weight ?? "",
      prepTime: p.prepTime ?? "",
      deliveryAvailable: p.deliveryAvailable,
      minGuests: p.minGuests != null ? String(p.minGuests) : "",
      pricePerHead: p.pricePerHead != null ? String(p.pricePerHead) : "",
      servings: p.servings ?? "",
      shape: p.shape ?? "",
      eggless: p.eggless ?? false,
      sameDay: p.sameDay ?? false,
      customOrder: p.customOrder ?? false,
      pickupAvailable: p.pickupAvailable ?? false,
      featured: p.featured ?? false,
      videoUrl: p.videoUrl ?? "",
    });
    setExtraFieldsForm(p.extraFields ?? {});
  };

  const products = data?.products ?? [];
  const symbol = currency ? (CURRENCY_SYMBOLS[currency] ?? currency) : "$";

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || !form.name.trim()) return;
    const payload: Record<string, unknown> = {
      vendorId,
      name: form.name.trim(),
      price: Number(form.price) || 0,
      description: form.description.trim() || undefined,
      productType: form.productType || undefined,
      deliveryAvailable: form.deliveryAvailable,
      pickupAvailable: form.pickupAvailable,
      sameDay: form.sameDay,
      customOrder: form.customOrder,
      featured: form.featured,
      videoUrl: form.videoUrl.trim() || undefined,
    };
    // conditionally add category-specific fields
    if (catConfig.show.sizes) payload.sizes = form.sizes.trim() || undefined;
    if (catConfig.show.flavours) payload.flavours = form.flavours.trim() || undefined;
    if (catConfig.show.weight) payload.weight = form.weight.trim() || undefined;
    if (catConfig.show.prepTime) payload.prepTime = form.prepTime.trim() || undefined;
    if (catConfig.show.servings) payload.servings = form.servings.trim() || undefined;
    if (catConfig.show.shape) payload.shape = form.shape.trim() || undefined;
    if (catConfig.show.eggless) payload.eggless = form.eggless;
    if (catConfig.show.minGuests) payload.minGuests = form.minGuests ? Number(form.minGuests) : undefined;
    if (catConfig.show.pricePerHead) payload.pricePerHead = form.pricePerHead ? Number(form.pricePerHead) : undefined;
    // extra fields
    const hasExtra = Object.values(extraFieldsForm).some((v) => v.trim());
    if (hasExtra) payload.extraFields = JSON.stringify(extraFieldsForm);

    try {
      if (editingId) {
        const res = await fetch(`/api/products/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update");
        toast.success("Product updated!");
        queryClient.invalidateQueries({ queryKey: ["products", vendorId] });
      } else {
        await createProduct.mutateAsync(payload as Parameters<typeof createProduct.mutateAsync>[0]);
        toast.success("Product added!");
      }
      resetForm();
      setShowForm(false);
    } catch {
      toast.error(editingId ? "Failed to update product" : "Failed to add product");
    }
  };

  const onDelete = (id: string) => {
    if (!vendorId) return;
    if (!confirm("Delete this product?")) return;
    deleteProduct.mutate({ id, vendorId });
  };

  if (!vendorId) return null;

  // Shared form fields component (used for both add and edit)
  const formFields = (
    <>
      {/* Name + Price */}
      <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
        <div>
          <label className="mb-1 block text-xs font-semibold">Name</label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={isFMB ? "e.g. Luxury Wedding Cake" : "e.g. Wedding Photography Package"} className="h-9" required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">Price ({symbol})</label>
          <Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0" className="h-9" min={0} />
        </div>
      </div>

      {/* Product type */}
      <div>
        <label className="mb-1 block text-xs font-semibold">{catConfig.noun} type</label>
        <select value={form.productType} onChange={(e) => set("productType", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Select type</option>
          {catConfig.types.map((t) => <option key={t} value={t.toLowerCase()}>{t}</option>)}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-xs font-semibold">Description</label>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe your product or package..." className="h-20 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm" maxLength={500} />
      </div>

      {/* Category-specific fields */}
      <div className="grid gap-2 sm:grid-cols-2">
        {catConfig.show.sizes && <div><label className="mb-1 block text-xs font-semibold">Sizes</label><Input value={form.sizes} onChange={(e) => set("sizes", e.target.value)} placeholder="1kg, 2kg, 3kg" className="h-9" /></div>}
        {catConfig.show.flavours && <div><label className="mb-1 block text-xs font-semibold">Flavours</label><Input value={form.flavours} onChange={(e) => set("flavours", e.target.value)} placeholder="Vanilla, Chocolate, Red Velvet" className="h-9" /></div>}
        {catConfig.show.weight && <div><label className="mb-1 block text-xs font-semibold">Weight</label><Input value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="500g, 1kg" className="h-9" /></div>}
        {catConfig.show.prepTime && <div><label className="mb-1 block text-xs font-semibold">Prep time</label><Input value={form.prepTime} onChange={(e) => set("prepTime", e.target.value)} placeholder="24 hours, 3 days" className="h-9" /></div>}
        {catConfig.show.servings && <div><label className="mb-1 block text-xs font-semibold">Servings</label><Input value={form.servings} onChange={(e) => set("servings", e.target.value)} placeholder="Serves 10-20" className="h-9" /></div>}
        {catConfig.show.shape && <div><label className="mb-1 block text-xs font-semibold">Shape</label><Input value={form.shape} onChange={(e) => set("shape", e.target.value)} placeholder="Round, Square, Heart" className="h-9" /></div>}
        {catConfig.show.minGuests && <div><label className="mb-1 block text-xs font-semibold">Min guests</label><Input type="number" value={form.minGuests} onChange={(e) => set("minGuests", e.target.value)} placeholder="50" className="h-9" min={0} /></div>}
        {catConfig.show.pricePerHead && <div><label className="mb-1 block text-xs font-semibold">Price per head</label><Input type="number" value={form.pricePerHead} onChange={(e) => set("pricePerHead", e.target.value)} placeholder="250" className="h-9" min={0} /></div>}
      </div>

      {/* Extra category-specific fields */}
      {catConfig.extraFields.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {catConfig.extraFields.map((ef) => (
            <div key={ef.key}>
              <label className="mb-1 block text-xs font-semibold">{ef.label}</label>
              <Input
                value={extraFieldsForm[ef.key] ?? ""}
                onChange={(e) => setExtraFieldsForm((prev) => ({ ...prev, [ef.key]: e.target.value }))}
                placeholder={ef.placeholder}
                className="h-9"
              />
            </div>
          ))}
        </div>
      )}

      {/* Video URL */}
      <div>
        <label className="mb-1 block text-xs font-semibold">Video URL (optional)</label>
        <Input value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="YouTube or Vimeo link" className="h-9" />
      </div>

      {/* Toggle badges */}
      <div className="flex flex-wrap gap-3">
        {catConfig.show.eggless && (
          <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.eggless} onChange={(e) => set("eggless", e.target.checked)} className="size-4 rounded" /> 🥚 Eggless</label>
        )}
        <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.deliveryAvailable} onChange={(e) => set("deliveryAvailable", e.target.checked)} className="size-4 rounded" /> 🚚 Delivery</label>
        <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.pickupAvailable} onChange={(e) => set("pickupAvailable", e.target.checked)} className="size-4 rounded" /> 🏪 Pickup</label>
        <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.sameDay} onChange={(e) => set("sameDay", e.target.checked)} className="size-4 rounded" /> ⚡ Same-day</label>
        <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.customOrder} onChange={(e) => set("customOrder", e.target.checked)} className="size-4 rounded" /> 🎨 Custom orders</label>
        <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="size-4 rounded" /> ⭐ Featured</label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
          {editingId ? "Save changes" : "Add"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => { resetForm(); setShowForm(false); setEditingId(null); }}>
          Cancel
        </Button>
      </div>
    </>
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Package className="size-4 text-brand" />
          {isFMB ? "Products" : "Packages & Services"}
        </h3>
        <button
          onClick={() => { resetForm(); setShowForm((v) => !v); }}
          className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground transition-transform hover:scale-105"
        >
          <Plus className="size-3" />
          {isFMB ? "Add product" : "Add package"}
        </button>
      </div>

      {/* Edit form (shown when editing a product) */}
      {editingId && !showForm && (
        <form
          onSubmit={onAdd}
          className="mb-3 space-y-3 rounded-xl border-2 border-brand-border bg-brand-soft/30 p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-brand">Edit product</p>
            <button type="button" onClick={() => { resetForm(); setEditingId(null); }} className="text-xs text-muted-foreground hover:text-foreground">Cancel edit</button>
          </div>
          {/* Name + Price */}
          <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
            <div>
              <label className="mb-1 block text-xs font-semibold">Name</label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="h-9" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Price ({symbol})</label>
              <Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} className="h-9" min={0} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{isFMB ? "Product type" : "Package type"}</label>
            <select value={form.productType} onChange={(e) => set("productType", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Select type</option>
              {catConfig.types.map((t) => <option key={t} value={t.toLowerCase()}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="h-20 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm" maxLength={500} />
          </div>
          {isFMB ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-semibold">Sizes</label><Input value={form.sizes} onChange={(e) => set("sizes", e.target.value)} placeholder="1kg, 2kg" className="h-9" /></div>
              <div><label className="mb-1 block text-xs font-semibold">Flavours</label><Input value={form.flavours} onChange={(e) => set("flavours", e.target.value)} placeholder="Vanilla, Chocolate" className="h-9" /></div>
              <div><label className="mb-1 block text-xs font-semibold">Weight</label><Input value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="500g" className="h-9" /></div>
              <div><label className="mb-1 block text-xs font-semibold">Prep time</label><Input value={form.prepTime} onChange={(e) => set("prepTime", e.target.value)} placeholder="24 hours" className="h-9" /></div>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-semibold">Min guests</label><Input type="number" value={form.minGuests} onChange={(e) => set("minGuests", e.target.value)} className="h-9" min={0} /></div>
              <div><label className="mb-1 block text-xs font-semibold">Price per head</label><Input type="number" value={form.pricePerHead} onChange={(e) => set("pricePerHead", e.target.value)} className="h-9" min={0} /></div>
            </div>
          )}
          <label className="flex items-center gap-2 text-xs font-medium">
            <input type="checkbox" checked={form.deliveryAvailable} onChange={(e) => set("deliveryAvailable", e.target.checked)} className="size-4 rounded" /> Delivery available
          </label>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">Save changes</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { resetForm(); setEditingId(null); }}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Add product form */}
      {showForm && (
        <form
          onSubmit={onAdd}
          className="mb-3 space-y-3 rounded-xl border border-border bg-muted/40 p-4"
        >
          {/* Name + Price */}
          <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
            <div>
              <label className="mb-1 block text-xs font-semibold">Name</label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={isFMB ? "e.g. Luxury Wedding Cake" : "e.g. Wedding Photography Package"}
                className="h-9"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Price ({symbol})</label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="0"
                className="h-9"
                min={0}
              />
            </div>
          </div>

          {/* Product type */}
          <div>
            <label className="mb-1 block text-xs font-semibold">
              {isFMB ? "Product type" : "Package type"}
            </label>
            <select
              value={form.productType}
              onChange={(e) => set("productType", e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select type (optional)</option>
              {catConfig.types.map((t) => (
                <option key={t} value={t.toLowerCase()}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-semibold">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe your product or package..."
              className="h-20 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={500}
            />
          </div>

          {/* Type-specific fields */}
          {isFMB ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Sizes (optional)</label>
                  <Input
                    value={form.sizes}
                    onChange={(e) => set("sizes", e.target.value)}
                    placeholder="e.g. 1kg, 2kg, 3kg"
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">Flavours (optional)</label>
                  <Input
                    value={form.flavours}
                    onChange={(e) => set("flavours", e.target.value)}
                    placeholder="e.g. Vanilla, Chocolate, Red Velvet"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold">Weight (optional)</label>
                  <Input
                    value={form.weight}
                    onChange={(e) => set("weight", e.target.value)}
                    placeholder="e.g. 500g, 1kg"
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">Prep time (optional)</label>
                  <Input
                    value={form.prepTime}
                    onChange={(e) => set("prepTime", e.target.value)}
                    placeholder="e.g. 24 hours, 3 days"
                    className="h-9"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold">Min guests (optional)</label>
                <Input
                  type="number"
                  value={form.minGuests}
                  onChange={(e) => set("minGuests", e.target.value)}
                  placeholder="e.g. 50"
                  className="h-9"
                  min={0}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">Price per head (optional)</label>
                <Input
                  type="number"
                  value={form.pricePerHead}
                  onChange={(e) => set("pricePerHead", e.target.value)}
                  placeholder="e.g. 250"
                  className="h-9"
                  min={0}
                />
              </div>
            </div>
          )}

          {/* Delivery toggle */}
          <label className="flex items-center gap-2 text-xs font-medium">
            <input
              type="checkbox"
              checked={form.deliveryAvailable}
              onChange={(e) => set("deliveryAvailable", e.target.checked)}
              className="size-4 rounded"
            />
            Delivery available
          </label>

          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={createProduct.isPending}
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {createProduct.isPending ? "Adding…" : "Add"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Product list */}
      {isLoading ? (
        <Skeleton className="h-20 rounded-xl" />
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
          <Package className="mx-auto size-6 text-muted-foreground/40" />
          <p className="mt-1 text-xs text-muted-foreground">
            No {isFMB ? "products" : "packages"} yet. Add your{" "}
            {isFMB ? "products" : "packages or services"} here — customers will
            see them on your listing.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border bg-card p-3"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <Package className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    {p.productType && (
                      <span className="shrink-0 rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand-soft-foreground">
                        {p.productType}
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums">
                  {symbol}
                  {p.price.toLocaleString("en-US")}
                </span>
                <button
                  title="Edit product"
                  onClick={() => onEdit(p)}
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Edit3 className="size-3.5" />
                </button>
                <button
                  title="Delete product"
                  onClick={() => onDelete(p.id)}
                  disabled={deleteProduct.isPending}
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-rose-100 hover:text-rose-600 disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              {/* Extra details */}
              {(p.sizes || p.flavours || p.weight || p.prepTime || p.minGuests || p.pricePerHead || p.servings || p.shape || p.eggless || p.sameDay || p.customOrder || p.pickupAvailable || p.featured || p.deliveryAvailable) && (
                <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border pt-2">
                  {p.featured && <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-soft-foreground">⭐ Featured</span>}
                  {p.sizes && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">📏 {p.sizes}</span>}
                  {p.flavours && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">🍰 {p.flavours}</span>}
                  {p.weight && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">⚖️ {p.weight}</span>}
                  {p.servings && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">🍽️ {p.servings}</span>}
                  {p.shape && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">⬡ {p.shape}</span>}
                  {p.eggless && <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">🥚 Eggless</span>}
                  {p.prepTime && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">⏱️ {p.prepTime}</span>}
                  {p.minGuests != null && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">👥 Min {p.minGuests}</span>}
                  {p.pricePerHead != null && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">💰 {symbol}{p.pricePerHead}/head</span>}
                  {p.sameDay && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">⚡ Same-day</span>}
                  {p.customOrder && <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-700">🎨 Custom</span>}
                  {p.deliveryAvailable && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">🚚 Delivery</span>}
                  {p.pickupAvailable && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">🏪 Pickup</span>}
                  {p.inStock === false && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-700">Out of stock</span>}
                  {p.stockCount != null && p.inStock && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">📦 {p.stockCount} in stock</span>}
                </div>
              )}
              {/* Extra category fields */}
              {p.extraFields && Object.entries(p.extraFields).filter(([,v]) => v).length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {Object.entries(p.extraFields).filter(([,v]) => v).map(([k, v]) => (
                    <span key={k} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{v}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
