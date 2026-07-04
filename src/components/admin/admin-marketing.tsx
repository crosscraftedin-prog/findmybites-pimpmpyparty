"use client";

import * as React from "react";
import {
  BarChart3, Users, TrendingUp, TrendingDown, Megaphone, Sparkles,
  MapPin, Tag, Gift, IndianRupee, Loader2, Crown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { fmtMoney } from "@/components/marketing/marketing-helpers";

interface AdminStats {
  mostActiveVendors: { vendorId: string; name: string; profileViews: number; bookings: number }[];
  leastActiveVendors: { vendorId: string; name: string; profileViews: number; bookings: number }[];
  campaignUsage: { type: string; count: number }[];
  aiUsage: { feature: string; count: number; tokens: number }[];
  topCities: { city: string; vendors: number; profileViews: number }[];
  topCategories: { category: string; vendors: number; profileViews: number }[];
  referralGrowth: { total: number; activated: number; credits: number };
  revenueByPlan: { plan: string; vendors: number; revenue: number }[];
}

export function AdminMarketing() {
  const [data, setData] = React.useState<AdminStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/admin/marketing")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setData(d))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!data) return <div className="p-4 text-sm text-muted-foreground">Unable to load marketing analytics.</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold"><BarChart3 className="h-5 w-5" /> Marketing Analytics</h2>
        <p className="text-sm text-muted-foreground">Platform-wide marketing activity, AI usage, and revenue by plan.</p>
      </div>

      {/* Top row: revenue + referral + AI usage summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Campaigns" value={data.campaignUsage.reduce((s, c) => s + c.count, 0)} icon={<Megaphone className="h-4 w-4" />} />
        <StatCard label="AI Generations" value={data.aiUsage.reduce((s, a) => s + a.count, 0)} icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Referrals Activated" value={`${data.referralGrowth.activated}/${data.referralGrowth.total}`} icon={<Gift className="h-4 w-4" />} />
        <StatCard label="Credits Earned" value={data.referralGrowth.credits} icon={<Crown className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Most active vendors */}
        <Panel title="Most Active Vendors" icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}>
          {data.mostActiveVendors.length === 0 ? <Empty /> : (
            <div className="divide-y">
              {data.mostActiveVendors.map((v, i) => (
                <div key={v.vendorId} className="flex items-center gap-3 p-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">{i + 1}</span>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{v.name}</div><div className="text-[10px] text-muted-foreground">{v.bookings} bookings</div></div>
                  <span className="text-sm font-semibold">{v.profileViews.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Least active vendors */}
        <Panel title="Least Active Vendors" icon={<TrendingDown className="h-4 w-4 text-red-500" />}>
          {data.leastActiveVendors.length === 0 ? <Empty /> : (
            <div className="divide-y">
              {data.leastActiveVendors.map((v) => (
                <div key={v.vendorId} className="flex items-center gap-3 p-2.5">
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{v.name}</div><div className="text-[10px] text-muted-foreground">{v.bookings} bookings</div></div>
                  <span className="text-sm font-semibold text-muted-foreground">{v.profileViews.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Campaign usage */}
        <Panel title="Campaign Usage" icon={<Megaphone className="h-4 w-4" />}>
          {data.campaignUsage.length === 0 ? <Empty /> : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.campaignUsage.map((c) => ({ name: c.type.replace("_", " "), count: c.count }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#D85A30" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        {/* AI usage */}
        <Panel title="AI Usage by Feature" icon={<Sparkles className="h-4 w-4" />}>
          {data.aiUsage.length === 0 ? <Empty /> : (
            <div className="space-y-2 p-2">
              {data.aiUsage.map((a) => (
                <div key={a.feature} className="flex items-center justify-between text-xs">
                  <span className="capitalize">{a.feature.replace(/_/g, " ")}</span>
                  <div className="flex gap-3">
                    <Badge variant="outline" className="text-[10px]">{a.count} calls</Badge>
                    <span className="text-muted-foreground">{a.tokens.toLocaleString()} tokens</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top cities */}
        <Panel title="Top Cities" icon={<MapPin className="h-4 w-4" />}>
          {data.topCities.length === 0 ? <Empty /> : (
            <div className="divide-y">
              {data.topCities.map((c) => (
                <div key={c.city} className="flex items-center justify-between p-2.5 text-xs">
                  <span className="font-medium">{c.city}</span>
                  <div className="flex gap-3 text-muted-foreground">
                    <span>{c.vendors} vendors</span><span className="font-semibold text-foreground">{c.profileViews.toLocaleString()} views</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Top categories */}
        <Panel title="Top Categories" icon={<Tag className="h-4 w-4" />}>
          {data.topCategories.length === 0 ? <Empty /> : (
            <div className="divide-y">
              {data.topCategories.map((c) => (
                <div key={c.category} className="flex items-center justify-between p-2.5 text-xs">
                  <span className="font-medium capitalize">{c.category.replace(/_/g, " ")}</span>
                  <div className="flex gap-3 text-muted-foreground">
                    <span>{c.vendors} vendors</span><span className="font-semibold text-foreground">{c.profileViews.toLocaleString()} views</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Revenue by plan */}
      <Panel title="Revenue by Plan" icon={<IndianRupee className="h-4 w-4" />}>
        {data.revenueByPlan.length === 0 ? <Empty /> : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {data.revenueByPlan.map((p) => (
              <div key={p.plan} className="rounded-lg border p-3">
                <div className="text-[10px] uppercase text-muted-foreground">{p.plan}</div>
                <div className="text-xl font-bold">{fmtMoney(p.revenue)}</div>
                <div className="text-[10px] text-muted-foreground">{p.vendors} active vendors</div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase text-muted-foreground">{label}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">{icon}</span>
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b p-3"><h4 className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</h4></div>
      <ScrollArea className="max-h-72">{children}</ScrollArea>
    </div>
  );
}

function Empty() { return <div className="p-6 text-center text-sm text-muted-foreground">No data</div>; }
