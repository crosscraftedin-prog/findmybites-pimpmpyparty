"use client";

import * as React from "react";
import { Users, Loader2, TrendingUp, TrendingDown, Lightbulb, Star, Package, Clock, Eye, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CompetitorData {
  you: { rating: number; products: number; responseRate: number; profileCompleteness: number; popularity: number };
  peerAverage: { rating: number; products: number; responseRate: number; profileCompleteness: number; popularity: number };
  suggestions: string[];
}

export function CompetitorInsights() {
  const [data, setData] = React.useState<CompetitorData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/vendor/marketing/analytics")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.competitors && setData(d.competitors))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!data) return <div className="p-4 text-sm text-muted-foreground">Unable to load competitor insights.</div>;

  const metrics: { key: keyof CompetitorData["you"]; label: string; icon: React.ElementType; fmt: (n: number) => string }[] = [
    { key: "rating", label: "Average Rating", icon: Star, fmt: (n) => n.toFixed(1) },
    { key: "products", label: "Products", icon: Package, fmt: (n) => String(Math.round(n)) },
    { key: "responseRate", label: "Response Rate", icon: Clock, fmt: (n) => `${Math.round(n)}%` },
    { key: "profileCompleteness", label: "Profile Completeness", icon: CheckCircle2, fmt: (n) => `${Math.round(n)}%` },
    { key: "popularity", label: "Profile Views", icon: Eye, fmt: (n) => n.toLocaleString() },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" /> How You Compare</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Benchmarked against similar vendors in your category.</p>
      </div>

      {/* Comparison bars */}
      <div className="space-y-3">
        {metrics.map((m) => {
          const you = data.you[m.key];
          const peer = data.peerAverage[m.key];
          const better = you >= peer;
          const Icon = m.icon;
          // Normalize to 0-100 for the bar
          const max = Math.max(you, peer, 1);
          const youPct = (you / max) * 100;
          const peerPct = (peer / max) * 100;
          return (
            <div key={m.key} className="rounded-xl border bg-card p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium"><Icon className="h-4 w-4 text-muted-foreground" />{m.label}</span>
                <span className={cn("flex items-center gap-1 text-xs font-medium", better ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                  {better ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {better ? "Above" : "Below"} average
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-12 text-[10px] text-muted-foreground">You</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${youPct}%` }} />
                  </div>
                  <span className="w-14 text-right text-xs font-medium">{m.fmt(you)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 text-[10px] text-muted-foreground">Peers</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-muted-foreground/40" style={{ width: `${peerPct}%` }} />
                  </div>
                  <span className="w-14 text-right text-xs font-medium text-muted-foreground">{m.fmt(peer)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestions */}
      {data.suggestions.length > 0 && (
        <div className="rounded-xl border bg-amber-50 p-4 dark:bg-amber-950/20">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
            <Lightbulb className="h-4 w-4" /> Suggestions to Improve Your Ranking
          </h4>
          <ul className="space-y-1.5 text-xs text-amber-800 dark:text-amber-200">
            {data.suggestions.map((s, i) => <li key={i} className="flex gap-1.5"><span>•</span><span>{s}</span></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
