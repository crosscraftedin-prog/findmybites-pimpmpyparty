"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CreditCard, DollarSign, TrendingUp, TrendingDown, Users, AlertTriangle,
  RefreshCw, Download, Search, Filter, Calendar, CheckCircle2, XCircle,
  Clock, Globe, Tag, FileText, Zap, Eye, ChevronRight, Loader2, Edit3,
  Plus, Trash2, Power, RotateCcw, Pause, Play, X, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * AdminBillingDashboard — Complete billing management for the admin panel.
 *
 * Tabs: Overview | Subscriptions | Pricing | Promo Codes | Invoices | Webhook Logs
 *
 * Uses existing APIs:
 *   GET  /api/admin/billing/analytics
 *   GET  /api/admin/billing/pricing
 *   PUT  /api/admin/billing/pricing
 *   GET  /api/admin/billing/promo-codes
 *   POST /api/admin/billing/promo-codes
 *   GET  /api/admin/subscriptions
 */

type Tab = "overview" | "subscriptions" | "pricing" | "promo-codes" | "invoices" | "webhooks";

interface Analytics {
  mrr: number;
  arr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  newThisMonth: number;
  renewalsThisMonth: number;
  churnRate: number;
  failedPayments: number;
  recoveredPayments: number;
  topCountries: { country: string; count: number; revenue: number }[];
  topPlans: { plan: string; count: number; revenue: number }[];
}

interface PricingPlan {
  id: string;
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  plan: string;
  billingCycle: string;
  displayPrice: number;
  amountMinor: number;
  razorpayPlanId: string | null;
  active: boolean;
}

interface PromoCode {
  id: string;
  code: string;
  description: string;
  countryCode: string | null;
  plan: string | null;
  billingCycle: string | null;
  discountType: string;
  discountValue: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
}

export function AdminBillingDashboard() {
  const [tab, setTab] = React.useState<Tab>("overview");

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
    { id: "pricing", label: "Pricing", icon: DollarSign },
    { id: "promo-codes", label: "Promo Codes", icon: Tag },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "webhooks", label: "Webhook Logs", icon: Zap },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border pb-2">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.id ? "bg-brand/10 text-brand" : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="size-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {tab === "overview" && <OverviewTab />}
        {tab === "subscriptions" && <SubscriptionsTab />}
        {tab === "pricing" && <PricingTab />}
        {tab === "promo-codes" && <PromoCodesTab />}
        {tab === "invoices" && <InvoicesTab />}
        {tab === "webhooks" && <WebhooksTab />}
      </motion.div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────

function OverviewTab() {
  const [data, setData] = React.useState<Analytics | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/admin/billing/analytics")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading analytics…</div>;
  if (!data) return <div className="py-8 text-center text-muted-foreground">Failed to load analytics.</div>;

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard icon={DollarSign} label="MRR" value={formatCurrency(data.mrr)} color="text-emerald-600" />
        <MetricCard icon={TrendingUp} label="ARR" value={formatCurrency(data.arr)} color="text-blue-600" />
        <MetricCard icon={Users} label="Active Subs" value={data.activeSubscriptions.toString()} color="text-purple-600" />
        <MetricCard icon={TrendingDown} label="Churn Rate" value={`${data.churnRate}%`} color="text-rose-600" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard icon={Plus} label="New This Month" value={data.newThisMonth.toString()} color="text-emerald-600" />
        <MetricCard icon={RefreshCw} label="Renewals" value={data.renewalsThisMonth.toString()} color="text-blue-600" />
        <MetricCard icon={AlertTriangle} label="Failed Payments" value={data.failedPayments.toString()} color="text-amber-600" />
        <MetricCard icon={CheckCircle2} label="Recovered" value={data.recoveredPayments.toString()} color="text-emerald-600" />
      </div>

      {/* Top Countries */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <Globe className="size-4 text-brand" /> Top Countries
          </h3>
          <div className="space-y-2">
            {data.topCountries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              data.topCountries.map(c => (
                <div key={c.country} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{c.country}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{c.count} subs</span>
                    <span className="font-bold">{formatCurrency(c.revenue)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Plans */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <CreditCard className="size-4 text-brand" /> Plan Distribution
          </h3>
          <div className="space-y-2">
            {data.topPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              data.topPlans.map(p => (
                <div key={p.plan} className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{p.plan}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{p.count} vendors</span>
                    <span className="font-bold">{formatCurrency(p.revenue)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={cn("size-4", color)} />
      </div>
      <p className={cn("mt-1 text-xl font-extrabold", color)}>{value}</p>
    </div>
  );
}

// ── Subscriptions Tab ─────────────────────────────────────────────────────

function SubscriptionsTab() {
  const [subs, setSubs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setSubs(d?.subscriptions || d?.expiringSubs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = subs.filter(s =>
    !search || s.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
    s.planName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by vendor or plan…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading subscriptions…</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">No subscriptions found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Vendor</th>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Plan</th>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Status</th>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Expires</th>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={i} className="border-b border-border/60 hover:bg-muted/20">
                  <td className="p-3 font-medium">{s.vendorName || "Unknown"}</td>
                  <td className="p-3">
                    <Badge variant="secondary" className="capitalize">{s.planName || s.planTier || "—"}</Badge>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {s.planExpiresAt ? new Date(s.planExpiresAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-3 font-medium">
                    {s.amountPaid ? `${s.currency || "₹"}${(s.amountPaid / 100).toFixed(0)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    expired: "bg-rose-100 text-rose-700",
    cancelled: "bg-amber-100 text-amber-700",
    past_due: "bg-orange-100 text-orange-700",
  };
  return (
    <Badge className={cn("border-0 capitalize", colors[status] || "bg-muted text-muted-foreground")}>
      {status}
    </Badge>
  );
}

// ── Pricing Tab ───────────────────────────────────────────────────────────

function PricingTab() {
  const [plans, setPlans] = React.useState<PricingPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<PricingPlan | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/admin/billing/pricing")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setPlans(d?.plans || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const handleSave = async (plan: PricingPlan) => {
    try {
      await fetch("/api/admin/billing/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });
      setEditing(null);
      load();
    } catch {
      // ignore
    }
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading pricing…</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Pricing Plans ({plans.length})</h3>
        <Button size="sm" variant="outline" onClick={load} className="gap-1.5">
          <RefreshCw className="size-3.5" /> Refresh
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Country</th>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Plan</th>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Cycle</th>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Price</th>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Razorpay Plan ID</th>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Active</th>
              <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.id} className="border-b border-border/60 hover:bg-muted/20">
                <td className="p-3">
                  <div className="font-medium">{p.countryName}</div>
                  <div className="text-xs text-muted-foreground">{p.countryCode} · {p.currency}</div>
                </td>
                <td className="p-3 capitalize">{p.plan}</td>
                <td className="p-3 capitalize">{p.billingCycle}</td>
                <td className="p-3 font-medium">{p.currencySymbol}{p.displayPrice}</td>
                <td className="p-3">
                  {p.razorpayPlanId ? (
                    <code className="text-xs text-emerald-600">{p.razorpayPlanId.slice(0, 12)}…</code>
                  ) : (
                    <span className="text-xs text-amber-600">Not set</span>
                  )}
                </td>
                <td className="p-3">
                  {p.active ? (
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  ) : (
                    <XCircle className="size-4 text-rose-500" />
                  )}
                </td>
                <td className="p-3">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(p)} className="gap-1 text-xs">
                    <Edit3 className="size-3" /> Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditPricingModal plan={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      )}
    </div>
  );
}

function EditPricingModal({ plan, onClose, onSave }: { plan: PricingPlan; onClose: () => void; onSave: (p: PricingPlan) => void }) {
  const [form, setForm] = React.useState(plan);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-background p-5 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold">Edit Pricing — {plan.countryName} {plan.plan} {plan.billingCycle}</h3>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-muted"><X className="size-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <Label>Display Price ({form.currencySymbol})</Label>
            <Input type="number" value={form.displayPrice} onChange={e => setForm({ ...form, displayPrice: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Razorpay Plan ID</Label>
            <Input value={form.razorpayPlanId || ""} onChange={e => setForm({ ...form, razorpayPlanId: e.target.value || null })} placeholder="plan_XXXXX" />
          </div>
          <div>
            <Label>Currency Symbol</Label>
            <Input value={form.currencySymbol} onChange={e => setForm({ ...form, currencySymbol: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="size-4 rounded" />
            Active
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => onSave(form)} className="gap-1.5 bg-brand text-brand-foreground">
            <Save className="size-3.5" /> Save
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Promo Codes Tab ───────────────────────────────────────────────────────

function PromoCodesTab() {
  const [codes, setCodes] = React.useState<PromoCode[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/admin/billing/promo-codes")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setCodes(d?.promoCodes || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Promo Codes ({codes.length})</h3>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="size-3.5" /> Create
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading promo codes…</div>
      ) : codes.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">No promo codes yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Code</th>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Discount</th>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Usage</th>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Expires</th>
                <th className="p-3 text-left text-xs font-semibold uppercase text-muted-foreground">Active</th>
              </tr>
            </thead>
            <tbody>
              {codes.map(c => (
                <tr key={c.id} className="border-b border-border/60 hover:bg-muted/20">
                  <td className="p-3">
                    <code className="font-bold">{c.code}</code>
                    {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                  </td>
                  <td className="p-3">
                    {c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {c.usedCount}{c.maxUses > 0 ? ` / ${c.maxUses}` : " / ∞"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="p-3">
                    {c.active ? <CheckCircle2 className="size-4 text-emerald-500" /> : <XCircle className="size-4 text-rose-500" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreatePromoModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  );
}

function CreatePromoModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = React.useState({
    code: "", description: "", discountType: "percentage", discountValue: 10,
    maxUses: 0, countryCode: "", plan: "", billingCycle: "", expiresAt: "",
  });
  const [saving, setSaving] = React.useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/billing/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          countryCode: form.countryCode || null,
          plan: form.plan || null,
          billingCycle: form.billingCycle || null,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        }),
      });
      onCreated();
      onClose();
    } catch {
      // ignore
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-background p-5 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold">Create Promo Code</h3>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-muted"><X className="size-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <Label>Code</Label>
            <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="LAUNCH20" />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Launch campaign 20% off" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Type</Label>
              <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <Label>Value</Label>
              <Input type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Max Uses (0=∞)</Label>
              <Input type="number" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Expires At</Label>
              <Input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleCreate} disabled={saving || !form.code} className="gap-1.5 bg-brand text-brand-foreground">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Create
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Invoices Tab ──────────────────────────────────────────────────────────

function InvoicesTab() {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <FileText className="mx-auto mb-3 size-12 text-muted-foreground/40" />
      <h3 className="text-sm font-bold">Invoice Management</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Invoices are generated automatically after each successful payment.
        Vendor invoices can be viewed in their Billing Center.
      </p>
    </div>
  );
}

// ── Webhooks Tab ──────────────────────────────────────────────────────────

function WebhooksTab() {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <Zap className="mx-auto mb-3 size-12 text-muted-foreground/40" />
      <h3 className="text-sm font-bold">Webhook Logs</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Every Razorpay webhook is logged to the WebhookLog table with full payload,
        signature, and processing status. Use the database query tool to inspect logs.
      </p>
      <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs">
        <CheckCircle2 className="size-3.5 text-emerald-500" />
        Webhook handler active at /api/webhooks/razorpay
      </div>
    </div>
  );
}

export default AdminBillingDashboard;
