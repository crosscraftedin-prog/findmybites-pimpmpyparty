"use client";

import * as React from "react";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";
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
import { Plus, Send, Copy, Loader2, Store, MessageCircle } from "lucide-react";
import { CATEGORIES, ECOSYSTEM_META } from "@/lib/constants";
import type { Ecosystem } from "@/lib/types";

interface CreatedVendor {
  id: string;
  name: string;
  whatsapp: string;
  inviteUrl: string;
}

export function AdminCreateBusiness({ ecosystem }: { ecosystem: Ecosystem }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [created, setCreated] = React.useState<CreatedVendor | null>(null);

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
  };

  const createBusiness = async () => {
    if (!name.trim() || !whatsapp.trim() || !category || !city.trim()) {
      toast.error("Please fill in business name, WhatsApp number, category, and city");
      return;
    }

    setLoading(true);
    try {
      // 1. Create the vendor listing (unclaimed, not approved)
      // Use supabase client to insert directly (admin is authenticated)
      const vendorData: Record<string, any> = {
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36),
        ecosystem,
        category,
        tagline: tagline.trim() || `Business listing`,
        description: description.trim() || `${name.trim()} — ${category}`,
        city: city.trim(),
        country: country.trim(),
        countryCode: country.trim() === "India" ? "IN" : "US",
        continent: country.trim() === "India" ? "Asia" : "North America",
        currency: country.trim() === "India" ? "INR" : "USD",
        priceRange: "$$",
        basePrice: 0,
        rating: 0,
        reviewCount: 0,
        heroImage: "",
        avatarImage: "",
        gallery: "[]",
        tags: "[]",
        featured: false,
        verified: false,
        approved: false,
        responseTime: "24 hours",
        yearsActive: 1,
        completedBookings: 0,
        whatsapp: whatsapp.trim().replace(/\D/g, ""),
        ownership_status: "unclaimed",
        latitude: null,
        longitude: null,
      };

      const { data: vendor, error: vendorError } = await supabaseBrowser
        .from("Vendor")
        .insert(vendorData)
        .select("id,name,whatsapp")
        .single();

      if (vendorError || !vendor) {
        toast.error("Failed to create business: " + (vendorError?.message || "Unknown error"));
        setLoading(false);
        return;
      }

      // 2. Generate invite token
      const { data: tokenData, error: tokenError } = await supabaseBrowser.rpc(
        "generate_invite_token",
        { p_vendor_id: vendor.id, p_ttl_hours: 168 }
      );

      if (tokenError || !tokenData) {
        toast.error("Business created but invite token failed: " + tokenError?.message);
        setLoading(false);
        return;
      }

      const tokenRow = Array.isArray(tokenData) ? tokenData[0] : tokenData;
      const inviteUrl = `${window.location.origin}/claim-token/${tokenRow.token}`;

      setCreated({
        id: vendor.id,
        name: vendor.name,
        whatsapp: vendor.whatsapp || whatsapp.trim(),
        inviteUrl,
      });

      toast.success(`Business "${vendor.name}" created! Invite link ready.`);
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
            /* Success state — show invite link */
            <div className="space-y-4">
              <div className="rounded-lg border border-green-500/30 bg-green-50 p-4">
                <p className="font-medium text-green-700">✓ {created.name} created</p>
                <p className="mt-1 text-xs text-green-600">
                  Status: Unclaimed · Pending vendor verification
                </p>
              </div>

              <div className="rounded-lg border border-black/10 bg-muted/20 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-black/40">
                  Invite Link (valid for 7 days)
                </p>
                <code className="block break-all text-xs">{created.inviteUrl}</code>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={copyLink}
                  className="flex-1 gap-1.5 rounded-lg bg-[#1A1A1A] text-white hover:bg-black"
                >
                  <Copy className="size-4" /> Copy Link
                </Button>
                <Button
                  onClick={shareWhatsApp}
                  className="flex-1 gap-1.5 rounded-lg bg-[#25D366] text-white hover:bg-[#1ebe57]"
                >
                  <MessageCircle className="size-4" /> Send on WhatsApp
                </Button>
              </div>

              <div className="rounded-lg border border-blue-500/20 bg-blue-50 p-3 text-xs text-blue-700">
                <p className="font-semibold">What happens next:</p>
                <ol className="mt-1 list-decimal pl-4 space-y-0.5">
                  <li>Vendor clicks the link</li>
                  <li>Signs in with Google</li>
                  <li>Fills in business details</li>
                  <li>You approve in the Claims tab</li>
                  <li>Vendor goes live!</li>
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
