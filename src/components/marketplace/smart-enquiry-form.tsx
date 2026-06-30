"use client";

import * as React from "react";
import { Loader2, Send, Shield, Upload, Sparkles, X, Check, Calendar, Users, MapPin, Phone, Mail, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/marketplace/image-upload";
import { cn } from "@/lib/utils";

interface SmartEnquiryFormProps {
  vendorId: string;
  vendorName: string;
  vendorCity: string;
  productId?: string;
  productName?: string;
  productPrice?: number;
  currencySymbol?: string;
  eventType?: string;
}

const EVENT_TYPES_FOOD = [
  "Birthday", "Wedding", "Anniversary", "Baby Shower", "Corporate Event",
  "Engagement", "Festival", "Custom Order", "Other",
];

const EVENT_TYPES_PARTY = [
  "Wedding", "Birthday", "Corporate Event", "Anniversary", "Engagement",
  "Kids Party", "Festival", "Concert", "Other",
];

const CONTACT_METHODS = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Phone Call" },
];

export function SmartEnquiryForm({
  vendorId,
  vendorName,
  vendorCity,
  productId,
  productName,
  productPrice,
  currencySymbol = "$",
  eventType: defaultEventType,
}: SmartEnquiryFormProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [showQualification, setShowQualification] = React.useState(false);
  const [leadScore, setLeadScore] = React.useState(0);

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    phone: "",
    eventType: defaultEventType || "",
    eventDate: "",
    eventTime: "",
    guests: "",
    budget: "",
    address: "",
    message: "",
    notes: "",
    preferredContact: "email",
    referenceImage: "",
  });

  // AI pre-qualification answers (dynamic based on event type)
  const [qualification, setQualification] = React.useState<Record<string, string>>({});

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Calculate live lead score for the customer to see
  React.useEffect(() => {
    let score = 0;
    if (form.budget && form.budget !== "Not specified") score += 20;
    if (form.eventDate) score += 20;
    if (form.phone) score += 15;
    if (form.address) score += 10;
    if (form.notes) score += 5;
    if (form.guests && Number(form.guests) > 0) score += 10;
    if (form.preferredContact) score += 5;
    const qualCount = Object.values(qualification).filter((v) => v && v.trim()).length;
    score += Math.min(qualCount * 5, 20);
    setLeadScore(Math.min(score, 100));
  }, [form, qualification]);

  // Get qualification questions based on event type
  const qualificationQuestions = React.useMemo(() => {
    const et = form.eventType.toLowerCase();
    if (et.includes("cake") || et.includes("birthday") || et.includes("wedding")) {
      return [
        { key: "flavour", label: "Preferred flavour?", placeholder: "e.g. Chocolate, Vanilla" },
        { key: "theme", label: "Theme/Design?", placeholder: "e.g. Gold theme, Marvel" },
        { key: "eggless", label: "Eggless required?", placeholder: "Yes / No" },
        { key: "dietary", label: "Dietary restrictions?", placeholder: "e.g. Vegan, Gluten-free" },
      ];
    }
    if (et.includes("decor") || et.includes("decoration")) {
      return [
        { key: "venue", label: "Venue type?", placeholder: "Indoor / Outdoor" },
        { key: "theme", label: "Theme?", placeholder: "e.g. Royal, Boho" },
        { key: "colors", label: "Balloon colours?", placeholder: "e.g. Gold, White" },
        { key: "setup", label: "Setup time needed?", placeholder: "e.g. Morning" },
      ];
    }
    if (et.includes("photo") || et.includes("video")) {
      return [
        { key: "hours", label: "Coverage hours?", placeholder: "e.g. 8 hours" },
        { key: "ceremony", label: "Ceremony only?", placeholder: "Yes / No" },
        { key: "drone", label: "Drone required?", placeholder: "Yes / No" },
        { key: "album", label: "Album required?", placeholder: "Yes / No" },
      ];
    }
    if (et.includes("dj") || et.includes("music") || et.includes("entertainment")) {
      return [
        { key: "hours", label: "Performance hours?", placeholder: "e.g. 4 hours" },
        { key: "genre", label: "Music genre?", placeholder: "e.g. Bollywood, EDM" },
        { key: "equipment", label: "Equipment needed?", placeholder: "Yes / No" },
      ];
    }
    return [
      { key: "details", label: "Any specific requirements?", placeholder: "Tell us more..." },
    ];
  }, [form.eventType]);

  const valid = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.eventType && form.eventDate;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings/smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          productId: productId || undefined,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone || undefined,
          eventType: form.eventType,
          eventDate: form.eventDate,
          eventTime: form.eventTime || undefined,
          eventCity: vendorCity,
          guests: parseInt(form.guests, 10) || 0,
          budget: form.budget || "Not specified",
          address: form.address || undefined,
          message: form.message || form.notes || `Enquiry for ${productName || form.eventType}`,
          notes: form.notes || undefined,
          referenceImage: form.referenceImage || undefined,
          preferredContact: form.preferredContact,
          aiQualification: Object.keys(qualification).length > 0 ? qualification : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      const data = await res.json();

      setDone(true);
      toast.success("Enquiry sent!", {
        description: `${vendorName} will respond shortly. Lead score: ${data.leadScore}/100`,
      });

      // Track analytics
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          eventType: "contact_click",
          productId: productId || undefined,
        }),
      }).catch(() => {});
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-brand-border bg-brand-soft p-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-brand text-brand-foreground">
          <Check className="size-7" />
        </div>
        <h3 className="mt-3 text-lg font-bold">Enquiry sent to {vendorName}! ✅</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          They typically respond within a few hours. Your lead quality score: <span className="font-bold text-brand">{leadScore}/100</span>
        </p>
        <Button variant="outline" className="mt-4 w-full" onClick={() => {
          setDone(false);
          setForm({
            name: "", email: "", phone: "", eventType: defaultEventType || "",
            eventDate: "", eventTime: "", guests: "", budget: "", address: "",
            message: "", notes: "", preferredContact: "email", referenceImage: "",
          });
          setQualification({});
        }}>
          Send another enquiry
        </Button>
      </div>
    );
  }

  const eventTypes = form.eventType && EVENT_TYPES_FOOD.includes(form.eventType)
    ? EVENT_TYPES_FOOD
    : EVENT_TYPES_PARTY;

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
      {/* Header with price */}
      {productName && (
        <div>
          <p className="text-sm font-bold">{productName}</p>
          {productPrice && (
            <p className="text-lg font-extrabold text-brand">{currencySymbol}{productPrice.toLocaleString()}</p>
          )}
        </div>
      )}

      {/* Lead score indicator */}
      {leadScore > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5">
          <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
            <Sparkles className="size-3 text-brand" /> Lead Quality Score
          </span>
          <Badge className={cn(
            "border-0 text-[10px]",
            leadScore >= 80 ? "bg-emerald-500 text-white" :
            leadScore >= 50 ? "bg-amber-500 text-white" :
            "bg-muted text-muted-foreground"
          )}>
            {leadScore}/100
          </Badge>
        </div>
      )}

      {/* Name + Email */}
      <div className="grid grid-cols-1 gap-2">
        <Field label="Your name" required icon={Users}>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" className="h-10" />
        </Field>
        <Field label="Your email" required icon={Mail}>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@email.com" className="h-10" />
        </Field>
      </div>

      {/* Phone */}
      <Field label="Mobile number" icon={Phone}>
        <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+44 7700 900123" className="h-10" inputMode="tel" />
      </Field>

      {/* Event type + Date + Time */}
      <div className="grid grid-cols-2 gap-2">
        <Field label="Event type" required>
          <Select value={form.eventType} onValueChange={(v) => set("eventType", v)}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {eventTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Event date" required icon={Calendar}>
          <Input type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} className="h-10" />
        </Field>
      </div>
      <Field label="Event time" icon={Clock}>
        <Input type="time" value={form.eventTime} onChange={(e) => set("eventTime", e.target.value)} className="h-10" />
      </Field>

      {/* Guests + Budget */}
      <div className="grid grid-cols-2 gap-2">
        <Field label="Guests" icon={Users}>
          <Input type="number" min={1} value={form.guests} onChange={(e) => set("guests", e.target.value)} placeholder="50" className="h-10" />
        </Field>
        <Field label="Budget" icon={DollarSign}>
          <Input value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder={`${currencySymbol}1,000`} className="h-10" />
        </Field>
      </div>

      {/* Delivery / Venue address */}
      <Field label="Delivery / Venue address" icon={MapPin}>
        <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, City, ZIP" className="h-10" />
      </Field>

      {/* Preferred contact method */}
      <Field label="Preferred contact method">
        <div className="flex gap-1.5">
          {CONTACT_METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => set("preferredContact", m.value)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                form.preferredContact === m.value
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </Field>

      {/* Additional notes */}
      <Field label="Additional notes">
        <Textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder={`Tell ${vendorName} about your event, customisation needs, etc...`}
          rows={2}
          className="resize-none"
        />
      </Field>

      {/* Reference image upload */}
      <Field label="Reference image (optional)">
        {form.referenceImage ? (
          <div className="relative inline-block">
            <img src={form.referenceImage} alt="Reference" className="h-20 w-20 rounded-lg border border-border object-cover" />
            <button
              type="button"
              onClick={() => set("referenceImage", "")}
              className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-black/60 text-white"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : (
          <div className="w-32">
            <ImageUpload label="" aspect="square" value="" onChange={(url) => url && set("referenceImage", url)} hint="" />
          </div>
        )}
      </Field>

      {/* AI Pre-qualification (collapsible) */}
      {form.eventType && (
        <div className="rounded-lg border border-brand-border bg-brand-soft/30 p-3">
          <button
            type="button"
            onClick={() => setShowQualification(!showQualification)}
            className="flex w-full items-center justify-between text-xs font-bold text-brand"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> Josh AI Quick Questions
            </span>
            <span className="text-muted-foreground">{showQualification ? "Hide" : "Show"}</span>
          </button>
          {showQualification && (
            <div className="mt-3 space-y-2">
              {qualificationQuestions.map((q) => (
                <div key={q.key}>
                  <Label className="text-[10px] font-medium text-muted-foreground">{q.label}</Label>
                  <Input
                    value={qualification[q.key] || ""}
                    onChange={(e) => setQualification((prev) => ({ ...prev, [q.key]: e.target.value }))}
                    placeholder={q.placeholder}
                    className="h-8 text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <Button type="submit" disabled={submitting || !valid} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
        {submitting ? (
          <><Loader2 className="size-4 animate-spin" /> Sending…</>
        ) : (
          <><Send className="size-4" /> Send Enquiry</>
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <Shield className="size-3" /> Your details go directly to {vendorName} only
      </p>
    </form>
  );
}

function Field({
  label,
  required,
  icon: Icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="flex items-center gap-1 text-xs font-semibold">
        {Icon && <Icon className="size-3 text-muted-foreground" />}
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
