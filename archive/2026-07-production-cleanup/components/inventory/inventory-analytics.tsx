/**
 * Archived on 2026-07-14
 * Reason:
 * No verified runtime references found.
 * Preserved for future features.
 *
 * DO NOT IMPORT FROM THIS DIRECTORY.
 */

"use client";

import * as React from "react";
import {
  Eye, MessageSquare, ShoppingCart, IndianRupee, TrendingUp, Package,
  AlertTriangle, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

interface AnalyticsData {
  products: {
    productId: string; productName: string; views: number; enquiries: number;
    bookings: number; revenue: number; conversionRate: number;
    stockRemaining: number | null; status: string;
  }[];
  totals: { views: number; enquiries: number; bookings: number; revenue: number; conversionRate: number };
  topProducts: AnalyticsData["products"];
  lowInventory: AnalyticsData["products"];
}

/**
 * Vendor inventory analytics: views, enquiries, bookings, conversion rate,
 * revenue, top products, and low-inventory list.
 */
export function InventoryAnalytics({ onManageProduct }: { onManageProduct?: (id: string, name: string) => void }) {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/vendor/inventory/analytics?days=30")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) return <div className="p-4 text-sm text-muted-foreground">Unable to load analytics.</div>;

  const chartData = data.topProducts.map((p) => ({
    name: p.productName.length > 12 ? p.productName.slice(0, 11) + "…" : p.productName,
    Views: p.views,
    Enquiries: p.enquiries,
    Bookings: p.bookings,
  }));

  return (
    <div className="space-y-4">
      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={<Eye className="h-4 w-4" />} label="Views" value={data.totals.views.toLocaleString()} />
        <StatCard icon={<MessageSquare className="h-4 w-4" />} label="Enquiries" value={data.totals.enquiries.toLocaleString()} />
        <StatCard icon={<ShoppingCart className="h-4 w-4" />} label="Bookings" value={data.totals.bookings.toLocaleString()} />
        <StatCard icon={<IndianRupee className="h-4 w-4" />} label="Revenue" value={`₹${(data.totals.revenue / 100).toLocaleString()}`} />
      </div>

      {/* Conversion banner */}
      <div className="flex items-center gap-3 rounded-xl border bg-gradient-to-r from-primary/5 to-transparent p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <TrendingUp className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <div className="text-sm font-medium">Conversion rate</div>
          <div className="text-[11px] text-muted-foreground">Bookings ÷ Views over the last 30 days</div>
        </div>
        <div className="text-2xl font-bold">{data.totals.conversionRate.toFixed(1)}%</div>
      </div>

      {/* Top products chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Package className="h-4 w-4" /> Top Products (by views)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="Views" fill="#D85A30" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Enquiries" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Bookings" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top by revenue */}
        <div className="rounded-xl border">
          <div className="border-b p-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <IndianRupee className="h-4 w-4" /> Top by Revenue
            </h3>
          </div>
          <ScrollArea className="max-h-72">
            <div className="divide-y">
              {data.topProducts.length === 0 ? (
                <EmptyRow label="No revenue yet" />
              ) : data.topProducts.map((p, i) => (
                <ProductRow key={p.productId} rank={i + 1} product={p} onManage={onManageProduct} />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Low inventory */}
        <div className="rounded-xl border">
          <div className="border-b p-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Low Inventory
            </h3>
          </div>
          <ScrollArea className="max-h-72">
            <div className="divide-y">
              {data.lowInventory.length === 0 ? (
                <EmptyRow label="Everything well-stocked" />
              ) : data.lowInventory.map((p) => (
                <ProductRow key={p.productId} product={p} onManage={onManageProduct} lowStock />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Full product table */}
      <div className="rounded-xl border">
        <div className="border-b p-3">
          <h3 className="text-sm font-semibold">All Products</h3>
        </div>
        <ScrollArea className="max-h-96">
          <div className="divide-y">
            {data.products.map((p) => (
              <button
                key={p.productId}
                onClick={() => onManageProduct?.(p.productId, p.productName)}
                className="grid w-full grid-cols-[1fr_auto] items-center gap-2 p-3 text-left transition hover:bg-accent sm:grid-cols-[1fr_70px_70px_70px_90px_90px]"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{p.productName}</div>
                  <StatusBadge status={p.status} className="mt-0.5" />
                </div>
                <Cell label="Views" value={String(p.views)} />
                <Cell label="Enquiries" value={String(p.enquiries)} />
                <Cell label="Bookings" value={String(p.bookings)} />
                <Cell label="Conv." value={`${p.conversionRate.toFixed(1)}%`} />
                <Cell label="Stock" value={p.stockRemaining === null ? "∞" : String(p.stockRemaining)} />
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function ProductRow({
  product, rank, onManage, lowStock,
}: {
  product: AnalyticsData["products"][number]; rank?: number; onManage?: (id: string, name: string) => void; lowStock?: boolean;
}) {
  return (
    <button
      onClick={() => onManage?.(product.productId, product.productName)}
      className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-accent"
    >
      {rank && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{rank}</span>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{product.productName}</div>
        {lowStock && product.stockRemaining !== null && (
          <div className="text-[11px] text-amber-600 dark:text-amber-400">{product.stockRemaining} left</div>
        )}
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold">₹{(product.revenue / 100).toLocaleString()}</div>
        <div className="text-[11px] text-muted-foreground">{product.bookings} bookings</div>
      </div>
    </button>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="hidden text-right sm:block">
      <div className="text-sm font-medium">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <div className="p-6 text-center text-sm text-muted-foreground">{label}</div>;
}
