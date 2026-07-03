"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Eye, Save, Loader2, Store, MapPin, Phone, Clock, Truck, Image as ImageIcon,
  Search, Check, Plus, X, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Vendor } from "@/lib/types";
import { CreateVendorForm } from "@/components/marketplace/create-vendor-form";
import { useVendor } from "@/lib/queries";
import { ImageUpload, GalleryUpload } from "./image-upload";

interface MyListingProps {
  vendor: Vendor;
}

const COUNTRIES = [
  "India", "United Arab Emirates", "United States", "United Kingdom", "Australia",
  "Canada", "Singapore", "South Africa", "Nigeria", "Kenya", "Saudi Arabia",
  "Qatar", "Kuwait", "Oman", "Bahrain", "Germany", "France", "Netherlands",
  "Spain", "Italy", "Portugal", "Switzerland", "Sweden", "Norway", "Denmark",
  "Japan", "South Korea", "Thailand", "Malaysia", "Indonesia", "Philippines",
  "Brazil", "Mexico", "Argentina", "Chile", "Colombia", "Peru",
];

const BUSINESS_TYPES = [
  { value: "home", label: "Home Business" },
  { value: "shop", label: "Shop / Store" },
  { value: "studio", label: "Studio" },
  { value: "cloud_kitchen", label: "Cloud Kitchen" },
  { value: "event_company", label: "Event Company" },
  { value: "freelancer", label: "Freelancer" },
];

export function MyListing({ vendor }: MyListingProps) {
  const router = useRouter();
  const { data: fullVendor, isLoading } = useVendor(vendor.slug);
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("business");

  // Form state
  const [form, setForm] = React.useState<any>({});
  const [gallery, setGallery] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (fullVendor) {
      setForm({
        name: fullVendor.name || "",
        tagline: fullVendor.tagline || "",
        description: fullVendor.description || "",
        category: fullVendor.category || "",
        subcategory: (fullVendor as any).subcategory || "",
        businessType: (fullVendor as any).businessType || "",
        yearStarted: (fullVendor as any).yearStarted || "",
        businessRegNumber: (fullVendor as any).businessRegNumber || "",
        gstVatNumber: (fullVendor as any).gstVatNumber || "",
        languagesSpoken: (fullVendor as any).languagesSpoken || "",
        // Location
        country: fullVendor.country || "",
        state: (fullVendor as any).state || "",
        city: fullVendor.city || "",
        address: (fullVendor as any).address || "",
        zipCode: (fullVendor as any).zipCode || "",
        latitude: (fullVendor as any).latitude || "",
        longitude: (fullVendor as any).longitude || "",
        serviceRadiusKm: (fullVendor as any).serviceRadiusKm || "",
        hideAddress: (fullVendor as any).hideAddress || false,
        // Contact
        whatsapp: (fullVendor as any).whatsapp || "",
        phone: (fullVendor as any).phone || "",
        email: (fullVendor as any).userEmail || "",
        website: (fullVendor as any).website || "",
        instagram: (fullVendor as any).instagram || "",
        facebook: (fullVendor as any).facebook || "",
        youtube: (fullVendor as any).youtube || "",
        tiktok: (fullVendor as any).tiktok || "",
        pinterest: (fullVendor as any).pinterest || "",
        linkedin: (fullVendor as any).linkedin || "",
        telegram: (fullVendor as any).telegram || "",
        // Hours
        openHours: (fullVendor as any).openHours || "",
        holidayMode: (fullVendor as any).holidayMode || false,
        vacationMode: (fullVendor as any).vacationMode || false,
        emergencyClosure: (fullVendor as any).emergencyClosure || false,
        // Delivery
        deliveryAvailable: (fullVendor as any).deliveryAvailable || false,
        pickupAvailable: (fullVendor as any).pickupAvailable || false,
        homeService: (fullVendor as any).homeService || false,
        onlineConsultation: (fullVendor as any).onlineConsultation || false,
        minOrder: (fullVendor as any).minOrder || "",
        maxOrder: (fullVendor as any).maxOrder || "",
        prepTime: (fullVendor as any).prepTime || "",
        bookingNotice: (fullVendor as any).bookingNotice || "",
        // SEO
        metaTitle: (fullVendor as any).metaTitle || "",
        metaDescription: (fullVendor as any).metaDescription || "",
        // Media
        heroImage: fullVendor.heroImage || "",
        avatarImage: fullVendor.avatarImage || "",
      });
      try {
        setGallery(typeof (fullVendor as any).gallery === "string"
          ? JSON.parse((fullVendor as any).gallery) : ((fullVendor as any).gallery || []));
      } catch { setGallery([]); }
    }
  }, [fullVendor]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, gallery }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success("Profile saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
    setSaving(false);
  };

  // Profile completeness
  const completeness = React.useMemo(() => {
    if (!form.name) return 0;
    const checks = [
      !!form.name, !!form.tagline, !!form.description, !!form.avatarImage,
      !!form.heroImage, !!form.address, !!form.whatsapp, gallery.length > 0,
      !!form.openHours, !!form.website, !!form.latitude, !!form.metaTitle,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form, gallery]);

  if (isLoading || !fullVendor) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Editing</p>
            <p className="text-base font-bold">{vendor.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full", completeness >= 80 ? "bg-emerald-500" : completeness >= 50 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${completeness}%` }} />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">{completeness}% complete</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/vendor/${vendor.slug}`)}>
              <Eye className="size-4" /> Preview
            </Button>
            <Button size="sm" onClick={save} disabled={saving} className="bg-brand text-brand-foreground hover:bg-brand/90">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="business" className="gap-1"><Store className="size-3.5" /> Business</TabsTrigger>
          <TabsTrigger value="location" className="gap-1"><MapPin className="size-3.5" /> Location</TabsTrigger>
          <TabsTrigger value="contact" className="gap-1"><Phone className="size-3.5" /> Contact</TabsTrigger>
          <TabsTrigger value="hours" className="gap-1"><Clock className="size-3.5" /> Hours</TabsTrigger>
          <TabsTrigger value="delivery" className="gap-1"><Truck className="size-3.5" /> Delivery</TabsTrigger>
          <TabsTrigger value="media" className="gap-1"><ImageIcon className="size-3.5" /> Media</TabsTrigger>
          <TabsTrigger value="seo" className="gap-1"><Search className="size-3.5" /> SEO</TabsTrigger>
        </TabsList>

        {/* Business Info */}
        <TabsContent value="business" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Business Name *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="mt-1" /></div>
            <div><Label>Short Tagline</Label><Input value={form.tagline} onChange={e => set("tagline", e.target.value)} placeholder="Custom cakes since 2015" className="mt-1" /></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => set("description", e.target.value)} className="mt-1 min-h-[100px]" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label><Input value={form.category} onChange={e => set("category", e.target.value)} className="mt-1" /></div>
            <div><Label>Subcategory</Label><Input value={form.subcategory} onChange={e => set("subcategory", e.target.value)} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Business Type</Label>
              <select value={form.businessType} onChange={e => set("businessType", e.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Select…</option>
                {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div><Label>Year Started</Label><Input type="number" value={form.yearStarted} onChange={e => set("yearStarted", e.target.value)} placeholder="2015" className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Business Reg. Number (optional)</Label><Input value={form.businessRegNumber} onChange={e => set("businessRegNumber", e.target.value)} className="mt-1" /></div>
            <div><Label>GST/VAT Number (optional)</Label><Input value={form.gstVatNumber} onChange={e => set("gstVatNumber", e.target.value)} className="mt-1" /></div>
          </div>
          <div><Label>Languages Spoken</Label><Input value={form.languagesSpoken} onChange={e => set("languagesSpoken", e.target.value)} placeholder="English, Hindi, Arabic" className="mt-1" /></div>
        </TabsContent>

        {/* Location */}
        <TabsContent value="location" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Country</Label>
              <select value={form.country} onChange={e => set("country", e.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Select…</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><Label>State/Province</Label><Input value={form.state} onChange={e => set("state", e.target.value)} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>City</Label><Input value={form.city} onChange={e => set("city", e.target.value)} className="mt-1" /></div>
            <div><Label>Area / Neighborhood</Label><Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Bandra West" className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Postal Code</Label><Input value={form.zipCode} onChange={e => set("zipCode", e.target.value)} className="mt-1" /></div>
            <div><Label>Latitude</Label><Input type="number" step="any" value={form.latitude} onChange={e => set("latitude", e.target.value)} className="mt-1" /></div>
            <div><Label>Longitude</Label><Input type="number" step="any" value={form.longitude} onChange={e => set("longitude", e.target.value)} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Service Radius (km)</Label><Input type="number" value={form.serviceRadiusKm} onChange={e => set("serviceRadiusKm", e.target.value)} placeholder="10" className="mt-1" /></div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm pb-2">
                <input type="checkbox" checked={form.hideAddress} onChange={e => set("hideAddress", e.target.checked)} className="size-4 rounded border-border" />
                Hide exact address (show "Serving {form.city}" instead)
              </label>
            </div>
          </div>
        </TabsContent>

        {/* Contact */}
        <TabsContent value="contact" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="+91 98765 43210" className="mt-1" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} className="mt-1" /></div>
            <div><Label>Website</Label><Input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://…" className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Instagram</Label><Input value={form.instagram} onChange={e => set("instagram", e.target.value)} className="mt-1" /></div>
            <div><Label>Facebook</Label><Input value={form.facebook} onChange={e => set("facebook", e.target.value)} className="mt-1" /></div>
            <div><Label>YouTube</Label><Input value={form.youtube} onChange={e => set("youtube", e.target.value)} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>TikTok</Label><Input value={form.tiktok} onChange={e => set("tiktok", e.target.value)} className="mt-1" /></div>
            <div><Label>Pinterest</Label><Input value={form.pinterest} onChange={e => set("pinterest", e.target.value)} className="mt-1" /></div>
            <div><Label>LinkedIn</Label><Input value={form.linkedin} onChange={e => set("linkedin", e.target.value)} className="mt-1" /></div>
          </div>
          <div><Label>Telegram</Label><Input value={form.telegram} onChange={e => set("telegram", e.target.value)} className="mt-1" /></div>
        </TabsContent>

        {/* Hours */}
        <TabsContent value="hours" className="space-y-4">
          <div>
            <Label>Opening Hours</Label>
            <Textarea value={form.openHours} onChange={e => set("openHours", e.target.value)}
              placeholder={"Mon-Sat: 9:00 AM - 9:00 PM\nSun: Closed"} className="mt-1 min-h-[80px]" />
            <p className="mt-1 text-xs text-muted-foreground">Enter your weekly schedule. Customers see this on your profile.</p>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.holidayMode} onChange={e => set("holidayMode", e.target.checked)} className="size-4 rounded border-border" />
              Holiday Mode (temporarily pause new enquiries)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.vacationMode} onChange={e => set("vacationMode", e.target.checked)} className="size-4 rounded border-border" />
              Vacation Mode (show "Away" banner on profile)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.emergencyClosure} onChange={e => set("emergencyClosure", e.target.checked)} className="size-4 rounded border-border" />
              Emergency Closure (show "Temporarily Closed" on profile)
            </label>
          </div>
        </TabsContent>

        {/* Delivery & Service */}
        <TabsContent value="delivery" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.deliveryAvailable} onChange={e => set("deliveryAvailable", e.target.checked)} className="size-4 rounded border-border" /> Delivery Available</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.pickupAvailable} onChange={e => set("pickupAvailable", e.target.checked)} className="size-4 rounded border-border" /> Pickup Available</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.homeService} onChange={e => set("homeService", e.target.checked)} className="size-4 rounded border-border" /> Home Service</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.onlineConsultation} onChange={e => set("onlineConsultation", e.target.checked)} className="size-4 rounded border-border" /> Online Consultation</label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Minimum Order</Label><Input type="number" value={form.minOrder} onChange={e => set("minOrder", e.target.value)} className="mt-1" /></div>
            <div><Label>Maximum Order</Label><Input type="number" value={form.maxOrder} onChange={e => set("maxOrder", e.target.value)} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Preparation Time</Label><Input value={form.prepTime} onChange={e => set("prepTime", e.target.value)} placeholder="24 hours" className="mt-1" /></div>
            <div><Label>Booking Notice</Label><Input value={form.bookingNotice} onChange={e => set("bookingNotice", e.target.value)} placeholder="2 days advance" className="mt-1" /></div>
          </div>
        </TabsContent>

        {/* Media Gallery */}
        <TabsContent value="media" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Business Logo</Label>
              <p className="mb-2 text-xs text-muted-foreground">Square image, min 200×200px</p>
              <ImageUpload
                value={form.avatarImage}
                onChange={(url) => set("avatarImage", url)}
                folder="logo"
                label="Upload Logo"
                aspect="square"
                camera
                vendorId={vendor.id}
                autoSave
                field="avatarImage"
              />
            </div>
            <div>
              <Label>Cover Banner</Label>
              <p className="mb-2 text-xs text-muted-foreground">Wide image, 16:9 ratio recommended</p>
              <ImageUpload
                value={form.heroImage}
                onChange={(url) => set("heroImage", url)}
                folder="cover"
                label="Upload Cover Banner"
                aspect="wide"
                vendorId={vendor.id}
                autoSave
                field="heroImage"
              />
            </div>
          </div>
          <div>
            <Label>Gallery Images</Label>
            <p className="mb-2 text-xs text-muted-foreground">Upload up to 10 images. First image is the cover.</p>
            <GalleryUpload
              images={gallery}
              onChange={setGallery}
              maxImages={10}
              vendorId={vendor.id}
            />
          </div>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo" className="space-y-4">
          <div>
            <Label>SEO Title</Label>
            <Input value={form.metaTitle} onChange={e => set("metaTitle", e.target.value)} maxLength={60} className="mt-1" />
            <p className="mt-1 text-[10px] text-muted-foreground">{(form.metaTitle || "").length}/60</p>
          </div>
          <div>
            <Label>SEO Description</Label>
            <Textarea value={form.metaDescription} onChange={e => set("metaDescription", e.target.value)} maxLength={160} className="mt-1 min-h-[60px]" />
            <p className="mt-1 text-[10px] text-muted-foreground">{(form.metaDescription || "").length}/160</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
            <p className="font-semibold">SEO Tips:</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              <li>Keep title under 60 characters</li>
              <li>Keep description between 120-160 characters</li>
              <li>Include your city and main service</li>
              <li>Structured data is auto-generated</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
