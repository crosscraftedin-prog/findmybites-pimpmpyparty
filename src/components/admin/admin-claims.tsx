"use client";

import * as React from "react";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Check,
  X,
  ShieldCheck,
  ClipboardList,
  Loader2,
} from "lucide-react";

interface Claim {
  id: string;
  vendor_id: string;
  user_id: string;
  claim_method: string;
  verification_phone: string | null;
  claim_token: string | null;
  status: string;
  admin_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  vendor?: { name: string; slug: string; ecosystem: string; category: string };
  profile?: { email: string; full_name: string; phone: string };
}

const ECOSYSTEM_NAME: Record<string, string> = {
  FINDMYBITES: "FindMyBites",
  PIMPMYPARTY: "PimpMyParty",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export function AdminClaimsSection() {
  const [tab, setTab] = React.useState("pending");
  const [claims, setClaims] = React.useState<Claim[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [reviewing, setReviewing] = React.useState<Claim | null>(null);
  const [notes, setNotes] = React.useState("");

  const loadClaims = async () => {
    setLoading(true);
    try {
      const { data: c } = await supabaseBrowser
        .from("vendor_claims")
        .select("*")
        .order("submitted_at", { ascending: false });

      // Hydrate vendor + profile data
      const vendorIds = [...new Set((c || []).map((cc) => cc.vendor_id))];
      const userIds = [...new Set((c || []).map((cc) => cc.user_id))];

      const [vendorRes, profileRes] = await Promise.all([
        vendorIds.length
          ? supabaseBrowser
              .from("vendor_listings")
              .select("id,name,slug,ecosystem,category")
              .in("id", vendorIds)
          : Promise.resolve({ data: [] }),
        userIds.length
          ? supabaseBrowser
              .from("profiles")
              .select("id,email,full_name,phone")
              .in("id", userIds)
          : Promise.resolve({ data: [] }),
      ]);

      const vendorMap: Record<string, any> = {};
      (vendorRes.data || []).forEach((v) => {
        vendorMap[v.id] = v;
      });
      const profileMap: Record<string, any> = {};
      (profileRes.data || []).forEach((p) => {
        profileMap[p.id] = p;
      });

      setClaims(
        (c || []).map((cc) => ({
          ...cc,
          vendor: vendorMap[cc.vendor_id],
          profile: profileMap[cc.user_id],
        }))
      );
    } catch {
      // Tables may not exist yet
    }
    setLoading(false);
  };

  React.useEffect(() => {
    loadClaims();
  }, []);

  const filteredClaims = React.useMemo(
    () => claims.filter((c) => c.status === tab),
    [claims, tab]
  );

  const stats = React.useMemo(
    () => ({
      pending: claims.filter((c) => c.status === "pending").length,
      approved: claims.filter((c) => c.status === "approved").length,
      rejected: claims.filter((c) => c.status === "rejected").length,
    }),
    [claims]
  );

  const approve = async (id: string) => {
    setBusy(true);
    const { error } = await supabaseBrowser.rpc("approve_claim", {
      p_claim_id: id,
      p_notes: notes || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Claim approved — vendor is now verified");
    setReviewing(null);
    setNotes("");
    loadClaims();
  };

  const reject = async (id: string) => {
    setBusy(true);
    const { error } = await supabaseBrowser.rpc("reject_claim", {
      p_claim_id: id,
      p_notes: notes || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Claim rejected");
    setReviewing(null);
    setNotes("");
    loadClaims();
  };

  const generateInvite = async (vendorId: string, vendorName: string) => {
    const { data, error } = await supabaseBrowser.rpc("generate_invite_token", {
      p_vendor_id: vendorId,
      p_ttl_hours: 168,
    });
    if (error) return toast.error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    const url = `${window.location.origin}/claim-token/${row.token}`;
    await navigator.clipboard.writeText(url);
    toast.success(`Invite link for ${vendorName} copied to clipboard`);
  };

  return (
    <div>
      {/* Stats */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: "Pending", val: stats.pending, icon: ClipboardList },
          { label: "Approved", val: stats.approved, icon: Check },
          { label: "Rejected", val: stats.rejected, icon: X },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-lg p-3.5"
              style={{ background: "#F1EFE8" }}
            >
              <div className="flex items-center justify-between text-black/50">
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  {s.label}
                </span>
                <Icon className="size-4" />
              </div>
              <p className="mt-1.5 text-[22px] font-medium">{s.val}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
        </TabsList>

        {["pending", "approved", "rejected"].map((s) => (
          <TabsContent key={s} value={s} className="mt-4">
            {loading ? (
              <div className="py-8 text-center text-black/40">
                <Loader2 className="mx-auto size-6 animate-spin" />
              </div>
            ) : filteredClaims.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/15 py-10 text-center">
                <p className="text-sm font-medium">No {s} claims</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredClaims.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-black/10 bg-white p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-black/40">
                        {ECOSYSTEM_NAME[c.vendor?.ecosystem] || "—"} ·{" "}
                        {c.vendor?.category || "—"}
                      </p>
                      <p className="truncate text-sm font-bold">
                        {c.vendor?.name || c.vendor_id}
                      </p>
                      <p className="mt-0.5 text-xs text-black/40">
                        Claimer: {c.profile?.full_name || c.profile?.email || c.user_id}{" "}
                        · via {c.claim_method.replace("_", " ")} ·{" "}
                        {new Date(c.submitted_at).toLocaleDateString()}
                      </p>
                      {c.verification_phone && (
                        <p className="text-xs text-black/40">
                          Phone: {c.verification_phone}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className="rounded-full px-2 py-0.5 text-[10px] uppercase"
                        style={{
                          background:
                            c.status === "approved"
                              ? "#EAF3DE"
                              : c.status === "rejected"
                                ? "#FCEBEB"
                                : "#FAEEDA",
                          color:
                            c.status === "approved"
                              ? "#27500A"
                              : c.status === "rejected"
                                ? "#791F1F"
                                : "#633806",
                        }}
                      >
                        {STATUS_LABEL[c.status]}
                      </Badge>
                      {s === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setReviewing(c);
                            setNotes("");
                          }}
                          className="rounded-lg bg-[#1A1A1A] text-white hover:bg-black"
                        >
                          Review
                        </Button>
                      )}
                      {s !== "pending" && c.vendor && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => generateInvite(c.vendor_id, c.vendor!.name)}
                          className="rounded-lg"
                        >
                          <ShieldCheck className="mr-1 size-3.5" /> Invite
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Review dialog */}
      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review claim</DialogTitle>
            <DialogDescription>
              {reviewing?.vendor?.name} — {reviewing?.profile?.email}
            </DialogDescription>
          </DialogHeader>
          {reviewing && (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-black/10 bg-muted/20 p-3">
                <p>
                  <span className="text-black/50">Method:</span>{" "}
                  {reviewing.claim_method.replace("_", " ")}
                </p>
                {reviewing.verification_phone && (
                  <p>
                    <span className="text-black/50">Verified phone:</span>{" "}
                    {reviewing.verification_phone}
                  </p>
                )}
                <p>
                  <span className="text-black/50">Submitted:</span>{" "}
                  {new Date(reviewing.submitted_at).toLocaleString()}
                </p>
              </div>
              <div>
                <Label htmlFor="review-notes">Admin notes (optional)</Label>
                <Textarea
                  id="review-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Visible to the claimant after decision."
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => reviewing && reject(reviewing.id)}
              disabled={busy}
              className="text-[#B04646] hover:bg-[#B04646]/10"
            >
              <X className="mr-1.5 size-3.5" /> Reject
            </Button>
            <Button
              onClick={() => reviewing && approve(reviewing.id)}
              disabled={busy}
              className="bg-[#8B9D83] text-white hover:bg-[#76866F]"
            >
              <Check className="mr-1.5 size-3.5" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
