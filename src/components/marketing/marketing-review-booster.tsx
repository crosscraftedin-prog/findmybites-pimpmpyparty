"use client";

import * as React from "react";
import { Star, Plus, Loader2, Copy, QrCode, Check, Mail, MessageCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { copyToClipboard } from "./marketing-helpers";
import type { Vendor } from "@/lib/types";

interface ReviewRequest { id: string; channel: string; customerName: string | null; customerContact: string | null; token: string; status: string; sentAt: string; }
interface Stats { requested: number; received: number; conversionRate: number; }

export function ReviewBooster({ vendor }: { vendor: Vendor }) {
  const [requests, setRequests] = React.useState<ReviewRequest[]>([]);
  const [stats, setStats] = React.useState<Stats>({ requested: 0, received: 0, conversionRate: 0 });
  const [loading, setLoading] = React.useState(true);
  const [channel, setChannel] = React.useState("whatsapp");
  const [customerName, setCustomerName] = React.useState("");
  const [customerContact, setCustomerContact] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/marketing/reviews");
      if (res.ok) { const j = await res.json(); setRequests(j.requests || []); setStats(j.stats || { requested: 0, received: 0, conversionRate: 0 }); }
    } catch {} finally { setLoading(false); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const create = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/vendor/marketing/reviews", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, customerName, customerContact }),
      });
      if (res.ok) { toast.success("Review request created"); setCustomerName(""); setCustomerContact(""); load(); }
    } catch {} finally { setCreating(false); }
  };

  const reviewLink = (token: string) => `${typeof window !== "undefined" ? window.location.origin : "https://findmybites.com"}/review/${token}`;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Requested" value={stats.requested} icon={<Mail className="h-4 w-4" />} />
        <StatCard label="Received" value={stats.received} icon={<Star className="h-4 w-4" />} />
        <StatCard label="Conversion" value={`${stats.conversionRate}%`} icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      {/* Create request */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Star className="h-4 w-4" /> Request a Review</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Channel</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="qr">QR Code</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Customer name (optional)</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Priya" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Contact (phone/email)</Label>
            <Input value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} placeholder="+91…" />
          </div>
        </div>
        <Button className="mt-3" onClick={create} disabled={creating}>
          {creating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />} Create Request
        </Button>
      </div>

      {/* List */}
      <div className="rounded-xl border">
        <div className="border-b p-3"><h3 className="text-sm font-semibold">Review Requests</h3></div>
        {loading ? <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> :
         requests.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">No review requests yet.</div> :
        <ScrollArea className="max-h-80"><div className="divide-y">
          {requests.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                {r.channel === "whatsapp" ? <MessageCircle className="h-4 w-4 text-emerald-600" /> : r.channel === "email" ? <Mail className="h-4 w-4 text-blue-600" /> : <QrCode className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{r.customerName || "Anonymous"}</div>
                <div className="text-[11px] text-muted-foreground">{r.channel} · {new Date(r.sentAt).toLocaleDateString()}</div>
              </div>
              <Badge variant={r.status === "completed" ? "default" : "outline"} className="text-[9px] capitalize">{r.status}</Badge>
              <Button size="sm" variant="ghost" className="h-7" onClick={() => { copyToClipboard(reviewLink(r.token)); toast.success("Link copied"); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div></ScrollArea>}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
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
