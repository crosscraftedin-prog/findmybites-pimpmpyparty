"use client";

import * as React from "react";
import {
  Eye,
  Users,
  MessageSquare,
  MousePointerClick,
  Lightbulb,
  TrendingUp,
  Loader2,
  Phone,
  Globe,
  Share2,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Vendor } from "@/lib/types";

type DateRange = "7d" | "30d" | "90d" | "all";

interface AnalyticsData {
  totalEvents: number;
  uniqueVisitors: number;
  byType: Record<string, number>;
  productViews: Record<string, number>;
  dailyViews: Record<string, number>;
  days: number;
}

export function Analytics({ vendor }: { vendor: Vendor }) {
  const [range, setRange] = React.useState<DateRange>("30d");
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const daysMap: Record<DateRange, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    all: 365,
  };

  React.useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/track?vendorId=${vendor.id}&days=${daysMap[range]}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, [vendor.id, range]);

  const pageViews = data?.byType?.page_view ?? 0;
  const uniqueVisitors = data?.uniqueVisitors ?? 0;
  const contactClicks =
    (data?.byType?.contact_click ?? 0) +
    (data?.byType?.whatsapp_click ?? 0) +
    (data?.byType?.phone_click ?? 0) +
    (data?.byType?.website_click ?? 0);
  const productViews = data?.byType?.product_view ?? data?.byType?.service_view ?? 0;

  // Build chart data from dailyViews
  const dailyEntries = data?.dailyViews
    ? Object.entries(data.dailyViews).sort(([a], [b]) => a.localeCompare(b))
    : [];
  const maxDaily = Math.max(...dailyEntries.map(([, v]) => v), 1);

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <h1 className="mb-4 text-2xl font-extrabold tracking-tight">Your Performance</h1>

      {/* Date range selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {([
          { id: "7d" as DateRange, label: "Last 7 days" },
          { id: "30d" as DateRange, label: "Last 30 days" },
          { id: "90d" as DateRange, label: "Last 3 months" },
          { id: "all" as DateRange, label: "All time" },
        ]).map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              range === r.id
                ? "bg-brand text-brand-foreground"
                : "border border-border bg-background text-muted-foreground hover:bg-accent"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Row 1: Stat cards */}
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={Eye} label="Profile Views" value={pageViews} />
            <StatCard icon={Users} label="Unique Visitors" value={uniqueVisitors} />
            <StatCard icon={MousePointerClick} label="Contact Clicks" value={contactClicks} />
            <StatCard icon={TrendingUp} label="Product Views" value={productViews} />
          </div>

          {/* Row 2: Charts */}
          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            {/* Views over time chart */}
            <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
              <h2 className="mb-4 text-base font-bold">Profile views over time</h2>
              {dailyEntries.length > 0 ? (
                <div className="flex h-48 items-end justify-between gap-1">
                  {dailyEntries.slice(-30).map(([day, count]) => (
                    <div
                      key={day}
                      className="group relative flex-1 rounded-t bg-brand/20 transition-colors hover:bg-brand/40"
                      style={{ height: `${(count / maxDaily) * 100}%`, minHeight: "4px" }}
                      title={`${day}: ${count} views`}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  No view data yet — your storefront is live and ready for visitors.
                </div>
              )}
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Last {dailyEntries.length > 0 ? Math.min(30, dailyEntries.length) : 14} days
              </p>
            </div>

            {/* Click breakdown */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-base font-bold">Customer actions</h2>
              <div className="space-y-3">
                <ClickRow icon={MessageCircle} label="WhatsApp" count={data?.byType?.whatsapp_click ?? 0} color="bg-[#25D366]" />
                <ClickRow icon={Globe} label="Website" count={data?.byType?.website_click ?? 0} color="bg-blue-400" />
                <ClickRow icon={Phone} label="Phone/Contact" count={data?.byType?.contact_click ?? 0} color="bg-brand" />
                <ClickRow icon={Share2} label="Share" count={data?.byType?.share_click ?? 0} color="bg-amber-400" />
              </div>
            </div>
          </div>

          {/* Row 3: Top products */}
          {Object.keys(data?.productViews ?? {}).length > 0 && (
            <div className="mb-6 rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-base font-bold">Most viewed products</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 font-semibold">Product ID</th>
                      <th className="pb-2 font-semibold">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data?.productViews ?? {})
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([pid, count]) => (
                        <tr key={pid} className="border-b border-border/50">
                          <td className="py-2 pr-4 font-mono text-xs">{pid}</td>
                          <td className="py-2 tabular-nums">{count}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Row 4: Insights */}
          <div className="rounded-xl border border-brand-border bg-brand-soft p-5">
            <div className="flex items-start gap-3">
              <Lightbulb className="size-5 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-semibold text-brand-soft-foreground">
                  Josh&apos;s tip
                </p>
                <p className="mt-1 text-sm text-foreground/80">
                  {pageViews === 0
                    ? "Your storefront is live! Share your profile link on social media to get your first visitors."
                    : uniqueVisitors < 10
                      ? "You're getting views! Add more product photos and update your gallery to boost engagement."
                      : `Great progress! You've had ${uniqueVisitors} unique visitors. Vendors with 5+ products get 2x more enquiries.`}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="size-5 text-muted-foreground" />
      <p className="mt-2 text-2xl font-extrabold tabular-nums">{value.toLocaleString()}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

function ClickRow({
  icon: Icon,
  label,
  count,
  color,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={cn("size-2.5 rounded-full", color)} />
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </span>
      </div>
      <span className="text-sm font-bold tabular-nums">{count}</span>
    </div>
  );
}
