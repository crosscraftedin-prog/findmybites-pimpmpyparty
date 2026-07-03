"use client";

import * as React from "react";
import {
  Boxes, PackageX, Snowflake, EyeOff, Star, Search, Loader2, ShieldAlert,
  Eye, RefreshCw, StarOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { StatusBadge, StockPill } from "@/components/inventory/status-badge";

interface AdminProduct {
  id: string; name: string; status: string; stockType: string; stockCount: number | null;
  lowStockThreshold: number; forceHidden: boolean; isFeatured: boolean; featured: boolean;
  ecosystem: string | null; category: string | null; views: number; orderCount: number;
  salesRevenue: number; availabilityMode: string; availabilityEnd: string | null;
  vendorId: string; vendorName: string; vendorEcosystem: string | null;
}

interface AdminInventoryData {
  products: AdminProduct[];
  stats: { total: number; outOfStock: number; seasonal: number; forceHidden: number; lowStock: number };
}

type FilterTab = "all" | "out_of_stock" | "seasonal" | "force_hidden" | "low_stock";

/**
 * Admin inventory management panel.
 * View all products, filter by status, force-hide, feature, and inspect inventory.
 */
export function AdminInventory() {
  const [data, setData] = React.useState<AdminInventoryData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<FilterTab>("all");
  const [search, setSearch] = React.useState("");
  const [ecosystem, setEcosystem] = React.useState<string>("");
  const [updating, setUpdating] = React.useState<Record<string, boolean>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab === "out_of_stock") params.set("outOfStock", "true");
      if (tab === "seasonal") params.set("seasonal", "true");
      if (tab === "force_hidden") params.set("forceHidden", "true");
      if (ecosystem) params.set("ecosystem", ecosystem);
      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      if (res.ok) setData(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tab, ecosystem]);

  React.useEffect(() => { load(); }, [load]);

  const filtered = React.useMemo(() => {
    if (!data) return [];
    let list = data.products;
    if (tab === "low_stock") {
      list = list.filter((p) => p.stockType === "limited" && (p.stockCount ?? 0) < (p.lowStockThreshold || 10));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.vendorName.toLowerCase().includes(q));
    }
    return list;
  }, [data, tab, search]);

  const updateProduct = async (id: string, body: Record<string, any>, label: string) => {
    setUpdating((u) => ({ ...u, [id]: true }));
    try {
      const res = await fetch(`/api/admin/inventory?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success(label);
      load();
    } catch {
      toast.error("Update failed");
    } finally {
      setUpdating((u) => ({ ...u, [id]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header + stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Boxes className="h-5 w-5" /> Inventory Management
          </h2>
          <p className="text-sm text-muted-foreground">Monitor and moderate all product inventory across the marketplace.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatBox label="Total Products" value={data.stats.total} icon={<Boxes className="h-4 w-4" />} tone="neutral" />
          <StatBox label="Out of Stock" value={data.stats.outOfStock} icon={<PackageX className="h-4 w-4" />} tone="danger" />
          <StatBox label="Low Stock" value={data.stats.lowStock} icon={<ShieldAlert className="h-4 w-4" />} tone="warning" />
          <StatBox label="Seasonal" value={data.stats.seasonal} icon={<Snowflake className="h-4 w-4" />} tone="info" />
          <StatBox label="Force Hidden" value={data.stats.forceHidden} icon={<EyeOff className="h-4 w-4" />} tone="muted" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-lg border p-1">
          {([
            { v: "all", l: "All" },
            { v: "out_of_stock", l: "Out of Stock" },
            { v: "low_stock", l: "Low Stock" },
            { v: "seasonal", l: "Seasonal" },
            { v: "force_hidden", l: "Force Hidden" },
          ] as { v: FilterTab; l: string }[]).map((t) => (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                tab === t.v ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
            >
              {t.l}
            </button>
          ))}
        </div>
        <select
          value={ecosystem}
          onChange={(e) => setEcosystem(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Both ecosystems</option>
          <option value="FINDMYBITES">FindMyBites (Food)</option>
          <option value="PIMPMYPARTY">PimpMyParty (Events)</option>
        </select>
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search product or vendor…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Product table */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No products match this filter.
        </div>
      ) : (
        <div className="rounded-xl border">
          {/* Desktop header */}
          <div className="hidden grid-cols-[1fr_90px_110px_90px_90px_120px] gap-2 border-b bg-muted/40 p-3 text-[11px] font-semibold uppercase text-muted-foreground sm:grid">
            <span>Product / Vendor</span>
            <span>Status</span>
            <span>Stock</span>
            <span>Views</span>
            <span>Revenue</span>
            <span className="text-right">Admin Actions</span>
          </div>
          <ScrollArea className="max-h-[60vh]">
            <div className="divide-y">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-[1fr_90px_110px_90px_90px_120px] sm:items-center sm:gap-2"
                >
                  {/* Product */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{p.name}</span>
                      {p.forceHidden && <Badge variant="destructive" className="text-[9px]">HIDDEN</Badge>}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {p.vendorName} · {p.vendorEcosystem === "FINDMYBITES" ? "Food" : "Party"}
                      {p.category ? ` · ${p.category}` : ""}
                    </div>
                    <div className="mt-1 sm:hidden">
                      <StockPill stockType={p.stockType} stockCount={p.stockCount} lowStockThreshold={p.lowStockThreshold} />
                    </div>
                  </div>

                  {/* Status */}
                  <div><StatusBadge status={p.status} /></div>

                  {/* Stock (desktop) */}
                  <div className="hidden sm:block">
                    <StockPill stockType={p.stockType} stockCount={p.stockCount} lowStockThreshold={p.lowStockThreshold} />
                  </div>

                  {/* Views */}
                  <div className="hidden text-sm sm:block">{p.views.toLocaleString()}</div>

                  {/* Revenue */}
                  <div className="hidden text-sm font-medium sm:block">₹{((p.salesRevenue || 0) / 100).toLocaleString()}</div>

                  {/* Admin actions */}
                  <div className="flex items-center justify-end gap-3">
                    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground" title="Feature product">
                      <Switch
                        checked={!!p.isFeatured || !!p.featured}
                        disabled={updating[p.id]}
                        onCheckedChange={(c) => updateProduct(p.id, { isFeatured: c, featured: c }, c ? "Featured" : "Unfeatured")}
                      />
                      <Star className={cn("h-3.5 w-3.5", (p.isFeatured || p.featured) ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground" title="Force hide (admin override)">
                      <Switch
                        checked={!!p.forceHidden}
                        disabled={updating[p.id]}
                        onCheckedChange={(c) => updateProduct(p.id, { forceHidden: c }, c ? "Product force-hidden" : "Product restored")}
                      />
                      {p.forceHidden ? <EyeOff className="h-3.5 w-3.5 text-red-500" /> : <Eye className="h-3.5 w-3.5 text-emerald-500" />}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

function StatBox({
  label, value, icon, tone = "neutral",
}: {
  label: string; value: number; icon: React.ReactNode; tone?: "neutral" | "danger" | "warning" | "info" | "muted";
}) {
  const cls = tone === "danger" ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
    : tone === "warning" ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
    : tone === "info" ? "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
    : tone === "muted" ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400"
    : "bg-primary/10 text-primary";
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", cls)}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value.toLocaleString()}</div>
    </div>
  );
}
