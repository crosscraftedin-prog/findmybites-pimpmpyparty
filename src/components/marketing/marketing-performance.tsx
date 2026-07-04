"use client";

import * as React from "react";
import { TrendingUp, Loader2, Eye, MessageSquare, ShoppingCart, IndianRupee, Package, MapPin } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { fmtNum, fmtMoney } from "./marketing-helpers";

interface Series { dateKey: string; profileViews: number; productViews: number; enquiries: number; bookings: number; revenue: number; }
interface TopProduct { productId: string; name: string; views: number; bookings: number; revenue: number; }
interface CompetitorData { you: { rating: number; products: number; responseRate: number; profileCompleteness: number; popularity: number }; peerAverage: { rating: number; products: number; responseRate: number; profileCompleteness: number; popularity: number }; }

const CHART_COLORS = ["#D85A30", "#7c3aed", "#059669", "#f59e0b", "#3b82f6"];

export function PerformanceAnalytics() {
  const [series, setSeries] = React.useState<Series[]>([]);
  const [topProducts, setTopProducts] = React.useState<TopProduct[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/vendor/marketing/analytics?days=30")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) { setSeries(d.series || []); setTopProducts(d.topProducts || []); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  const chartData = series.map((s) => ({
    date: s.dateKey.slice(5),
    Views: s.profileViews + s.productViews,
    Enquiries: s.enquiries,
    Bookings: s.bookings,
    Revenue: s.revenue,
  }));

  const totalViews = series.reduce((s, r) => s + r.profileViews + r.productViews, 0);
  const totalEnquiries = series.reduce((s, r) => s + r.enquiries, 0);
  const totalBookings = series.reduce((s, r) => s + r.bookings, 0);
  const totalRevenue = series.reduce((s, r) => s + r.revenue, 0);

  return (
    <div className="space-y-4">
      {/* Totals */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <TotalCard label="Total Views" value={fmtNum(totalViews)} icon={<Eye className="h-4 w-4" />} />
        <TotalCard label="Enquiries" value={fmtNum(totalEnquiries)} icon={<MessageSquare className="h-4 w-4" />} />
        <TotalCard label="Bookings" value={fmtNum(totalBookings)} icon={<ShoppingCart className="h-4 w-4" />} />
        <TotalCard label="Revenue" value={fmtMoney(totalRevenue)} icon={<IndianRupee className="h-4 w-4" />} />
      </div>

      {/* Views + Enquiries chart */}
      <ChartCard title="Views & Enquiries (30 days)" icon={<TrendingUp className="h-4 w-4" />}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D85A30" stopOpacity={0.3} /><stop offset="95%" stopColor="#D85A30" stopOpacity={0} /></linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} /><stop offset="95%" stopColor="#7c3aed" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="Views" stroke="#D85A30" fill="url(#g1)" strokeWidth={2} />
            <Area type="monotone" dataKey="Enquiries" stroke="#7c3aed" fill="url(#g2)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Bookings bar chart */}
        <ChartCard title="Daily Bookings" icon={<ShoppingCart className="h-4 w-4" />}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="Bookings" fill="#059669" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Revenue */}
        <ChartCard title="Daily Revenue" icon={<IndianRupee className="h-4 w-4" />}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtNum(v)} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: any) => fmtMoney(v)} />
              <Bar dataKey="Revenue" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top products */}
      <ChartCard title="Top Products" icon={<Package className="h-4 w-4" />}>
        {topProducts.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProducts.map((p) => ({ name: p.name.length > 10 ? p.name.slice(0, 9) + "…" : p.name, Views: p.views, Bookings: p.bookings }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="Views" fill="#D85A30" radius={[0, 3, 3, 0]} />
              <Bar dataKey="Bookings" fill="#059669" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Conversion funnel */}
      <ChartCard title="Conversion Funnel" icon={<TrendingUp className="h-4 w-4" />}>
        <div className="space-y-2">
          {[
            { label: "Profile Views", value: totalViews, pct: 100, color: "bg-blue-500" },
            { label: "Enquiries", value: totalEnquiries, pct: totalViews ? (totalEnquiries / totalViews) * 100 : 0, color: "bg-violet-500" },
            { label: "Bookings", value: totalBookings, pct: totalViews ? (totalBookings / totalViews) * 100 : 0, color: "bg-emerald-500" },
          ].map((s) => (
            <div key={s.label}>
              <div className="flex justify-between text-xs"><span>{s.label}</span><span className="font-medium">{fmtNum(s.value)} ({s.pct.toFixed(1)}%)</span></div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-muted">
                <div className={`h-full ${s.color}`} style={{ width: `${Math.max(2, s.pct)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

function TotalCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase text-muted-foreground">{label}</span>
        <span className="flex h-6 w-6 items-center justify-center rounded bg-muted">{icon}</span>
      </div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">{icon}{title}</h4>
      {children}
    </div>
  );
}

function Empty() { return <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">No data yet</div>; }
