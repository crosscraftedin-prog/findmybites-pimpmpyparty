"use client";

import * as React from "react";
import { Plus, X, Loader2, Ticket, Copy } from "lucide-react";
import { toast } from "sonner";

const CORAL = "#D85A30";

interface PromoCode {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  appliesTo: string;
  usageLimit: number | null;
  usesCount: number;
  expiresAt: string;
  isActive: boolean;
}

const SAMPLE_CODES: PromoCode[] = [
  { code: "LAUNCH50", discountType: "percent", discountValue: 50, appliesTo: "All plans", usageLimit: 100, usesCount: 12, expiresAt: "2026-06-30", isActive: true },
  { code: "PRO299", discountType: "fixed", discountValue: 100, appliesTo: "Pro only", usageLimit: 50, usesCount: 8, expiresAt: "2026-07-15", isActive: true },
  { code: "SUMMER20", discountType: "percent", discountValue: 20, appliesTo: "All plans", usageLimit: null, usesCount: 34, expiresAt: "2026-08-31", isActive: true },
];

export function PromoCodesSection() {
  const [codes, setCodes] = React.useState<PromoCode[]>(SAMPLE_CODES);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({
    code: "",
    discountType: "percent" as "percent" | "fixed",
    discountValue: "",
    appliesTo: "all",
    usageLimit: "",
    perVendorLimit: true,
    expiresAt: "",
  });
  const [saving, setSaving] = React.useState(false);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm({ ...form, code });
  };

  const create = () => {
    if (!form.code || !form.discountValue) {
      toast.error("Code and discount value are required");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setCodes([
        {
          code: form.code.toUpperCase(),
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          appliesTo: form.appliesTo === "all" ? "All plans" : form.appliesTo === "pro" ? "Pro only" : "Business only",
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
          usesCount: 0,
          expiresAt: form.expiresAt || "Never",
          isActive: true,
        },
        ...codes,
      ]);
      toast.success(`Promo code ${form.code.toUpperCase()} created!`);
      setForm({ code: "", discountType: "percent", discountValue: "", appliesTo: "all", usageLimit: "", perVendorLimit: true, expiresAt: "" });
      setShowForm(false);
      setSaving(false);
    }, 600);
  };

  const toggleActive = (code: string) => {
    setCodes(codes.map((c) => c.code === code ? { ...c, isActive: !c.isActive } : c));
    toast.success("Promo code updated");
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    toast.success(`Copied "${code}" to clipboard`);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-medium">🏷️ Promo Codes</h2>
          <p className="text-[11px] text-muted-foreground">Create and manage discount codes for vendor subscriptions</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-white"
          style={{ background: CORAL }}
        >
          <Plus className="size-4" />
          Create promo code
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-4 rounded-xl border border-black/10 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Code</label>
              <div className="mt-1 flex gap-1.5">
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="LAUNCH50"
                  className="h-9 flex-1 rounded-lg border border-black/10 px-3 text-[12px] font-mono uppercase"
                />
                <button onClick={generateCode} className="rounded-lg border border-black/10 px-2 text-[11px] font-medium hover:bg-muted/50">Auto</button>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Discount type</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
                className="mt-1 h-9 w-full rounded-lg border border-black/10 px-3 text-[12px]"
              >
                <option value="percent">% off</option>
                <option value="fixed">Fixed amount off</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Discount value</label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.discountType === "percent" ? "50" : "100"}
                className="mt-1 h-9 w-full rounded-lg border border-black/10 px-3 text-[12px]"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Applies to</label>
              <select
                value={form.appliesTo}
                onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-black/10 px-3 text-[12px]"
              >
                <option value="all">All plans</option>
                <option value="pro">Pro only</option>
                <option value="business">Business only</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Usage limit (blank = unlimited)</label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                placeholder="100"
                className="mt-1 h-9 w-full rounded-lg border border-black/10 px-3 text-[12px]"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Expiry date</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-black/10 px-3 text-[12px]"
              />
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-[12px]">
            <input type="checkbox" checked={form.perVendorLimit} onChange={(e) => setForm({ ...form, perVendorLimit: e.target.checked })} className="size-3.5" />
            Limit to 1 use per vendor
          </label>
          <div className="mt-3 flex gap-2">
            <button onClick={create} disabled={saving} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-medium text-white" style={{ background: CORAL }}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Ticket className="size-4" />}
              Create Code
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-black/10 px-4 py-2 text-[12px] font-medium">Cancel</button>
          </div>
        </div>
      )}

      {/* Promo codes table */}
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-black/10 text-left text-muted-foreground">
                <th className="pb-1.5 pr-3 font-medium">Code</th>
                <th className="pb-1.5 pr-3 font-medium">Discount</th>
                <th className="pb-1.5 pr-3 font-medium">Uses</th>
                <th className="pb-1.5 pr-3 font-medium">Limit</th>
                <th className="pb-1.5 pr-3 font-medium">Expires</th>
                <th className="pb-1.5 pr-3 font-medium">Status</th>
                <th className="pb-1.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.code} className="border-b border-black/5">
                  <td className="py-1.5 pr-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold">{c.code}</span>
                      <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground"><Copy className="size-3" /></button>
                    </div>
                  </td>
                  <td className="py-1.5 pr-3">{c.discountType === "percent" ? `${c.discountValue}% off` : `$${c.discountValue} off`}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{c.usesCount}</td>
                  <td className="py-1.5 pr-3 tabular-nums">{c.usageLimit ?? "∞"}</td>
                  <td className="py-1.5 pr-3 whitespace-nowrap">{c.expiresAt === "Never" ? "Never" : new Date(c.expiresAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</td>
                  <td className="py-1.5 pr-3">
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      {c.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="py-1.5">
                    <button onClick={() => toggleActive(c.code)} className="text-[10px] font-medium text-brand hover:underline">
                      {c.isActive ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
