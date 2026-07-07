"use client";

import * as React from "react";
import { Plus, Trash2, Pencil, X, Check, Loader2, Globe2 } from "lucide-react";

interface PricingData {
  id: string;
  countryCode: string;
  countryLabel: string;
  symbol: string;
  proMonthly: number;
  proYearlyTotal: number;
  businessMonthly: number;
  businessYearlyTotal: number;
  note: string;
  active: boolean;
}

const CORAL = "#D85A30";
const CORAL_TINT = "#FAECE7";

export function AdminPricing() {
  const [pricing, setPricing] = React.useState<PricingData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState<Partial<PricingData>>({});
  const [showForm, setShowForm] = React.useState(false);
  const [newForm, setNewForm] = React.useState({
    countryCode: "", countryLabel: "", symbol: "",
    proMonthly: 0, proYearlyTotal: 0, businessMonthly: 0, businessYearlyTotal: 0, note: "",
  });
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const fetchPricing = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pricing");
      const data = await res.json();
      setPricing(Array.isArray(data) ? data : []);
    } catch {
      setPricing([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchPricing(); }, [fetchPricing]);

  const startEdit = (p: PricingData) => {
    setEditingId(p.id);
    setEditForm({ ...p });
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/pricing/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setMsg("✅ Pricing updated");
        setEditingId(null);
        fetchPricing();
        setTimeout(() => setMsg(null), 3000);
      } else {
        const d = await res.json();
        setMsg(`❌ ${d.error || "Update failed"}`);
      }
    } catch {
      setMsg("❌ Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this pricing?")) return;
    try {
      await fetch(`/api/pricing/${id}`, { method: "DELETE" });
      setMsg("✅ Deactivated");
      fetchPricing();
      setTimeout(() => setMsg(null), 3000);
    } catch {
      setMsg("❌ Delete failed");
    }
  };

  const handleAdd = async () => {
    if (!newForm.countryCode || !newForm.countryLabel || !newForm.symbol) {
      setMsg("❌ Country code, label, and symbol required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      if (res.ok) {
        setMsg("✅ Pricing added");
        setShowForm(false);
        setNewForm({ countryCode: "", countryLabel: "", symbol: "", proMonthly: 0, proYearlyTotal: 0, businessMonthly: 0, businessYearlyTotal: 0, note: "" });
        fetchPricing();
        setTimeout(() => setMsg(null), 3000);
      } else {
        const d = await res.json();
        setMsg(`❌ ${d.error || "Add failed"}`);
      }
    } catch {
      setMsg("❌ Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin" style={{ color: CORAL }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight">Pricing Management</h2>
          <p className="mt-1 text-[13px] text-black/50">
            Edit subscription prices per country. Changes take effect immediately — no redeploy needed.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white"
          style={{ background: CORAL }}
        >
          <Plus className="size-4" /> Add Country
        </button>
      </div>

      {msg && (
        <div className="rounded-lg px-4 py-3 text-[13px] font-medium" style={{
          background: msg.startsWith("✅") ? "#EAF3DE" : "#FDECEA",
          color: msg.startsWith("✅") ? "#27500A" : "#8B1A1A",
        }}>
          {msg}
        </div>
      )}

      {/* Add new pricing form */}
      {showForm && (
        <div className="rounded-xl border-2 p-4 space-y-4" style={{ borderColor: `${CORAL}33`, background: CORAL_TINT }}>
          <h3 className="font-semibold text-[15px]">Add New Pricing</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <input
              placeholder="Code (e.g., CA)"
              value={newForm.countryCode}
              onChange={(e) => setNewForm({ ...newForm, countryCode: e.target.value.toUpperCase() })}
              className="rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
            <input
              placeholder="Label (e.g., Canada)"
              value={newForm.countryLabel}
              onChange={(e) => setNewForm({ ...newForm, countryLabel: e.target.value })}
              className="rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
            <input
              placeholder="Symbol (e.g., C$)"
              value={newForm.symbol}
              onChange={(e) => setNewForm({ ...newForm, symbol: e.target.value })}
              className="rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
            <input
              type="number"
              placeholder="Pro Monthly"
              value={newForm.proMonthly || ""}
              onChange={(e) => setNewForm({ ...newForm, proMonthly: Number(e.target.value) })}
              className="rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
            <input
              type="number"
              placeholder="Pro Yearly (Total)"
              value={newForm.proYearlyTotal || ""}
              onChange={(e) => setNewForm({ ...newForm, proYearlyTotal: Number(e.target.value) })}
              className="rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
            <input
              type="number"
              placeholder="Business Monthly"
              value={newForm.businessMonthly || ""}
              onChange={(e) => setNewForm({ ...newForm, businessMonthly: Number(e.target.value) })}
              className="rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
            <input
              type="number"
              placeholder="Business Yearly (Total)"
              value={newForm.businessYearlyTotal || ""}
              onChange={(e) => setNewForm({ ...newForm, businessYearlyTotal: Number(e.target.value) })}
              className="rounded-lg border border-black/15 px-3 py-2 text-[13px]"
            />
            <input
              placeholder="Note"
              value={newForm.note}
              onChange={(e) => setNewForm({ ...newForm, note: e.target.value })}
              className="rounded-lg border border-black/15 px-3 py-2 text-[13px] col-span-2 sm:col-span-4"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white"
              style={{ background: "#16a34a" }}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-4 py-2 text-[13px] font-medium"
            >
              <X className="size-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pricing table */}
      {pricing.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/15 bg-white py-16 text-center">
          <Globe2 className="mx-auto size-10 text-black/20" />
          <p className="mt-3 text-[15px] font-medium">No pricing configured yet</p>
          <p className="mt-1 text-[13px] text-black/40">
            Click "Add Country" to create your first pricing entry.
            The subscription modal will use hardcoded defaults until pricing is added.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 bg-black/[0.02]">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-black/50">Country</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-black/50">Symbol</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-black/50">Pro (Monthly / Yearly)</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-black/50">Business (Monthly / Yearly)</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-black/50">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map((p) => (
                  <tr key={p.id} className="border-b border-black/5 hover:bg-black/[0.015]">
                    <td className="px-4 py-3">
                      {editingId === p.id ? (
                        <input
                          defaultValue={p.countryLabel}
                          onChange={(e) => setEditForm({ ...editForm, countryLabel: e.target.value })}
                          className="w-full rounded border border-black/15 px-2 py-1 text-[13px]"
                        />
                      ) : (
                        <div>
                          <span className="font-medium">{p.countryCode}</span>
                          <span className="text-black/40"> — {p.countryLabel}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === p.id ? (
                        <input
                          defaultValue={p.symbol}
                          onChange={(e) => setEditForm({ ...editForm, symbol: e.target.value })}
                          className="w-20 rounded border border-black/15 px-2 py-1 text-[13px]"
                        />
                      ) : (
                        p.symbol
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === p.id ? (
                        <div className="flex gap-1">
                          <input
                            type="number"
                            defaultValue={p.proMonthly}
                            onChange={(e) => setEditForm({ ...editForm, proMonthly: Number(e.target.value) })}
                            className="w-20 rounded border border-black/15 px-2 py-1 text-[13px]"
                          />
                          <input
                            type="number"
                            defaultValue={p.proYearlyTotal}
                            onChange={(e) => setEditForm({ ...editForm, proYearlyTotal: Number(e.target.value) })}
                            className="w-20 rounded border border-black/15 px-2 py-1 text-[13px]"
                          />
                        </div>
                      ) : (
                        <span className="font-medium">{p.symbol}{p.proMonthly}</span>
                      )}
                      {editingId !== p.id && <span className="text-black/40"> / {p.symbol}{p.proYearlyTotal}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === p.id ? (
                        <div className="flex gap-1">
                          <input
                            type="number"
                            defaultValue={p.businessMonthly}
                            onChange={(e) => setEditForm({ ...editForm, businessMonthly: Number(e.target.value) })}
                            className="w-20 rounded border border-black/15 px-2 py-1 text-[13px]"
                          />
                          <input
                            type="number"
                            defaultValue={p.businessYearlyTotal}
                            onChange={(e) => setEditForm({ ...editForm, businessYearlyTotal: Number(e.target.value) })}
                            className="w-20 rounded border border-black/15 px-2 py-1 text-[13px]"
                          />
                        </div>
                      ) : (
                        <span className="font-medium">{p.symbol}{p.businessMonthly}</span>
                      )}
                      {editingId !== p.id && <span className="text-black/40"> / {p.symbol}{p.businessYearlyTotal}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {editingId === p.id ? (
                          <>
                            <button
                              onClick={() => handleSave(p.id)}
                              disabled={saving}
                              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white"
                              style={{ background: "#16a34a" }}
                            >
                              {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="inline-flex items-center gap-1 rounded-lg border border-black/15 px-3 py-1.5 text-[12px]"
                            >
                              <X className="size-3" /> Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(p)}
                              className="inline-flex items-center gap-1 rounded-lg border border-black/15 px-3 py-1.5 text-[12px] hover:bg-black/5"
                            >
                              <Pencil className="size-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-[12px] text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[12px] text-black/40">
        💡 Prices shown in each country's local currency. Razorpay charges in INR (handles FX conversion).
        Changes take effect immediately on the subscription modal — no redeploy needed.
      </p>
    </div>
  );
}
