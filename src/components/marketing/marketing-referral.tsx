"use client";

import * as React from "react";
import { Users, Plus, Loader2, Copy, Check, Gift, TrendingUp, Share2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { copyToClipboard } from "./marketing-helpers";
import type { Vendor } from "@/lib/types";

interface Referral { id: string; inviteeEmail: string; code: string; status: string; creditsEarned: number; commissionEarned: number; sentAt: string; activatedAt: string | null; }
interface Stats { invited: number; activated: number; creditsEarned: number; commissionEarned: number; }

export function ReferralProgram({ vendor }: { vendor: Vendor }) {
  const [referrals, setReferrals] = React.useState<Referral[]>([]);
  const [stats, setStats] = React.useState<Stats>({ invited: 0, activated: 0, creditsEarned: 0, commissionEarned: 0 });
  const [loading, setLoading] = React.useState(true);
  const [email, setEmail] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/marketing/referrals");
      if (res.ok) { const j = await res.json(); setReferrals(j.referrals || []); setStats(j.stats || { invited: 0, activated: 0, creditsEarned: 0, commissionEarned: 0 }); }
    } catch {} finally { setLoading(false); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const invite = async () => {
    if (!email.trim()) { toast.error("Enter an email"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/vendor/marketing/referrals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteeEmail: email }),
      });
      if (res.ok) { toast.success("Invitation sent"); setEmail(""); load(); }
    } catch {} finally { setCreating(false); }
  };

  const referralLink = (code: string) => `${typeof window !== "undefined" ? window.location.origin : "https://findmybites.com"}/join?ref=${code}`;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Invited" value={stats.invited} icon={<Users className="h-4 w-4" />} tone="blue" />
        <StatCard label="Activated" value={stats.activated} icon={<Check className="h-4 w-4" />} tone="emerald" />
        <StatCard label="Credits Earned" value={stats.creditsEarned} icon={<Gift className="h-4 w-4" />} tone="amber" />
        <StatCard label="Commission" value={`₹${stats.commissionEarned}`} icon={<TrendingUp className="h-4 w-4" />} tone="violet" />
      </div>

      {/* Invite */}
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-transparent p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Award className="h-4 w-4 text-primary" /> Invite a Vendor & Earn</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Earn credits + 10% commission when referred vendors activate their listing.</p>
        <div className="mt-3 flex gap-2">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vendor@email.com" type="email" />
          <Button onClick={invite} disabled={creating}>
            {creating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />} Invite
          </Button>
        </div>
        {referrals[0] && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border bg-card p-2">
            <Share2 className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 truncate font-mono text-xs">{referralLink(referrals[0].code)}</span>
            <Button size="sm" variant="ghost" className="h-7" onClick={() => { copyToClipboard(referralLink(referrals[0].code)); toast.success("Link copied"); }}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* List */}
      <div className="rounded-xl border">
        <div className="border-b p-3"><h3 className="text-sm font-semibold">Your Referrals</h3></div>
        {loading ? <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> :
         referrals.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">No referrals yet. Invite a vendor to earn rewards!</div> :
        <ScrollArea className="max-h-80"><div className="divide-y">
          {referrals.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{r.inviteeEmail}</div>
                <div className="text-[11px] text-muted-foreground">Code: {r.code} · {new Date(r.sentAt).toLocaleDateString()}</div>
              </div>
              <Badge variant={r.status === "activated" ? "default" : "outline"} className="text-[9px] capitalize">{r.status}</Badge>
              {r.creditsEarned > 0 && <Badge className="bg-amber-100 text-amber-700 text-[9px]">+{r.creditsEarned} credits</Badge>}
              <Button size="sm" variant="ghost" className="h-7" onClick={() => { copyToClipboard(referralLink(r.code)); toast.success("Link copied"); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div></ScrollArea>}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: string | number; icon: React.ReactNode; tone: "blue" | "emerald" | "amber" | "violet" }) {
  const colors = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    violet: "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  };
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase text-muted-foreground">{label}</span>
        <span className={`flex h-6 w-6 items-center justify-center rounded ${colors[tone]}`}>{icon}</span>
      </div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
