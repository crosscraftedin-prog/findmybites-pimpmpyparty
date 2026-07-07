"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, Search, Heart, Megaphone, Package, Star, TrendingUp, TrendingDown,
  CheckCircle2, AlertTriangle, ArrowRight, Loader2, Target, Trophy,
  Users, DollarSign, MessageSquare, Eye, ShoppingCart, Crown, Sparkles,
  BarChart3, Clock, Zap, Rocket,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Vendor } from "@/lib/types";

// ── Types (mirrors server types) ─────────────────────────────────────────────
interface ScoreCard { key: string; label: string; score: number; trend: string; trendValue: number; recommendation: string; icon: string; }
interface ChecklistItem { id: string; label: string; done: boolean; tab?: string; }
interface GrowthRecommendation { id: string; title: string; detail: string; priority: string; expectedImpact: string; rankingIncrease: string; fixAction: string; fixTab: string; }
interface PerformanceMetric { label: string; value: number; unit: string; trend: number; }
interface CompetitorComparison { metric: string; you: number | string; peerAverage: number | string; unit: string; suggestion?: string; }
interface SuccessData {
  scores: ScoreCard[]; overallHealth: number;
  checklist: { items: ChecklistItem[]; completed: number; total: number };
  recommendations: GrowthRecommendation[];
  performance: { daily: PerformanceMetric[]; weekly: PerformanceMetric[]; monthly: PerformanceMetric[]; yearly: PerformanceMetric[] };
  competitors: CompetitorComparison[];
  reviews: { averageRating: number; totalReviews: number; recentReviews: { id: string; author: string; rating: number; comment: string; createdAt: string }[]; pendingRequests: number };
  customers: { totalCustomers: number; repeatCustomers: number; recentCustomers: { name: string; date: string; eventType: string }[]; avgOrderValue: number };
  financial: { totalRevenue: number; pendingPayments: number; completedOrders: number; cancelledOrders: number; avgOrderValue: number; monthlyRevenue: number };
  goals: { id: string; label: string; current: number; target: number; unit: string; progress: number }[];
  achievements: { id: string; label: string; icon: string; earned: boolean }[];
  series: { dateKey: string; profileViews: number; productViews: number; bookings: number; revenue: number }[];
  topProducts: { productId: string; name: string; views: number; bookings: number; revenue: number }[];
}

const ICON_MAP: Record<string, React.ElementType> = { Store, Search, Heart, Megaphone, Package, Star };

interface SuccessCenterProps {
  vendor: Vendor;
  onNavigate: (tab: string) => void;
}

export function SuccessCenter({ vendor, onNavigate }: SuccessCenterProps) {
  const [data, setData] = React.useState<SuccessData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [period, setPeriod] = React.useState<"daily" | "weekly" | "monthly" | "yearly">("weekly");

  React.useEffect(() => {
    fetch("/api/vendor/success-center")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          // Defensive: ensure all required nested fields exist to prevent
          // "Cannot read properties of undefined (reading 'map')" crashes
          const safe: SuccessData = {
            scores: d.scores ?? [],
            overallHealth: d.overallHealth ?? 0,
            checklist: d.checklist ?? { items: [], completed: 0, total: 0 },
            recommendations: d.recommendations ?? [],
            performance: d.performance ?? { daily: [], weekly: [], monthly: [], yearly: [] },
            competitors: d.competitors ?? [],
            reviews: d.reviews ?? { averageRating: 0, totalReviews: 0, recentReviews: [], pendingRequests: 0 },
            customers: d.customers ?? { totalCustomers: 0, repeatCustomers: 0, recentCustomers: [], avgOrderValue: 0 },
            financial: d.financial ?? { totalRevenue: 0, pendingPayments: 0, completedOrders: 0, cancelledOrders: 0, avgOrderValue: 0, monthlyRevenue: 0 },
            goals: d.goals ?? [],
            achievements: d.achievements ?? [],
            series: d.series ?? [],
            topProducts: d.topProducts ?? [],
          };
          setData(safe);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }
  if (!data) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Unable to load your success dashboard. Please try again.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Success Center</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Your daily dashboard to grow your business.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border bg-card p-3">
          <span className="text-xs font-medium text-muted-foreground">Business Health</span>
          <span className={cn("text-2xl font-extrabold", data.overallHealth >= 80 ? "text-emerald-600" : data.overallHealth >= 50 ? "text-amber-600" : "text-red-600")}>{data.overallHealth}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      {/* ── Score Cards (7 + overall) ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {data.scores.map((s, i) => {
          const Icon = ICON_MAP[s.icon] || Store;
          return (
            <motion.div key={s.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="rounded-xl border bg-card p-3">
              <div className="flex items-center justify-between">
                <Icon className="size-4 text-muted-foreground" />
                {s.score >= 80 ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : s.score >= 50 ? <AlertTriangle className="size-3.5 text-amber-500" /> : <AlertTriangle className="size-3.5 text-red-500" />}
              </div>
              <p className={cn("mt-1.5 text-2xl font-bold", s.score >= 80 ? "text-emerald-600" : s.score >= 50 ? "text-amber-600" : "text-red-600")}>{s.score}</p>
              <p className="text-[10px] font-medium text-muted-foreground leading-tight">{s.label}</p>
              <p className="mt-1 text-[9px] text-muted-foreground line-clamp-2 leading-tight">{s.recommendation}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* ── Left column ── */}
        <div className="space-y-6">
          {/* Performance Dashboard */}
          <Section title="Performance Dashboard" icon={BarChart3}>
            <div className="mb-3 flex gap-1 rounded-lg border p-1 w-fit">
              {(["daily", "weekly", "monthly", "yearly"] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)} className={cn("rounded-md px-3 py-1 text-xs font-medium capitalize transition", period === p ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>{p}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {data.performance[period].map((m) => (
                <div key={m.label} className="rounded-lg border bg-card p-2.5">
                  <p className="text-[10px] font-medium uppercase text-muted-foreground">{m.label}</p>
                  <p className="mt-0.5 text-lg font-bold">{m.unit === "₹" ? `₹${(m.value / 100).toLocaleString()}` : `${m.value.toLocaleString()}${m.unit}`}</p>
                  {m.trend !== 0 && (
                    <p className={cn("flex items-center gap-0.5 text-[10px] font-medium", m.trend > 0 ? "text-emerald-600" : "text-red-600")}>
                      {m.trend > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {Math.abs(m.trend)}%
                    </p>
                  )}
                </div>
              ))}
            </div>
            {/* Views chart */}
            {data.series.length > 0 && (
              <div className="mt-3 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.series.map((s) => ({ date: s.dateKey.slice(5), Views: s.profileViews + s.productViews, Bookings: s.bookings }))}>
                    <defs>
                      <linearGradient id="sg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D85A30" stopOpacity={0.3} /><stop offset="95%" stopColor="#D85A30" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="Views" stroke="#D85A30" fill="url(#sg1)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Bookings" stroke="#059669" fill="transparent" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Section>

          {/* Competitor Insights */}
          {data.competitors.length > 0 && (
            <Section title="Competitor Insights" icon={Users}>
              <div className="space-y-2">
                {data.competitors.map((c) => {
                  const youNum = typeof c.you === "number" ? c.you : parseFloat(String(c.you)) || 0;
                  const peerNum = typeof c.peerAverage === "number" ? c.peerAverage : parseFloat(String(c.peerAverage)) || 0;
                  const better = youNum >= peerNum;
                  return (
                    <div key={c.metric} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{c.metric}</span>
                        <span className={cn("text-xs font-semibold", better ? "text-emerald-600" : "text-red-600")}>
                          {better ? "Above" : "Below"} average
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded bg-muted/30 p-2">
                          <p className="text-muted-foreground">You</p>
                          <p className={cn("text-lg font-bold", better ? "text-emerald-600" : "text-red-600")}>{c.you} {c.unit}</p>
                        </div>
                        <div className="rounded bg-muted/30 p-2">
                          <p className="text-muted-foreground">Peer Average</p>
                          <p className="text-lg font-bold text-muted-foreground">{c.peerAverage} {c.unit}</p>
                        </div>
                      </div>
                      {c.suggestion && <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">💡 {c.suggestion}</p>}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Review Center + Customer Center + Financial Center */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Review Center */}
            <Section title="Reviews" icon={Star} compact>
              <div className="text-center">
                <p className="text-3xl font-bold">{data.reviews.averageRating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">{data.reviews.totalReviews} reviews</p>
              </div>
              <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                {data.reviews.recentReviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="rounded border p-1.5 text-xs">
                    <div className="flex items-center gap-1"><Star className="size-3 fill-amber-400 text-amber-400" /><span className="font-medium">{r.author}</span></div>
                    <p className="text-muted-foreground line-clamp-1">{r.comment}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => onNavigate("marketing")}>Request Reviews</Button>
            </Section>

            {/* Customer Center */}
            <Section title="Customers" icon={Heart} compact>
              <div className="grid grid-cols-2 gap-1 text-center">
                <div><p className="text-xl font-bold">{data.customers.totalCustomers}</p><p className="text-[10px] text-muted-foreground">Total</p></div>
                <div><p className="text-xl font-bold">{data.customers.repeatCustomers}</p><p className="text-[10px] text-muted-foreground">Repeat</p></div>
              </div>
              <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                {data.customers.recentCustomers.slice(0, 3).map((c, i) => (
                  <div key={i} className="text-xs"><span className="font-medium">{c.name}</span> <span className="text-muted-foreground">· {c.eventType}</span></div>
                ))}
              </div>
            </Section>

            {/* Financial Center */}
            <Section title="Financial" icon={DollarSign} compact>
              <div className="text-center">
                <p className="text-xl font-bold">₹{(data.financial.totalRevenue / 100).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Total Revenue</p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                <div className="text-center"><p className="font-bold">{data.financial.completedOrders}</p><p className="text-[10px] text-muted-foreground">Completed</p></div>
                <div className="text-center"><p className="font-bold text-amber-600">₹{(data.financial.pendingPayments / 100).toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Pending</p></div>
              </div>
            </Section>
          </div>

          {/* Marketing Center quick access */}
          <Section title="Marketing Center" icon={Megaphone}>
            <p className="text-sm text-muted-foreground mb-3">Create offers, coupons, campaigns, social posts & more.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {["Campaigns", "Social Media", "Email", "WhatsApp"].map((m) => (
                <button key={m} onClick={() => onNavigate("marketing")} className="rounded-lg border p-2.5 text-xs font-medium transition-colors hover:bg-accent text-left">
                  <Sparkles className="size-4 text-primary mb-1" />
                  {m}
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">
          {/* Business Checklist */}
          <Section title="Business Checklist" icon={CheckCircle2}>
            <div className="mb-2 flex items-center gap-2">
              <Progress value={(data.checklist.completed / data.checklist.total) * 100} className="h-2 flex-1" />
              <span className="text-xs font-bold">{data.checklist.completed}/{data.checklist.total}</span>
            </div>
            <div className="space-y-1">
              {data.checklist.items.map((item) => (
                <button key={item.id} onClick={() => item.tab && onNavigate(item.tab)} className="flex w-full items-center gap-2 rounded-md p-1 text-left text-xs hover:bg-accent">
                  {item.done ? <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" /> : <div className="size-3.5 shrink-0 rounded-full border-2 border-muted-foreground/30" />}
                  <span className={cn(item.done && "text-muted-foreground line-through")}>{item.label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Growth Recommendations */}
          <Section title="Growth Recommendations" icon={TrendingUp}>
            <div className="space-y-2">
              {data.recommendations.map((r) => (
                <div key={r.id} className="rounded-lg border p-2.5">
                  <div className="flex items-start gap-2">
                    <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      r.priority === "high" ? "bg-red-100 text-red-600 dark:bg-red-950/40" : r.priority === "medium" ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40" : "bg-blue-100 text-blue-600 dark:bg-blue-950/40")}>
                      {r.priority === "high" ? "!" : r.priority === "medium" ? "↑" : "•"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold">{r.title}</p>
                      <p className="text-[10px] text-muted-foreground">{r.detail}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-[9px]">{r.expectedImpact}</Badge>
                        <Badge variant="outline" className="text-[9px] text-emerald-600">{r.rankingIncrease}</Badge>
                      </div>
                      <button onClick={() => onNavigate(r.fixTab)} className="mt-1.5 inline-flex items-center gap-0.5 text-[10px] font-medium text-primary hover:underline">
                        {r.fixAction} <ArrowRight className="size-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Goals */}
          <Section title="Goals" icon={Target}>
            <div className="space-y-2">
              {data.goals.map((g) => (
                <div key={g.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{g.label}</span>
                    <span className="text-muted-foreground">{g.current}/{g.target} {g.unit}</span>
                  </div>
                  <Progress value={g.progress} className="mt-1 h-1.5" />
                </div>
              ))}
            </div>
          </Section>

          {/* Achievements */}
          <Section title="Achievements" icon={Trophy}>
            <div className="grid grid-cols-3 gap-2">
              {data.achievements.map((a) => (
                <div key={a.id} className={cn("flex flex-col items-center gap-1 rounded-lg border p-2 text-center", a.earned ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20" : "opacity-40")}>
                  <span className="text-xl">{a.icon}</span>
                  <span className="text-[9px] font-medium leading-tight">{a.label}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, compact }: { title: string; icon: React.ElementType; children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={cn("rounded-xl border bg-card", compact ? "p-3" : "p-4")}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-primary" /> {title}
      </h3>
      {children}
    </div>
  );
}
