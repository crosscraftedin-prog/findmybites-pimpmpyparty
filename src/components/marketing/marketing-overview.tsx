"use client";

import * as React from "react";
import {
  TrendingUp, TrendingDown, Star, Sparkles, Loader2, RefreshCw,
  AlertCircle, Lightbulb, ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fmtNum, fmtMoney, fmtPct } from "./marketing-helpers";
import type { MarketingTab } from "./marketing-center";
import type { Vendor } from "@/lib/types";

interface Kpis {
  profileViews: number; productViews: number; enquiries: number;
  bookings: number; revenue: number; followers: number; wishlistAdds: number;
  conversionRate: number;
}

interface OverviewData {
  growth: { score: number; stars: number; breakdown: Record<string, number>; weakAreas: string[] } | null;
  kpis: { current: Kpis; previous: Kpis; delta: Record<string, number> };
  recommendations: { title: string; detail: string; priority: string; action: string }[];
}

interface MarketingOverviewProps {
  vendor: Vendor;
  onNavigate: (tab: MarketingTab) => void;
}

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
] as const;

const KPI_DEFS: { key: keyof Kpis; label: string; icon: React.ElementType; fmt: (n: number) => string }[] = [
  { key: "profileViews", label: "Profile Views", icon: TrendingUp, fmt: fmtNum },
  { key: "productViews", label: "Product Views", icon: TrendingUp, fmt: fmtNum },
  { key: "enquiries", label: "Enquiries", icon: AlertCircle, fmt: (n) => String(n) },
  { key: "bookings", label: "Bookings", icon: Star, fmt: (n) => String(n) },
  { key: "conversionRate", label: "Conversion", icon: TrendingUp, fmt: (n) => `${n.toFixed(1)}%` },
  { key: "revenue", label: "Revenue", icon: TrendingUp, fmt: fmtMoney },
  { key: "followers", label: "Followers", icon: TrendingUp, fmt: (n) => String(n) },
  { key: "wishlistAdds", label: "Wishlist Adds", icon: TrendingUp, fmt: (n) => String(n) },
];

const BREAKDOWN_LABELS: Record<string, string> = {
  profileComplete: "Profile Complete",
  products: "Products",
  seo: "SEO",
  photos: "Photos",
  responseRate: "Response Rate",
  reviews: "Reviews",
  subscription: "Subscription",
};

export function MarketingOverview({ vendor, onNavigate }: MarketingOverviewProps) {
  const [period, setPeriod] = React.useState<(typeof PERIODS)[number]["value"]>("week");
  const [data, setData] = React.useState<OverviewData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [advisorLoading, setAdvisorLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [growthRes, analyticsRes] = await Promise.all([
        fetch("/api/vendor/marketing/growth"),
        fetch(`/api/vendor/marketing/analytics?period=${period}`),
      ]);
      const growth = growthRes.ok ? await growthRes.json() : null;
      const analytics = analyticsRes.ok ? await analyticsRes.json() : null;
      setData({
        growth: growth?.score != null ? growth : null,
        kpis: analytics?.kpis || { current: emptyKpis(), previous: emptyKpis(), delta: {} as any },
        recommendations: [],
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [period]);

  React.useEffect(() => { load(); }, [load]);

  const loadAdvisor = async () => {
    setAdvisorLoading(true);
    try {
      const res = await fetch("/api/vendor/marketing/ai/advisor", { method: "POST" });
      const json = await res.json();
      if (json.recommendations) {
        setData((d) => d ? { ...d, recommendations: json.recommendations } : d);
      }
    } catch {
      toast.error("Failed to load recommendations");
    } finally {
      setAdvisorLoading(false);
    }
  };

  React.useEffect(() => { if (!loading && data && data.recommendations.length === 0) loadAdvisor(); }, [loading]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const k = data?.kpis;
  const g = data?.growth;

  return (
    <div className="space-y-6">
      {/* Growth Score + Period selector */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GrowthScoreCard score={g ?? null} onRefresh={() => fetch("/api/vendor/marketing/growth", { method: "POST" }).then(load)} />

        <div className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Performance KPIs</h2>
            <div className="flex gap-1 rounded-lg border p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-medium transition",
                    period === p.value ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {KPI_DEFS.map((def, i) => {
              const val = k?.current[def.key] ?? 0;
              const delta = k?.delta?.[def.key];
              const up = (delta ?? 0) >= 0;
              return (
                <motion.div
                  key={def.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border bg-card p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium uppercase text-muted-foreground">{def.label}</span>
                  </div>
                  <div className="mt-1 text-xl font-bold tracking-tight">{def.fmt(val)}</div>
                  {delta !== undefined && (
                    <div className={cn("mt-0.5 flex items-center gap-0.5 text-[10px] font-medium", up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {fmtPct(delta)}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Growth Advisor */}
      <div className="rounded-xl border">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> AI Growth Advisor
          </h3>
          <Button variant="ghost" size="sm" onClick={loadAdvisor} disabled={advisorLoading}>
            {advisorLoading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1 h-3.5 w-3.5" />}
            Refresh
          </Button>
        </div>
        <div className="divide-y">
          {advisorLoading && data?.recommendations.length === 0 ? (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your profile…
            </div>
          ) : data?.recommendations.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No recommendations right now — your profile looks great!</div>
          ) : (
            data?.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <span className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  r.priority === "high" ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                  : r.priority === "medium" ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                  : "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                )}>
                  <Lightbulb className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.title}</span>
                    <Badge variant="outline" className="text-[9px] capitalize">{r.priority}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.detail}</p>
                  <p className="mt-0.5 text-xs font-medium text-primary">{r.action}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { tab: "seo" as const, label: "Improve SEO", icon: Sparkles },
          { tab: "social" as const, label: "Create Post", icon: Sparkles },
          { tab: "campaigns" as const, label: "New Campaign", icon: Sparkles },
          { tab: "reviews" as const, label: "Get Reviews", icon: Star },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.tab}
              onClick={() => onNavigate(a.tab)}
              className="flex items-center gap-2 rounded-xl border bg-card p-3 text-left text-sm font-medium transition hover:bg-accent"
            >
              <Icon className="h-4 w-4 text-primary" />
              {a.label}
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GrowthScoreCard({ score, onRefresh }: { score: OverviewData["growth"]; onRefresh: () => void }) {
  const s = score?.score ?? 0;
  const stars = score?.stars ?? 0;
  const breakdown = score?.breakdown || {};
  return (
    <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Growth Score</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="text-4xl font-extrabold">{s}<span className="text-lg text-muted-foreground">/100</span></div>
        <div className="flex">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className={cn("h-4 w-4", i <= Math.round(stars) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
          ))}
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {Object.entries(BREAKDOWN_LABELS).map(([key, label]) => {
          const val = breakdown[key] ?? 0;
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
              <Progress value={val} className="h-1.5 flex-1" />
              <span className="w-8 text-right font-medium">{val}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function emptyKpis(): Kpis {
  return { profileViews: 0, productViews: 0, enquiries: 0, bookings: 0, revenue: 0, followers: 0, wishlistAdds: 0, conversionRate: 0 };
}
