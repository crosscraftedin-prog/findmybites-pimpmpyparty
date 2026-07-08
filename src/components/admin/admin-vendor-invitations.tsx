"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Send,
  Check,
  X,
  Loader2,
  Copy,
  ExternalLink,
  MessageCircle,
  Search,
  Store,
  ChevronDown,
} from "lucide-react";
import { COUNTRIES, getCountryByCode, type CountryInfo } from "@/lib/countries";

interface PendingVendor {
  id: string;
  name: string;
  slug: string;
  ecosystem: string;
  category: string;
  city: string;
  whatsapp: string | null;
  userEmail: string | null;
  invite_type: string | null;
  approved: boolean;
  createdAt: string;
}

interface InviteResult {
  vendor: { id: string; name: string };
  inviteUrl: string;
  activateUrl?: string;
  token: string;
  whatsappShareUrl: string;
  expiresAt: string;
}

const ECOSYSTEM_NAME: Record<string, string> = {
  FINDMYBITES: "FindMyBites",
  PIMPMYPARTY: "PimpMyParty",
};

export function AdminVendorInvitations() {
  const [tab, setTab] = React.useState("invite");
  const [pendingVendors, setPendingVendors] = React.useState<PendingVendor[]>([]);
  const [loadingPending, setLoadingPending] = React.useState(true);

  // Invite form state
  const [ecosystem, setEcosystem] = React.useState("FINDMYBITES");
  const [name, setName] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [selectedCountry, setSelectedCountry] = React.useState<CountryInfo | null>(null);
  const [countrySearch, setCountrySearch] = React.useState("");
  const [countryDropdownOpen, setCountryDropdownOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [inviteResult, setInviteResult] = React.useState<InviteResult | null>(null);

  // Approval state
  const [approvingId, setApprovingId] = React.useState<string | null>(null);
  const [approvalResult, setApprovalResult] = React.useState<InviteResult | null>(null);

  // Search for pending vendors
  const [search, setSearch] = React.useState("");

  const loadPendingVendors = async () => {
    setLoadingPending(true);
    try {
      const res = await fetch("/api/admin/vendors?approved=false&pageSize=50");
      if (!res.ok) return;
      const data = await res.json();
      setPendingVendors(data.vendors ?? []);
    } catch {
      // silent
    }
    setLoadingPending(false);
  };

  React.useEffect(() => {
    loadPendingVendors();
  }, []);

  // ── Send invite ──
  const sendInvite = async () => {
    if (!name.trim() || !whatsapp.trim()) {
      toast.error("Business name and WhatsApp number are required");
      return;
    }
    if (!selectedCountry) {
      toast.error("Please select a country");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/invite-vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          whatsapp: whatsapp.trim(),
          ecosystem,
          countryCode: selectedCountry.code,
          country: selectedCountry.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");

      setInviteResult(data);
      // Auto-open WhatsApp
      window.open(data.whatsappShareUrl, "_blank");
      toast.success(`Invite sent for ${name.trim()}! WhatsApp opened.`);
      // Reset form
      setName("");
      setWhatsapp("");
      setSelectedCountry(null);
    } catch (err: any) {
      toast.error(err.message);
    }
    setSending(false);
  };

  // ── Approve pending vendor ──
  const approveVendor = async (vendorId: string) => {
    setApprovingId(vendorId);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve");

      setApprovalResult(data);
      window.open(data.whatsappShareUrl, "_blank");
      toast.success("Vendor approved! Activation link sent via WhatsApp.");
      loadPendingVendors();
    } catch (err: any) {
      toast.error(err.message);
    }
    setApprovingId(null);
  };

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const filteredPending = React.useMemo(() => {
    if (!search.trim()) return pendingVendors;
    const q = search.toLowerCase();
    return pendingVendors.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.city?.toLowerCase().includes(q) ||
      v.whatsapp?.toLowerCase().includes(q)
    );
  }, [pendingVendors, search]);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Invite Vendor</h2>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="invite">Send Invite</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Vendors ({pendingVendors.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Send Invite Tab ── */}
        <TabsContent value="invite" className="mt-4">
          <div className="max-w-md space-y-4 rounded-xl border border-border bg-card p-5">
            {/* Platform */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Platform *
              </Label>
              <div className="mt-1.5 flex gap-2">
                {(["FINDMYBITES", "PIMPMYPARTY"] as const).map(eco => (
                  <button
                    key={eco}
                    onClick={() => setEcosystem(eco)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      ecosystem === eco
                        ? eco === "FINDMYBITES"
                          ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]"
                          : "border-purple-500 bg-purple-50 text-purple-600"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    {ECOSYSTEM_NAME[eco]}
                  </button>
                ))}
              </div>
            </div>

            {/* Country (searchable dropdown) */}
            <div className="relative">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Country *
              </Label>
              <button
                onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                className="mt-1.5 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm"
              >
                {selectedCountry ? (
                  <span className="flex items-center gap-2">
                    <span className="text-base">{selectedCountry.code === "IN" ? "🇮🇳" : selectedCountry.code === "AE" ? "🇦🇪" : selectedCountry.code === "US" ? "🇺🇸" : selectedCountry.code === "GB" ? "🇬🇧" : "🌍"}</span>
                    {selectedCountry.name} ({selectedCountry.code})
                  </span>
                ) : (
                  <span className="text-muted-foreground">Select country…</span>
                )}
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
              {countryDropdownOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-card shadow-lg">
                  <div className="sticky top-0 border-b border-border bg-card p-2">
                    <Input
                      placeholder="Search countries…"
                      value={countrySearch}
                      onChange={e => setCountrySearch(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>
                  {COUNTRIES
                    .filter(c => !countrySearch || c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.toLowerCase().includes(countrySearch.toLowerCase()))
                    .map(c => (
                      <button
                        key={c.code}
                        onClick={() => {
                          setSelectedCountry(c);
                          setCountryDropdownOpen(false);
                          setCountrySearch("");
                          // Auto-prefix WhatsApp with dialing code
                          setWhatsapp(`+${c.dialCode} `);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/30"
                      >
                        <span>{c.name} ({c.code})</span>
                        <span className="text-xs text-muted-foreground">+{c.dialCode}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Business Name */}
            <div>
              <Label htmlFor="biz-name">Business Name *</Label>
              <Input
                id="biz-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sugar & Bloom Bakery"
                className="mt-1"
              />
            </div>

            {/* WhatsApp Number (auto-prefixed with dialing code) */}
            <div>
              <Label htmlFor="biz-whatsapp">WhatsApp Number *</Label>
              <Input
                id="biz-whatsapp"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder={selectedCountry ? `+${selectedCountry.dialCode} 98765 43210` : "Select country first"}
                className="mt-1"
                disabled={!selectedCountry}
              />
              {selectedCountry && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Dialing code +{selectedCountry.dialCode} auto-filled. Enter the local number.
                </p>
              )}
            </div>

            <Button
              onClick={sendInvite}
              disabled={sending || !name.trim() || !whatsapp.trim() || !selectedCountry}
              className="w-full gap-1.5 bg-[#FF6B35] text-white hover:bg-[#e85a2a]"
            >
              {sending ? (
                <><Loader2 className="size-4 animate-spin" /> Sending…</>
              ) : (
                <><Send className="size-4" /> Send Invite</>
              )}
            </Button>

            <p className="text-center text-[11px] text-muted-foreground">
              The vendor will be created as approved. WhatsApp opens automatically with a pre-filled invitation message. Business details are collected after the vendor activates their account.
            </p>
          </div>
        </TabsContent>

        {/* ── Pending Vendors Tab ── */}
        <TabsContent value="pending" className="mt-4">
          {/* Search */}
          <div className="relative mb-3 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, city, or WhatsApp…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loadingPending ? (
            <div className="py-8 text-center text-muted-foreground">
              <Loader2 className="mx-auto size-6 animate-spin" />
            </div>
          ) : filteredPending.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-10 text-center">
              <Store className="mx-auto size-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium">No pending vendors</p>
              <p className="mt-1 text-xs text-muted-foreground">
                New vendor registrations will appear here for approval.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPending.map(v => (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {ECOSYSTEM_NAME[v.ecosystem] || "—"} · {v.category || "—"}
                    </p>
                    <p className="truncate text-sm font-bold">{v.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {v.city || "Unknown city"} · {v.whatsapp || "No WhatsApp"} ·{" "}
                      {new Date(v.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-full px-2 py-0.5 text-[10px] uppercase bg-amber-100 text-amber-700">
                      Pending
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => approveVendor(v.id)}
                      disabled={approvingId === v.id}
                      className="gap-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      {approvingId === v.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <><Check className="size-3.5" /> Approve</>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Invite Result Dialog ── */}
      <Dialog open={!!inviteResult} onOpenChange={(o) => !o && setInviteResult(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Sent! 🎉</DialogTitle>
            <DialogDescription>
              {inviteResult?.vendor.name} has been created and approved. WhatsApp opened with the invitation message.
            </DialogDescription>
          </DialogHeader>
          {inviteResult && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Activation Link (valid for 7 days)
                </p>
                <code className="block break-all text-xs">{inviteResult.inviteUrl}</code>
              </div>
              <div className="grid gap-2">
                <Button
                  onClick={() => copyLink(inviteResult.inviteUrl)}
                  className="w-full gap-1.5"
                >
                  <Copy className="size-4" /> Copy Link
                </Button>
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(inviteResult.whatsappShareUrl, "_blank")}
                    className="flex-1 gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe57]"
                  >
                    <MessageCircle className="size-4" /> WhatsApp
                  </Button>
                  <Button
                    onClick={() => window.open(inviteResult.inviteUrl, "_blank")}
                    variant="outline"
                    className="flex-1 gap-1.5"
                  >
                    <ExternalLink className="size-4" /> Open
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setInviteResult(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Approval Result Dialog ── */}
      <Dialog open={!!approvalResult} onOpenChange={(o) => !o && setApprovalResult(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vendor Approved — Activate Account ✅</DialogTitle>
            <DialogDescription>
              {approvalResult?.vendor.name} is now approved. Share the activation link via WhatsApp so they can complete their setup.
            </DialogDescription>
          </DialogHeader>
          {approvalResult && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Activation Link (valid for 7 days)
                </p>
                <code className="block break-all text-xs">{approvalResult.activateUrl || approvalResult.inviteUrl}</code>
              </div>
              <div className="grid gap-2">
                <Button
                  onClick={() => copyLink(approvalResult.activateUrl || approvalResult.inviteUrl)}
                  className="w-full gap-1.5"
                >
                  <Copy className="size-4" /> Copy Link
                </Button>
                <Button
                  onClick={() => window.open(approvalResult.whatsappShareUrl, "_blank")}
                  className="w-full gap-1.5 bg-[#25D366] text-white hover:bg-[#1ebe57]"
                >
                  <MessageCircle className="size-4" /> Share on WhatsApp
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setApprovalResult(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
