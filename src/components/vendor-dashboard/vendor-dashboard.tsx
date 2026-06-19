"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Store,
  Clock,
  CalendarCheck,
  Star,
  Plus,
  Edit3,
  Eye,
  Users,
  Package,
  Trash2,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { formatPrice, countryCodeToFlag, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  confirmed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  declined: "bg-rose-500/10 text-rose-600 border-rose-500/20",
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
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-500/5",
    },
    {
      icon: Clock,
      label: "Pending",
      value: stats.pending,
      sub: "awaiting review",
      gradient: "from-orange-500 to-rose-500",
      bg: "bg-orange-500/5",
    },
    {
      icon: CalendarCheck,
      label: "Bookings",
      value: stats.totalBookings,
      sub: `${stats.pendingBookings} new`,
      gradient: "from-fuchsia-500 to-purple-500",
      bg: "bg-fuchsia-500/5",
    },
    {
      icon: Star,
      label: "Rating",
      value: stats.avgRating.toFixed(1),
      sub: "avg score",
      gradient: "from-purple-500 to-pink-500",
      bg: "bg-purple-500/5",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[95vh] gap-0 overflow-hidden border-border/50 p-0 shadow-2xl sm:max-w-5xl">
        <DialogTitle className="sr-only">Vendor dashboard</DialogTitle>
        <DialogDescription className="sr-only">
          Manage your business listings, bookings and reviews.
        </DialogDescription>

        {/* Modern gradient header */}
        <div className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-brand-soft via-background to-brand-soft px-6 py-5">
          <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-brand/5 blur-2xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand/80 text-brand-foreground shadow-lg">
                <Store className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold leading-tight">Vendor Dashboard</h2>
                <p className="text-xs text-muted-foreground">
                  {user?.email ?? "Vendor"}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                const firstVendor = data?.vendors[0];
                close();
                setTimeout(
                  () => (firstVendor ? openEditVendor(firstVendor.slug) : openListVendor()),
                  150
                );
              }}
              className="gap-1.5 rounded-xl bg-gradient-to-r from-brand to-brand/80 text-brand-foreground shadow-md transition-all hover:shadow-lg hover:brightness-110"
            >
              {data?.vendors.length ? (
                <>
                  <Edit3 className="size-3.5" />
                  <span className="hidden sm:inline">Edit business</span>
                  <Edit3 className="size-3.5 sm:hidden" />
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  Create business
                </>
              )}
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[78vh] overflow-y-auto">
          <div className="space-y-6 p-5 sm:p-6">
            {/* Modern stat cards with gradient icons */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <ShimmerCard key={i} />
                  ))
                : statCards.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className={cn(
                          "relative overflow-hidden rounded-2xl border border-border/60 p-4",
                          s.bg
                        )}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div
                            className={cn(
                              "grid size-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md",
                              s.gradient
                            )}
                          >
                            <Icon className="size-5" />
                          </div>
                          <TrendingUp className="size-4 text-muted-foreground/40" />
                        </div>
                        <p className="text-2xl font-extrabold tracking-tight tabular-nums">
                          {s.value}
                        </p>
                        <p className="text-xs font-medium text-muted-foreground">
                          {s.label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                          {s.sub}
                        </p>
                      </motion.div>
                    );
                  })}
            </div>

            {/* My listings — modern card style */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <Store className="size-4 text-brand" />
                  My Business
                </h3>
              </div>
              {isLoading ? (
                <ShimmerCard />
              ) : !data?.vendors.length ? (
                <EmptyState
                  icon={Store}
                  title="No business yet"
                  desc="Create your business listing to start receiving bookings."
                  action={
                    <Button
                      size="sm"
                      onClick={() => {
                        close();
                        setTimeout(() => openListVendor(), 150);
                      }}
                      className="gap-1.5 rounded-xl bg-brand text-brand-foreground"
                    >
                      <Plus className="size-3.5" />
                      Create business
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {data.vendors.map((v, i) => {
                    const cat = getCategory(v.category);
                    return (
                      <motion.div
                        key={v.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-3 transition-all hover:border-brand-border hover:shadow-md"
                      >
                        {/* thumbnail */}
                        <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-muted shadow-sm">
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
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                                <CheckCircle2 className="size-2.5" /> Live
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                                <Clock className="size-2.5" /> Pending
                              </span>
                            )}
                            {v.featured && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                                <Star className="size-2.5 fill-current" /> Featured
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {countryCodeToFlag(v.countryCode)} {v.city} ·{" "}
                            {cat?.label ?? v.category}
                            {v.subcategory ? ` · ${v.subcategory}` : ""}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-xs">
                            <span className="inline-flex items-center gap-0.5">
                              <Star className="size-3 fill-amber-400 text-amber-400" />
                              <span className="font-semibold">{v.rating.toFixed(1)}</span>
                              <span className="text-muted-foreground">({v.reviewCount})</span>
                            </span>
                            <span className="text-muted-foreground">
                              from {formatPrice(v.basePrice, v.currency)}
                            </span>
                          </div>
                        </div>
                        {/* actions */}
                        <div className="flex shrink-0 gap-1">
                          <button
                            title="Edit"
                            onClick={() => {
                              close();
                              setTimeout(() => openEditVendor(v.slug), 150);
                            }}
                            className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-all hover:border-brand hover:bg-brand-soft hover:text-brand"
                          >
                            <Edit3 className="size-3.5" />
                          </button>
                          <button
                            title="View"
                            onClick={() => {
                              close();
                              setTimeout(() => openVendor(v.slug), 150);
                            }}
                            className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition-all hover:border-brand hover:bg-brand-soft hover:text-brand"
                          >
                            <Eye className="size-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Products / Services */}
            <ProductsSection
              vendorId={data?.vendors[0]?.id ?? null}
              currency={data?.vendors[0]?.currency}
              ecosystem={data?.vendors[0]?.ecosystem}
              category={data?.vendors[0]?.category}
            />

            {/* Recent activity — modern split cards */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Bookings */}
              <div className="rounded-2xl border border-border/60 bg-card p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <div className="grid size-7 place-items-center rounded-lg bg-fuchsia-500/10 text-fuchsia-500">
                    <CalendarCheck className="size-4" />
                  </div>
                  Recent Bookings
                </h3>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/50" />
                    ))}
                  </div>
                ) : !data?.bookings.length ? (
                  <EmptyMini icon={CalendarCheck} text="No bookings yet" />
                ) : (
                  <ul className="space-y-2">
                    {data.bookings.slice(0, 5).map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/50 p-2.5 transition-colors hover:bg-accent/30"
                      >
                        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-fuchsia-500/10 text-fuchsia-500">
                          <Users className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">{b.name}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {b.eventType} · {b.vendorName}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase",
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
              <div className="rounded-2xl border border-border/60 bg-card p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <div className="grid size-7 place-items-center rounded-lg bg-purple-500/10 text-purple-500">
                    <Star className="size-4" />
                  </div>
                  Recent Reviews
                </h3>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/50" />
                    ))}
                  </div>
                ) : !data?.reviews.length ? (
                  <EmptyMini icon={Star} text="No reviews yet" />
                ) : (
                  <ul className="space-y-2">
                    {data.reviews.slice(0, 5).map((r) => (
                      <li
                        key={r.id}
                        className="rounded-xl border border-border/40 bg-background/50 p-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-semibold">{r.author}</p>
                          <span className="inline-flex items-center gap-0.5 text-[11px]">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            {r.rating}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                          &ldquo;{r.comment}&rdquo;
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/50">
                          {r.vendorName} · {timeAgo(r.createdAt)}
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

// ── Shimmer loading card ───────────────────────────────────────────────────
function ShimmerCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-muted/30 to-transparent" />
      <div className="mb-3 size-10 rounded-xl bg-muted" />
      <div className="mb-2 h-6 w-16 rounded bg-muted" />
      <div className="h-3 w-20 rounded bg-muted/70" />
    </div>
  );
}

// ── Empty states ───────────────────────────────────────────────────────────
function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-10 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-muted/50">
        <Icon className="size-6 text-muted-foreground/40" />
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{desc}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function EmptyMini({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground/60">
      <Icon className="size-4" />
      {text}
    </div>
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

  const catConfig = getCategoryFields(category ?? "");
  const isFMB = ecosystem === "FINDMYBITES";

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
      name: p.name, price: String(p.price), description: p.description ?? "",
      productType: p.productType ?? "", sizes: p.sizes ?? "", flavours: p.flavours ?? "",
      weight: p.weight ?? "", prepTime: p.prepTime ?? "", deliveryAvailable: p.deliveryAvailable,
      minGuests: p.minGuests != null ? String(p.minGuests) : "",
      pricePerHead: p.pricePerHead != null ? String(p.pricePerHead) : "",
      servings: p.servings ?? "", shape: p.shape ?? "", eggless: p.eggless ?? false,
      sameDay: p.sameDay ?? false, customOrder: p.customOrder ?? false,
      pickupAvailable: p.pickupAvailable ?? false, featured: p.featured ?? false,
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
      vendorId, name: form.name.trim(), price: Number(form.price) || 0,
      description: form.description.trim() || undefined, productType: form.productType || undefined,
      deliveryAvailable: form.deliveryAvailable, pickupAvailable: form.pickupAvailable,
      sameDay: form.sameDay, customOrder: form.customOrder, featured: form.featured,
      videoUrl: form.videoUrl.trim() || undefined,
    };
    if (catConfig.show.sizes) payload.sizes = form.sizes.trim() || undefined;
    if (catConfig.show.flavours) payload.flavours = form.flavours.trim() || undefined;
    if (catConfig.show.weight) payload.weight = form.weight.trim() || undefined;
    if (catConfig.show.prepTime) payload.prepTime = form.prepTime.trim() || undefined;
    if (catConfig.show.servings) payload.servings = form.servings.trim() || undefined;
    if (catConfig.show.shape) payload.shape = form.shape.trim() || undefined;
    if (catConfig.show.eggless) payload.eggless = form.eggless;
    if (catConfig.show.minGuests) payload.minGuests = form.minGuests ? Number(form.minGuests) : undefined;
    if (catConfig.show.pricePerHead) payload.pricePerHead = form.pricePerHead ? Number(form.pricePerHead) : undefined;
    const hasExtra = Object.values(extraFieldsForm).some((v) => v.trim());
    if (hasExtra) payload.extraFields = JSON.stringify(extraFieldsForm);

    try {
      if (editingId) {
        const res = await fetch(`/api/products/${editingId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update");
        toast.success("Product updated!");
        queryClient.invalidateQueries({ queryKey: ["products", vendorId] });
      } else {
        await createProduct.mutateAsync(payload as Parameters<typeof createProduct.mutateAsync>[0]);
        toast.success("Product added!");
      }
      resetForm(); setShowForm(false);
    } catch {
      toast.error(editingId ? "Failed to update product" : "Failed to add product");
    }
  };

  const onDelete = (id: string) => {
    if (!vendorId || !confirm("Delete this product?")) return;
    deleteProduct.mutate({ id, vendorId });
  };

  if (!vendorId) return null;

  const formFields = (
    <>
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
      <div>
        <label className="mb-1 block text-xs font-semibold">{catConfig.noun} type</label>
        <select value={form.productType} onChange={(e) => set("productType", e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Select type</option>
          {catConfig.types.map((t) => <option key={t} value={t.toLowerCase()}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold">Description</label>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe your product or package..." className="h-20 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm" maxLength={500} />
      </div>
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
      {catConfig.extraFields.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {catConfig.extraFields.map((ef) => (
            <div key={ef.key}>
              <label className="mb-1 block text-xs font-semibold">{ef.label}</label>
              <Input value={extraFieldsForm[ef.key] ?? ""} onChange={(e) => setExtraFieldsForm((prev) => ({ ...prev, [ef.key]: e.target.value }))} placeholder={ef.placeholder} className="h-9" />
            </div>
          ))}
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs font-semibold">Video URL (optional)</label>
        <Input value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="YouTube or Vimeo link" className="h-9" />
      </div>
      <div className="flex flex-wrap gap-3">
        {catConfig.show.eggless && <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.eggless} onChange={(e) => set("eggless", e.target.checked)} className="size-4 rounded" /> 🥚 Eggless</label>}
        <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.deliveryAvailable} onChange={(e) => set("deliveryAvailable", e.target.checked)} className="size-4 rounded" /> 🚚 Delivery</label>
        <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.pickupAvailable} onChange={(e) => set("pickupAvailable", e.target.checked)} className="size-4 rounded" /> 🏪 Pickup</label>
        <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.sameDay} onChange={(e) => set("sameDay", e.target.checked)} className="size-4 rounded" /> ⚡ Same-day</label>
        <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.customOrder} onChange={(e) => set("customOrder", e.target.checked)} className="size-4 rounded" /> 🎨 Custom orders</label>
        <label className="flex items-center gap-1.5 text-xs font-medium"><input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="size-4 rounded" /> ⭐ Featured</label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">{editingId ? "Save changes" : "Add"}</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => { resetForm(); setShowForm(false); setEditingId(null); }}>Cancel</Button>
      </div>
    </>
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <div className="grid size-7 place-items-center rounded-lg bg-brand/10 text-brand">
            <Package className="size-4" />
          </div>
          {isFMB ? "Products" : "Packages & Services"}
        </h3>
        <button
          onClick={() => { resetForm(); setShowForm((v) => !v); }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand to-brand/80 px-3 py-1.5 text-xs font-semibold text-brand-foreground shadow-sm transition-all hover:shadow-md hover:brightness-110"
        >
          <Plus className="size-3" />
          {isFMB ? "Add product" : "Add package"}
        </button>
      </div>

      {editingId && !showForm && (
        <form onSubmit={onAdd} className="mb-3 space-y-3 rounded-2xl border-2 border-brand-border bg-brand-soft/20 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-brand">Edit product</p>
            <button type="button" onClick={() => { resetForm(); setEditingId(null); }} className="text-xs text-muted-foreground hover:text-foreground">Cancel edit</button>
          </div>
          {formFields}
        </form>
      )}

      {showForm && (
        <form onSubmit={onAdd} className="mb-3 space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
          {formFields}
        </form>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={`No ${isFMB ? "products" : "packages"} yet`}
          desc={`Add your ${isFMB ? "products" : "packages or services"} here — customers will see them on your listing.`}
        />
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="rounded-xl border border-border/60 bg-card p-3 transition-all hover:border-brand-border hover:shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                  <Package className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    {p.featured && <span className="shrink-0 rounded bg-brand/10 px-1 py-0.5 text-[10px] font-bold text-brand">⭐</span>}
                    {p.productType && <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium capitalize">{p.productType}</span>}
                  </div>
                  {p.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{p.description}</p>}
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums">{symbol}{p.price.toLocaleString("en-US")}</span>
                <button title="Edit" onClick={() => onEdit(p)} className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-all hover:bg-accent hover:text-foreground">
                  <Edit3 className="size-3.5" />
                </button>
                <button title="Delete" onClick={() => onDelete(p.id)} disabled={deleteProduct.isPending} className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-all hover:bg-rose-100 hover:text-rose-600 disabled:opacity-50">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              {(p.sizes || p.flavours || p.weight || p.prepTime || p.minGuests || p.pricePerHead || p.servings || p.shape || p.eggless || p.sameDay || p.customOrder || p.pickupAvailable || p.deliveryAvailable) && (
                <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border/40 pt-2">
                  {p.sizes && <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">📏 {p.sizes}</span>}
                  {p.flavours && <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">🍰 {p.flavours}</span>}
                  {p.weight && <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">⚖️ {p.weight}</span>}
                  {p.servings && <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">🍽️ {p.servings}</span>}
                  {p.shape && <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">⬡ {p.shape}</span>}
                  {p.eggless && <span className="rounded-md bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-600">🥚 Eggless</span>}
                  {p.prepTime && <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">⏱️ {p.prepTime}</span>}
                  {p.minGuests != null && <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">👥 Min {p.minGuests}</span>}
                  {p.pricePerHead != null && <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">💰 {symbol}{p.pricePerHead}/head</span>}
                  {p.sameDay && <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-600">⚡ Same-day</span>}
                  {p.customOrder && <span className="rounded-md bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-600">🎨 Custom</span>}
                  {p.deliveryAvailable && <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-600">🚚 Delivery</span>}
                  {p.pickupAvailable && <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-600">🏪 Pickup</span>}
                </div>
              )}
              {p.extraFields && Object.entries(p.extraFields).filter(([, v]) => v).length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {Object.entries(p.extraFields).filter(([, v]) => v).map(([k, v]) => (
                    <span key={k} className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]">{v}</span>
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

// Need Input import for the form
import { Input } from "@/components/ui/input";
