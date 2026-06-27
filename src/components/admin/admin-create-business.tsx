"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Copy, Loader2, Store, MessageCircle, Download, Image as ImageIcon } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import type { Ecosystem } from "@/lib/types";
import {
  generateInviteCard,
  downloadInviteCard,
  getWhatsAppShareMessage,
} from "@/lib/generate-invite-card";

interface CreatedVendor {
  id: string;
  name: string;
  whatsapp: string;
  inviteUrl: string;
  category?: string;
  city?: string;
  country?: string;
}

export function AdminCreateBusiness({ ecosystem }: { ecosystem: Ecosystem }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [created, setCreated] = React.useState<CreatedVendor | null>(null);
  const [inviteCardUrl, setInviteCardUrl] = React.useState<string | null>(null);
  const [generatingCard, setGeneratingCard] = React.useState(false);

  // Form state
  const [name, setName] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [city, setCity] = React.useState("");
  const [country, setCountry] = React.useState("India");
  const [tagline, setTagline] = React.useState("");
  const [description, setDescription] = React.useState("");

  const cats = CATEGORIES.filter((c) => c.ecosystem === ecosystem);
  const ecoColor = ecosystem === "FINDMYBITES" ? "#D85A30" : "#7F77DD";

  const resetForm = () => {
    setName("");
    setWhatsapp("");
    setCategory("");
    setCity("");
    setCountry("India");
    setTagline("");
    setDescription("");
    setCreated(null);
    setInviteCardUrl(null);
    setGeneratingCard(false);
  };

  const createBusiness = async () => {
    if (!name.trim() || !whatsapp.trim() || !category || !city.trim()) {
      toast.error("Please fill in business name, WhatsApp number, category, and city");
      return;
    }

    setLoading(true);
    try {
      // Use server-side API route (bypasses RLS via Prisma)
      const res = await fetch("/api/admin/create-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          whatsapp: whatsapp.trim(),
          category,
          ecosystem,
          city: city.trim(),
          country: country.trim(),
          tagline: tagline.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create business");
        setLoading(false);
        return;
      }

      setCreated({
        id: data.vendor.id,
        name: data.vendor.name,
        whatsapp: data.vendor.whatsapp || whatsapp.trim(),
        inviteUrl: data.inviteUrl,
        category: data.vendor.category || category,
        city: data.vendor.city || city,
        country: data.vendor.country || "Unknown",
      });

      toast.success(`Business "${data.vendor.name}" created! Invite link ready.`);

      // Auto-generate invite card
      setGeneratingCard(true);
      try {
        const cardUrl = await generateInviteCard({
          businessName: data.vendor.name,
          category: data.vendor.category || category,
          city: data.vendor.city || city,
          country: data.vendor.country || "Unknown",
          claimUrl: data.inviteUrl,
        });
        setInviteCardUrl(cardUrl);
      } catch (cardErr) {
        console.error("Invite card generation failed:", cardErr);
      }
      setGeneratingCard(false);
    } catch (err) {
      toast.error("Something went wrong");
      console.error(err);
    }
    setLoading(false);
  };

  const copyLink = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(created.inviteUrl);
    toast.success("Invite link copied!");
  };

  const shareWhatsApp = () => {
    if (!created) return;
    const text = encodeURIComponent(
      `Hi! I've created your business listing "${created.name}" on FindMyBites × PimpMyParty. Click here to claim it: ${created.inviteUrl}`
    );
    const phone = created.whatsapp.replace(/\D/g, "");
    const url = phone
      ? `https://wa.me/${phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <Button
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
        className="gap-1.5 rounded-lg text-white"
        style={{ background: ecoColor }}
      >
        <Plus className="size-4" />
        Create Business
      </Button>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {created ? "Business Created! 🎉" : "Create New Business"}
            </DialogTitle>
            <DialogDescription>
              {created
                ? "Send the invite link to the vendor via WhatsApp. They'll sign in, fill in details, and you'll approve them."
                : `Create a business listing and generate an invite link for the vendor to claim.`}
            </DialogDescription>
          </DialogHeader>

          {created ? (
            /* Success state — show invite card + link */
            <div className="space-y-4">
              <div className="rounded-lg border border-green-500/30 bg-green-50 p-4">
                <p className="font-medium text-green-700">✓ {created.name} created</p>
                <p className="mt-1 text-xs text-green-600">
                  Status: Unclaimed · Pending vendor verification
                </p>
              </div>

              {/* Invite Card Preview */}
              {generatingCard && (
                <div className="flex items-center justify-center rounded-lg border border-black/10 bg-muted/20 py-12">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Generating invite card…</span>
                </div>
              )}
              {inviteCardUrl && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    📸 Invitation Card
                  </p>
                  <div className="overflow-hidden rounded-lg border border-black/10">
                    <img src={inviteCardUrl} alt="Invite card" className="w-full" />
                  </div>
                </div>
              )}

              {/* Invite Link */}
              <div className="rounded-lg border border-black/10 bg-muted/20 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-black/40">
                  Invite Link (valid for 7 days)
                </p>
                <code className="block break-all text-xs">{created.inviteUrl}</code>
              </div>

              {/* Action buttons */}
              <div className="grid gap-2">
                {inviteCardUrl && (
                  <Button
                    onClick={() => downloadInviteCard(inviteCardUrl, created.name)}
                    className="w-full gap-1.5 rounded-lg text-white"
                    style={{ background: "#D85A30" }}
                  >
                    <Download className="size-4" /> Download Invite Card
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (!created) return;
                      const msg = encodeURIComponent(getWhatsAppShareMessage({
                        businessName: created.name,
                        category: created.category || "",
                        city: created.city || "",
                        country: created.country || "",
                        claimUrl: created.inviteUrl,
                      }));
                      const phone = created.whatsapp.replace(/\D/g, "");
                      const url = phone
                        ? `https://wa.me/${phone}?text=${msg}`
                        : `https://wa.me/?text=${msg}`;
                      window.open(url, "_blank");
                    }}
                    className="flex-1 gap-1.5 rounded-lg bg-[#25D366] text-white hover:bg-[#1ebe57]"
                  >
                    <MessageCircle className="size-4" /> Share on WhatsApp
                  </Button>
                  <Button
                    onClick={copyLink}
                    variant="outline"
                    className="flex-1 gap-1.5 rounded-lg"
                  >
                    <Copy className="size-4" /> Copy Link
                  </Button>
                </div>
              </div>

              {inviteCardUrl && (
                <p className="text-[11px] text-muted-foreground">
                  💡 Tip: Download the card first, then share it on WhatsApp along with the message for best results.
                </p>
              )}

              <div className="rounded-lg border border-blue-500/20 bg-blue-50 p-3 text-xs text-blue-700">
                <p className="font-semibold">What happens next:</p>
                <ol className="mt-1 list-decimal pl-4 space-y-0.5">
                  <li>Vendor clicks the link or scans QR</li>
                  <li>Signs in with Google</li>
                  <li>Listing is auto-claimed & approved</li>
                  <li>Vendor goes to their dashboard</li>
                  <li>Listing goes live!</li>
                </ol>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => {
                    resetForm();
                    setOpen(false);
                  }}
                  className="rounded-lg"
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* Form state — create new business */
            <div className="space-y-4">
              <div>
                <Label htmlFor="biz-name">Business Name *</Label>
                <Input
                  id="biz-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sweet Dreams Bakery"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="biz-whatsapp">WhatsApp Number *</Label>
                  <Input
                    id="biz-whatsapp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+919999999999"
                  />
                </div>
                <div>
                  <Label htmlFor="biz-category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="biz-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {cats.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="biz-city">City *</Label>
                  <Input
                    id="biz-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Hyderabad"
                  />
                </div>
                <div>
                  <Label htmlFor="biz-country">Country</Label>
                  <Input
                    id="biz-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. India"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="biz-tagline">Tagline (optional)</Label>
                <Input
                  id="biz-tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Custom cakes for every occasion"
                />
              </div>

              <div>
                <Label htmlFor="biz-description">Description (optional)</Label>
                <Textarea
                  id="biz-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the business..."
                  rows={3}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createBusiness}
                  disabled={loading}
                  className="gap-1.5 rounded-lg text-white"
                  style={{ background: ecoColor }}
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Store className="size-4" />
                  )}
                  Create & Generate Invite
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
