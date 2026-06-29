"use client";

import * as React from "react";
import { Plus, Trash2, Pencil, X, Check, Loader2, Filter, Tag } from "lucide-react";

const CORAL = "#D85A30";
const CORAL_TINT = "#FAECE7";

interface FilterValue {
  id: string;
  value: string;
  sortOrder: number;
}

interface FilterGroup {
  id: string;
  name: string;
  type: string;
  unit: string | null;
  active: boolean;
  values: FilterValue[];
  categories?: { id: string; categoryId: string; filterGroupId: string }[];
}

const ALL_CATEGORIES = [
  "bakers-bakery", "caterers", "chef-staff", "food-trucks",
  "beverage-specialists", "specialty-food",
  "event-planners", "decorators", "photographers", "videographers",
  "djs", "entertainers", "venues", "florists",
  "rental-services", "makeup-artists", "beauty-services",
  "transportation", "invitation-printing",
  "kids-party-services", "audio-visual-services",
  "party-supplies",
];

export function AdminFilters() {
  const [groups, setGroups] = React.useState<FilterGroup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [newGroup, setNewGroup] = React.useState({
    name: "", type: "multi", unit: "", values: "", categoryIds: [] as string[],
  });
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [newValue, setNewValue] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const fetchGroups = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/filters");
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch { setGroups([]); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleCreate = async () => {
    if (!newGroup.name.trim()) { setMsg("❌ Name required"); return; }
    setSaving(true);
    try {
      const values = newGroup.values.split(",").map((v) => v.trim()).filter(Boolean);
      const res = await fetch("/api/admin/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroup.name.trim(),
          type: newGroup.type,
          unit: newGroup.unit || undefined,
          values,
          categoryIds: newGroup.categoryIds,
        }),
      });
      if (res.ok) {
        setMsg("✅ Filter group created");
        setShowForm(false);
        setNewGroup({ name: "", type: "multi", unit: "", values: "", categoryIds: [] });
        fetchGroups();
        setTimeout(() => setMsg(null), 3000);
      } else {
        const d = await res.json();
        setMsg(`❌ ${d.error || "Failed"}`);
      }
    } catch { setMsg("❌ Network error"); }
    finally { setSaving(false); }
  };

  const handleAddValue = async (groupId: string) => {
    if (!newValue.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/filters/${groupId}/values`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue.trim() }),
      });
      if (res.ok) {
        setNewValue("");
        fetchGroups();
      }
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this filter group?")) return;
    try {
      await fetch(`/api/admin/filters/${id}`, { method: "DELETE" });
      setMsg("✅ Deactivated");
      fetchGroups();
      setTimeout(() => setMsg(null), 3000);
    } catch {}
  };

  const toggleCategory = (catId: string) => {
    setNewGroup((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(catId)
        ? prev.categoryIds.filter((c) => c !== catId)
        : [...prev.categoryIds, catId],
    }));
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight">Filter Engine</h2>
          <p className="mt-1 text-[13px] text-black/50">
            Manage dynamic filters for categories. Vendors see these when editing their listing.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white"
          style={{ background: CORAL }}
        >
          <Plus className="size-4" /> New Filter
        </button>
      </div>

      {msg && (
        <div className="rounded-lg px-4 py-3 text-[13px] font-medium" style={{
          background: msg.startsWith("✅") ? "#EAF3DE" : "#FDECEA",
          color: msg.startsWith("✅") ? "#27500A" : "#8B1A1A",
        }}>{msg}</div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border-2 p-4 space-y-4" style={{ borderColor: `${CORAL}33`, background: CORAL_TINT }}>
          <h3 className="font-semibold text-[15px]">Create Filter Group</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input placeholder="Filter name (e.g. Cuisine)" value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              className="rounded-lg border border-black/15 px-3 py-2 text-[13px]" />
            <select value={newGroup.type}
              onChange={(e) => setNewGroup({ ...newGroup, type: e.target.value })}
              className="rounded-lg border border-black/15 px-3 py-2 text-[13px]">
              <option value="multi">Multi-select</option>
              <option value="single">Single-select</option>
              <option value="range">Range (numeric)</option>
            </select>
            <input placeholder="Unit (e.g. guests, km)" value={newGroup.unit}
              onChange={(e) => setNewGroup({ ...newGroup, unit: e.target.value })}
              className="rounded-lg border border-black/15 px-3 py-2 text-[13px]" />
          </div>
          <input placeholder="Values (comma-separated: Italian, Chinese, Mexican...)" value={newGroup.values}
            onChange={(e) => setNewGroup({ ...newGroup, values: e.target.value })}
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-[13px]" />
          <div>
            <p className="mb-2 text-[12px] font-semibold">Assign to categories:</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CATEGORIES.map((cat) => (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    newGroup.categoryIds.includes(cat)
                      ? "bg-orange-500 text-white" : "bg-white border border-black/10 text-black/60"
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white"
              style={{ background: "#16a34a" }}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Create
            </button>
            <button onClick={() => setShowForm(false)}
              className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-4 py-2 text-[13px]">
              <X className="size-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter groups list */}
      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/15 bg-white py-16 text-center">
          <Filter className="mx-auto size-10 text-black/20" />
          <p className="mt-3 text-[15px] font-medium">No filter groups yet</p>
          <p className="mt-1 text-[13px] text-black/40">Click "New Filter" to create your first filter group.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.id} className="rounded-xl border border-black/10 bg-white overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Tag className="size-4" style={{ color: CORAL }} />
                  <div>
                    <p className="text-[14px] font-bold">{g.name}</p>
                    <p className="text-[11px] text-black/40">
                      {g.type} {g.unit ? `· ${g.unit}` : ""} · {g.values.length} values · {g.categories?.length || 0} categories
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setExpandedId(expandedId === g.id ? null : g.id)}
                    className="rounded-lg border border-black/15 px-3 py-1.5 text-[12px] hover:bg-black/5">
                    {expandedId === g.id ? "Collapse" : "Expand"}
                  </button>
                  <button onClick={() => handleDelete(g.id)}
                    className="rounded-lg border border-red-200 px-2 py-1.5 text-[12px] text-red-600 hover:bg-red-50">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              {expandedId === g.id && (
                <div className="border-t border-black/5 bg-black/[0.015] p-4 space-y-3">
                  {/* Values */}
                  <div>
                    <p className="mb-2 text-[12px] font-semibold">Values:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.values.map((v) => (
                        <span key={v.id} className="rounded-md bg-white border border-black/10 px-2.5 py-1 text-[11px] font-medium">
                          {v.value}
                        </span>
                      ))}
                      {g.values.length === 0 && <span className="text-[11px] text-black/30">No values yet</span>}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input placeholder="Add value..." value={expandedId === g.id ? newValue : ""}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddValue(g.id); }}
                        className="flex-1 rounded-lg border border-black/15 px-3 py-1.5 text-[12px]" />
                      <button onClick={() => handleAddValue(g.id)} disabled={saving}
                        className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-white"
                        style={{ background: CORAL }}>
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Categories */}
                  <div>
                    <p className="mb-2 text-[12px] font-semibold">Assigned to categories:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.categories?.map((cf) => (
                        <span key={cf.id} className="rounded-md bg-amber-100 text-amber-700 px-2.5 py-1 text-[11px] font-medium">
                          {cf.categoryId}
                        </span>
                      )) || <span className="text-[11px] text-black/30">No categories assigned</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
