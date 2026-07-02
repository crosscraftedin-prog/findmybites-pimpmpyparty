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
  Search,
  Copy,
  ExternalLink,
  MessageCircle,
  Mail,
  Link2,
  Clock,
  Plus,
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

interface InviteToken {
  id: string;
  vendor_id: string;
  token: string;
  expires_at: string;
  used: boolean;
  used_by: string | null;
  created_by: string | null;
  created_at: string;
  vendor?: { name: string; slug: string; ecosystem: string; category: string; city: string };
}

interface VendorSearchResult {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string;
  ecosystem: string;
  ownership_status: string | null;
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

  // Invite generation state
  const [showInvitePanel, setShowInvitePanel] = React.useState(false);
  const [vendorSearch, setVendorSearch] = React.useState("");
  const [vendorResults, setVendorResults] = React.useState<VendorSearchResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [selectedVendor, setSelectedVendor] = React.useState<VendorSearchResult | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [inviteResult, setInviteResult] = React.useState<{ token: string; url: string; vendorName: string } | null>(null);

  // Invite history state
  const [inviteTokens, setInviteTokens] = React.useState<InviteToken[]>([]);
  const [inviteHistoryLoading, setInviteHistoryLoading] = React.useState(false);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const { data: c } = await supabaseBrowser
        .from("vendor_claims")
        .select("*")
        .order("submitted_at", { ascending: false });

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

  const loadInviteHistory = async () => {
    setInviteHistoryLoading(true);
    try {
      const { data, error } = await supabaseBrowser
        .from("vendor_invite_tokens")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Hydrate vendor data
      const vendorIds = [...new Set((data || []).map((t) => t.vendor_id))];
      let vendorMap: Record<string, any> = {};
      if (vendorIds.length) {
        const { data: vendors } = await supabaseBrowser
          .from("vendor_listings")
          .select("id,name,slug,ecosystem,category,city")
          .in("id", vendorIds);
        (vendors || []).forEach((v) => { vendorMap[v.id] = v; });
      }

      setInviteTokens((data || []).map((t) => ({
        ...t,
        vendor: vendorMap[t.vendor_id],
      })));
    } catch {
      // Table may not exist
    }
    setInviteHistoryLoading(false);
  };

  React.useEffect(() => {
    loadClaims();
    loadInviteHistory();
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

  // ── Vendor search for invite generation ──
  const searchVendors = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setVendorResults([]);
      return;
    }
    setSearching(true);
    try {
      // Search by name, city, or category using ilike
      const { data, error } = await supabaseBrowser
        .from("vendor_listings")
        .select("id,name,slug,category,city,ecosystem,ownership_status")
        .or(`name.ilike.%${query}%,city.ilike.%${query}%,category.ilike.%${query}%,id.eq.${query}`)
        .order("name", { ascending: true })
        .limit(10);

      if (error) throw error;
      setVendorResults(data || []);
    } catch {
      setVendorResults([]);
    }
    setSearching(false);
  };

  // Debounced vendor search
  React.useEffect(() => {
    const timer = setTimeout(() => searchVendors(vendorSearch), 300);
    return () => clearTimeout(timer);
  }, [vendorSearch]);

  // ── Generate invite token ──
  const generateInviteToken = async (vendor: VendorSearchResult) => {
    setGenerating(true);
    try {
      const { data, error } = await supabaseBrowser.rpc("generate_invite_token", {
        p_vendor_id: vendor.id,
        p_ttl_hours: 168, // 7 days
      });
      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      const url = `${window.location.origin}/claim-token/${row.token}`;

      setInviteResult({
        token: row.token,
        url,
        vendorName: vendor.name,
      });

      toast.success(`Invite token generated for ${vendor.name}`);
      loadInviteHistory(); // Refresh history
    } catch (err: any) {
      toast.error(err.message || "Failed to generate invite token");
    }
    setGenerating(false);
  };

  // ── Invite link actions ──
  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("Invite link copied to clipboard");
  };

  const copyToken = async (token: string) => {
    await navigator.clipboard.writeText(token);
    toast.success("Token copied to clipboard");
  };

  const shareWhatsApp = (url: string, vendorName: string) => {
    const text = encodeURIComponent(
      `Hi! You've been invited to claim your business "${vendorName}" on FindMyBites × PimpMyParty. Click here to claim it: ${url}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareEmail = (url: string, vendorName: string) => {
    const subject = encodeURIComponent(`Claim your business "${vendorName}" on FindMyBites × PimpMyParty`);
    const body = encodeURIComponent(
      `Hi,\n\nYou've been invited to claim your business listing "${vendorName}" on FindMyBites × PimpMyParty.\n\nClick the link below to claim your business:\n${url}\n\nThe link is valid for 7 days.\n\nBest regards,\nFindMyBites × PimpMyParty Team`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const revokeToken = async (tokenId: string) => {
    try {
      const { error } = await supabaseBrowser
        .from("vendor_invite_tokens")
        .update({ expires_at: new Date().toISOString() })
        .eq("id", tokenId);
      if (error) throw error;
      toast.success("Token revoked");
      loadInviteHistory();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke token");
    }
  };

  return (
    <div>
      {/* ── Generate Invite Panel (prominent button + dialog) ── */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Claims & Invites</h2>
        <Button
          onClick={() => { setShowInvitePanel(true); setInviteResult(null); setSelectedVendor(null); setVendorSearch(""); }}
          className="gap-1.5 rounded-lg bg-[#FF6B35] text-white hover:bg-[#e85a2a]"
        >
          <Plus className="size-4" />
          Generate Invite
        </Button>
      </div>

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

      {/* Tabs: Pending Claims + Invite History */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
          <TabsTrigger value="invites">Invite History</TabsTrigger>
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
                          onClick={() => {
                            setSelectedVendor({
                              id: c.vendor_id,
                              name: c.vendor!.name,
                              slug: c.vendor!.slug,
                              category: c.vendor!.category,
                              city: "",
                              ecosystem: c.vendor!.ecosystem,
                              ownership_status: null,
                            });
                            setShowInvitePanel(true);
                            setInviteResult(null);
                          }}
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

        {/* ── Invite History Tab ── */}
        <TabsContent value="invites" className="mt-4">
          {inviteHistoryLoading ? (
            <div className="py-8 text-center text-black/40">
              <Loader2 className="mx-auto size-6 animate-spin" />
            </div>
          ) : inviteTokens.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/15 py-10 text-center">
              <p className="text-sm font-medium">No invite tokens generated yet</p>
              <p className="mt-1 text-xs text-black/40">
                Click "Generate Invite" to create an invite link for a vendor.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {inviteTokens.map((t) => {
                const isExpired = new Date(t.expires_at) < new Date();
                const isUsed = t.used;
                const isRevoked = isExpired && !isUsed;
                const url = `${typeof window !== "undefined" ? window.location.origin : "https://www.findmybites.com"}/claim-token/${t.token}`;
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-black/10 bg-white p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-black/40">
                        {ECOSYSTEM_NAME[t.vendor?.ecosystem] || "—"} ·{" "}
                        {t.vendor?.category || "—"} · {t.vendor?.city || ""}
                      </p>
                      <p className="truncate text-sm font-bold">
                        {t.vendor?.name || t.vendor_id}
                      </p>
                      <p className="mt-0.5 text-xs text-black/40">
                        Created: {new Date(t.created_at).toLocaleDateString()} ·{" "}
                        Expires: {new Date(t.expires_at).toLocaleDateString()} ·{" "}
                        Token: <code className="text-[10px]">{t.token.slice(0, 12)}…</code>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className="rounded-full px-2 py-0.5 text-[10px] uppercase"
                        style={{
                          background: isUsed ? "#EAF3DE" : isRevoked ? "#FCEBEB" : "#FAEEDA",
                          color: isUsed ? "#27500A" : isRevoked ? "#791F1F" : "#633806",
                        }}
                      >
                        {isUsed ? "Used" : isRevoked ? "Revoked/Expired" : "Active"}
                      </Badge>
                      {!isUsed && !isRevoked && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyLink(url)}
                            className="rounded-lg"
                          >
                            <Copy className="mr-1 size-3" /> Copy
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => revokeToken(t.id)}
                            className="rounded-lg text-red-600 hover:bg-red-50"
                          >
                            Revoke
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Generate Invite Dialog ── */}
      <Dialog open={showInvitePanel} onOpenChange={(o) => !o && setShowInvitePanel(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {inviteResult ? "Invite Link Generated! 🎉" : "Generate Invite Link"}
            </DialogTitle>
            <DialogDescription>
              {inviteResult
                ? `Share this link with ${inviteResult.vendorName} so they can claim their business.`
                : "Search for an existing vendor to generate a claim invite link."}
            </DialogDescription>
          </DialogHeader>

          {inviteResult ? (
            /* ── Success state: show invite link + share buttons ── */
            <div className="space-y-4">
              <div className="rounded-lg border border-green-500/30 bg-green-50 p-4">
                <p className="font-medium text-green-700">
                  ✓ Invite generated for {inviteResult.vendorName}
                </p>
                <p className="mt-1 text-xs text-green-600">
                  Valid for 7 days · Single use
                </p>
              </div>

              {/* Invite Link */}
              <div className="rounded-lg border border-black/10 bg-muted/20 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-black/40">
                  Invite Link (valid for 7 days)
                </p>
                <code className="block break-all text-xs">{inviteResult.url}</code>
              </div>

              {/* Token */}
              <div className="rounded-lg border border-black/10 bg-muted/20 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-black/40">
                  Token
                </p>
                <code className="block break-all text-xs">{inviteResult.token}</code>
              </div>

              {/* Action buttons */}
              <div className="grid gap-2">
                <Button
                  onClick={() => copyLink(inviteResult.url)}
                  className="w-full gap-1.5 rounded-lg bg-[#FF6B35] text-white hover:bg-[#e85a2a]"
                >
                  <Copy className="size-4" /> Copy Link
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={() => copyToken(inviteResult.token)}
                    variant="outline"
                    className="flex-1 gap-1.5 rounded-lg"
                  >
                    <Link2 className="size-4" /> Copy Token
                  </Button>
                  <Button
                    onClick={() => window.open(inviteResult.url, "_blank")}
                    variant="outline"
                    className="flex-1 gap-1.5 rounded-lg"
                  >
                    <ExternalLink className="size-4" /> Open
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => shareWhatsApp(inviteResult.url, inviteResult.vendorName)}
                    className="flex-1 gap-1.5 rounded-lg bg-[#25D366] text-white hover:bg-[#1ebe57]"
                  >
                    <MessageCircle className="size-4" /> WhatsApp
                  </Button>
                  <Button
                    onClick={() => shareEmail(inviteResult.url, inviteResult.vendorName)}
                    variant="outline"
                    className="flex-1 gap-1.5 rounded-lg"
                  >
                    <Mail className="size-4" /> Email
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-blue-500/20 bg-blue-50 p-3 text-xs text-blue-700">
                <p className="font-semibold">What happens next:</p>
                <ol className="mt-1 list-decimal pl-4 space-y-0.5">
                  <li>Vendor clicks the link</li>
                  <li>Signs in with Google</li>
                  <li>Listing is auto-claimed & approved</li>
                  <li>Vendor goes to their dashboard</li>
                  <li>Listing goes live!</li>
                </ol>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => {
                    setShowInvitePanel(false);
                    setInviteResult(null);
                    setSelectedVendor(null);
                    setVendorSearch("");
                  }}
                  className="rounded-lg"
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* ── Search state: find a vendor to invite ── */
            <div className="space-y-4">
              {selectedVendor ? (
                /* Vendor selected — confirm generation */
                <div className="space-y-3">
                  <div className="rounded-lg border border-black/10 bg-muted/20 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-black/40">
                      {ECOSYSTEM_NAME[selectedVendor.ecosystem] || "—"} · {selectedVendor.category}
                    </p>
                    <p className="text-sm font-bold">{selectedVendor.name}</p>
                    <p className="mt-0.5 text-xs text-black/40">
                      {selectedVendor.city} · ID: {selectedVendor.id}
                    </p>
                    {selectedVendor.ownership_status === "claimed" && (
                      <p className="mt-1 text-xs text-amber-600">
                        ⚠️ This vendor is already claimed. Generating a new invite will allow re-claiming.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => { setSelectedVendor(null); setVendorSearch(""); }}
                      className="flex-1 rounded-lg"
                    >
                      Back to Search
                    </Button>
                    <Button
                      onClick={() => generateInviteToken(selectedVendor)}
                      disabled={generating}
                      className="flex-1 gap-1.5 rounded-lg bg-[#FF6B35] text-white hover:bg-[#e85a2a]"
                    >
                      {generating ? (
                        <><Loader2 className="size-4 animate-spin" /> Generating…</>
                      ) : (
                        <><ShieldCheck className="size-4" /> Generate Invite</>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Vendor search */
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by business name, city, category, or vendor ID…"
                      value={vendorSearch}
                      onChange={(e) => setVendorSearch(e.target.value)}
                      className="pl-9"
                      autoFocus
                    />
                  </div>

                  {searching && (
                    <div className="py-4 text-center text-black/40">
                      <Loader2 className="mx-auto size-5 animate-spin" />
                    </div>
                  )}

                  {!searching && vendorResults.length > 0 && (
                    <div className="max-h-[300px] space-y-1 overflow-y-auto">
                      {vendorResults.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVendor(v)}
                          className="flex w-full items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-3 text-left transition-colors hover:bg-muted/30"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{v.name}</p>
                            <p className="text-xs text-black/40">
                              {v.city} · {v.category} · {v.id}
                            </p>
                          </div>
                          <Badge
                            className="shrink-0 rounded-full px-2 py-0.5 text-[10px]"
                            style={{
                              background: v.ownership_status === "claimed" ? "#EAF3DE" : "#FAEEDA",
                              color: v.ownership_status === "claimed" ? "#27500A" : "#633806",
                            }}
                          >
                            {v.ownership_status === "claimed" ? "Claimed" : "Unclaimed"}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}

                  {!searching && vendorSearch.length >= 2 && vendorResults.length === 0 && (
                    <div className="py-6 text-center text-sm text-black/40">
                      No vendors found. Try a different search.
                    </div>
                  )}

                  {!searching && vendorSearch.length < 2 && (
                    <div className="py-6 text-center text-sm text-black/40">
                      Start typing to search vendors by name, city, category, or ID.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
