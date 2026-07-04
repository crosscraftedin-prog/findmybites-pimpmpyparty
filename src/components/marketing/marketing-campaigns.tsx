"use client";

import * as React from "react";
import {
  Megaphone, Sparkles, Loader2, Plus, Trash2, Copy, Calendar, Check, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { copyToClipboard } from "./marketing-helpers";

const CAMPAIGN_TYPES = [
  { value: "coupon", label: "Coupon Campaign" },
  { value: "festival", label: "Festival Campaign" },
  { value: "weekend", label: "Weekend Offer" },
  { value: "birthday", label: "Birthday Offer" },
  { value: "wedding_season", label: "Wedding Season Offer" },
  { value: "referral", label: "Referral Campaign" },
  { value: "flash_sale", label: "Flash Sale" },
  { value: "countdown", label: "Countdown Campaign" },
];

interface Campaign {
  id: string; type: string; name: string; code: string | null;
  discountPercent: number | null; headline: string | null;
  description: string | null; terms: string | null;
  startsAt: string | null; endsAt: string | null; status: string;
  views: number; clicks: number; redemptions: number; createdAt: string;
}

export function CampaignManager() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    type: "coupon", name: "", discount: "", festival: "",
    headline: "", description: "", terms: "",
    startsAt: "", endsAt: "", code: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/marketing/campaigns");
      if (res.ok) setCampaigns((await res.json()).campaigns || []);
    } catch {} finally { setLoading(false); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const generateCopy = async () => {
    if (!form.name.trim()) { toast.error("Enter a campaign name first"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/vendor/marketing/ai/campaign", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: form.type, name: form.name, discount: form.discount, festival: form.festival }),
      });
      const json = await res.json();
      if (json.copy) {
        setForm((f) => ({ ...f, headline: json.copy.headline, description: json.copy.description, terms: json.copy.terms }));
        toast.success("AI copy generated");
      }
    } catch { toast.error("Failed"); } finally { setGenerating(false); }
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Campaign name required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/marketing/campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type, name: form.name,
          code: form.code || null,
          discountPercent: form.discount ? Number(form.discount) : null,
          headline: form.headline, description: form.description, terms: form.terms,
          startsAt: form.startsAt || null, endsAt: form.endsAt || null,
          status: "active",
        }),
      });
      if (res.ok) { toast.success("Campaign created"); setShowForm(false); setForm({ type: "coupon", name: "", discount: "", festival: "", headline: "", description: "", terms: "", startsAt: "", endsAt: "", code: "" }); load(); }
    } catch { toast.error("Failed"); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    await fetch(`/api/vendor/marketing/campaigns/${id}`, { method: "DELETE" });
    setCampaigns((c) => c.filter((x) => x.id !== id));
    toast.success("Deleted");
  };

  const setStatus = async (id: string, status: string) => {
    await fetch(`/api/vendor/marketing/campaigns?id=${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Megaphone className="h-4 w-4" /> Marketing Campaigns</h3>
          <p className="text-xs text-muted-foreground">Create coupons, festival offers, flash sales & more.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="mr-1 h-4 w-4" /> New Campaign
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Campaign type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CAMPAIGN_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Campaign name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Diwali Sweet Box" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Discount %</Label>
              <Input type="number" value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))} placeholder="20" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Coupon code (optional)</Label>
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="DIWALI20" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Festival (optional)</Label>
              <Input value={form.festival} onChange={(e) => setForm((f) => ({ ...f, festival: e.target.value }))} placeholder="Diwali" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Starts</Label>
              <Input type="date" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ends</Label>
              <Input type="date" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={generateCopy} disabled={generating}>
            {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
            Generate copy with AI
          </Button>
          {form.headline && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Headline</Label>
                <Input value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Terms</Label>
                <Input value={form.terms} onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))} />
              </div>
            </>
          )}
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}Create Campaign</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Campaign list */}
      {loading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No campaigns yet. Create your first one!</div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-xl border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{c.name}</span>
                    <Badge variant="outline" className="text-[9px] capitalize">{c.type.replace("_", " ")}</Badge>
                    <StatusBadge status={c.status} />
                    {c.discountPercent && <Badge className="bg-red-100 text-red-700 text-[9px]">{c.discountPercent}% OFF</Badge>}
                  </div>
                  {c.headline && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{c.headline}</p>}
                  {c.code && (
                    <button onClick={() => { copyToClipboard(c.code!); toast.success("Code copied"); }} className="mt-1 inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] hover:bg-accent">
                      <Copy className="h-2.5 w-2.5" /> {c.code}
                    </button>
                  )}
                  <div className="mt-1.5 flex gap-3 text-[10px] text-muted-foreground">
                    <span>👁 {c.views}</span><span>👆 {c.clicks}</span><span>✅ {c.redemptions}</span>
                    {c.endsAt && <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" /> {new Date(c.endsAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {c.status === "active" ? (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setStatus(c.id, "paused")}>Pause</Button>
                  ) : (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setStatus(c.id, "active")}>Activate</Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => remove(c.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    paused: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    expired: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  };
  return <Badge className={cn("text-[9px] capitalize", map[status] || map.draft)}>{status}</Badge>;
}
