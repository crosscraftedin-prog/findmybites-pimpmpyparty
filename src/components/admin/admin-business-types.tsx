"use client";

import * as React from "react";
import {
  Plus, Search, Trash2, Pencil, Loader2, X, Check, ArrowUp, ArrowDown,
  Download, Upload, Power,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BusinessType {
  id: string;
  categoryId: string;
  value: string;
  label: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
}

const CATEGORIES = [
  "bakers-bakery", "caterers", "chef-staff", "food-trucks", "dessert-makers",
  "specialty-food", "event-planners", "decorators", "djs", "photographers",
  "venues", "florists", "entertainers",
];

export function AdminBusinessTypes() {
  const [types, setTypes] = React.useState<BusinessType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState("all");
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<BusinessType | null>(null);
  const [form, setForm] = React.useState({ categoryId: "", value: "", label: "", sortOrder: 0 });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      // Load all business types (no category filter = all)
      const res = await fetch("/api/admin/business-types");
      if (res.ok) {
        const data = await res.json();
        setTypes(data.businessTypes || []);
      } else {
        setTypes([]);
      }
    } catch {
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const filtered = React.useMemo(() => {
    let result = [...types];
    if (filterCategory !== "all") result = result.filter(t => t.categoryId === filterCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t => t.label.toLowerCase().includes(q) || t.value.toLowerCase().includes(q) || t.categoryId.toLowerCase().includes(q));
    }
    return result.sort((a, b) => a.categoryId.localeCompare(b.categoryId) || a.sortOrder - b.sortOrder);
  }, [types, search, filterCategory]);

  const openCreate = () => {
    setEditing(null);
    setForm({ categoryId: "", value: "", label: "", sortOrder: 0 });
    setShowForm(true);
  };

  const openEdit = (t: BusinessType) => {
    setEditing(t);
    setForm({ categoryId: t.categoryId, value: t.value, label: t.label, sortOrder: t.sortOrder });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.categoryId || !form.value || !form.label) {
      toast.error("Category, value, and label are required");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/business-types/${editing.id}` : "/api/admin/business-types";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(editing ? "Business type updated" : "Business type created");
        setShowForm(false);
        load();
      } else {
        const e = await res.json().catch(() => ({}));
        toast.error(e.error || "Failed to save");
      }
    } catch { toast.error("Failed"); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this business type?")) return;
    try {
      await fetch(`/api/admin/business-types/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      setTypes(t => t.filter(x => x.id !== id));
    } catch { toast.error("Failed"); }
  };

  const toggleActive = async (t: BusinessType) => {
    try {
      await fetch(`/api/admin/business-types/${t.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !t.active }),
      });
      setTypes(prev => prev.map(x => x.id === t.id ? { ...x, active: !x.active } : x));
    } catch { toast.error("Failed"); }
  };

  const moveOrder = async (t: BusinessType, direction: "up" | "down") => {
    const newOrder = direction === "up" ? t.sortOrder - 1 : t.sortOrder + 1;
    try {
      await fetch(`/api/admin/business-types/${t.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: newOrder }),
      });
      load();
    } catch { toast.error("Failed"); }
  };

  const exportCsv = () => {
    const csv = "categoryId,value,label,sortOrder,active\n" + types.map(t => `${t.categoryId},${t.value},${t.label},${t.sortOrder},${t.active}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "business-types.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported CSV");
  };

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h2 className="text-lg font-bold">Business Types</h2>
        <p className="text-sm text-muted-foreground">Manage business types for each category. Database-driven — no code changes needed.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border bg-card p-3 text-center">
          <div className="text-xl font-bold">{types.length}</div>
          <div className="text-[10px] text-muted-foreground">Total</div>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <div className="text-xl font-bold text-emerald-600">{types.filter(t => t.active).length}</div>
          <div className="text-[10px] text-muted-foreground">Active</div>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <div className="text-xl font-bold text-amber-600">{types.filter(t => !t.active).length}</div>
          <div className="text-[10px] text-muted-foreground">Disabled</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search business types…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/-/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-1.5 size-3.5" /> Export</Button>
        <Button size="sm" onClick={openCreate}><Plus className="mr-1.5 size-3.5" /> Add</Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No business types found. Click "Add" to create one.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <div className="hidden grid-cols-[1fr_120px_80px_60px_120px] gap-2 border-b bg-muted/40 p-3 text-[10px] font-semibold uppercase text-muted-foreground sm:grid">
            <span>Label / Value</span><span>Category</span><span>Order</span><span>Status</span><span>Actions</span>
          </div>
          <ScrollArea className="max-h-[60vh]">
            <div className="divide-y">
              {filtered.map(t => (
                <div key={t.id} className="grid grid-cols-1 gap-1 p-3 text-sm sm:grid-cols-[1fr_120px_80px_60px_120px] sm:items-center sm:gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{t.value}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{t.categoryId.replace(/-/g, " ")}</span>
                  <span className="text-xs">{t.sortOrder}</span>
                  <button onClick={() => toggleActive(t)}>
                    <Badge className={cn("text-[9px]", t.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400")}>
                      {t.active ? "Active" : "Disabled"}
                    </Badge>
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => moveOrder(t, "up")} className="grid size-7 place-items-center rounded-md hover:bg-accent" title="Move up"><ArrowUp className="size-3.5" /></button>
                    <button onClick={() => moveOrder(t, "down")} className="grid size-7 place-items-center rounded-md hover:bg-accent" title="Move down"><ArrowDown className="size-3.5" /></button>
                    <button onClick={() => openEdit(t)} className="grid size-7 place-items-center rounded-md hover:bg-accent" title="Edit"><Pencil className="size-3.5" /></button>
                    <button onClick={() => toggleActive(t)} className="grid size-7 place-items-center rounded-md hover:bg-accent" title="Toggle"><Power className="size-3.5" /></button>
                    <button onClick={() => remove(t.id)} className="grid size-7 place-items-center rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" title="Delete"><Trash2 className="size-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="w-full max-w-md rounded-2xl border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-sm font-semibold">{editing ? "Edit Business Type" : "Add Business Type"}</h3>
              <button onClick={() => setShowForm(false)} className="grid size-7 place-items-center rounded-full hover:bg-accent"><X className="size-4" /></button>
            </div>
            <div className="space-y-3 p-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Category *</Label>
                <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/-/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Value * (internal key, e.g. "home_baker")</Label>
                <Input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="home_baker" className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Label * (display name)</Label>
                <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Home Baker" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sort Order</Label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} className="w-32" />
              </div>
            </div>
            <div className="flex gap-2 border-t p-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button className="flex-1" onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}{editing ? "Update" : "Create"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
