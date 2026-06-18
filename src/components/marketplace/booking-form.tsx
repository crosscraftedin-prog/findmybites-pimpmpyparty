"use client";

import * as React from "react";
import { toast } from "sonner";
import { CalendarCheck, Loader2, PartyPopper, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateBooking } from "@/lib/queries";

const EVENT_TYPES = [
  "Wedding",
  "Birthday party",
  "Corporate event",
  "Anniversary",
  "Baby shower",
  "Engagement",
  "Festival / pop-up",
  "Private dinner",
  "Other",
];

const BUDGETS = [
  "Under $500",
  "$500 – $1,500",
  "$1,500 – $5,000",
  "$5,000 – $15,000",
  "$15,000 – $50,000",
  "$50,000+",
];

export function BookingForm({ vendorId }: { vendorId: string }) {
  const createBooking = useCreateBooking();
  const [done, setDone] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    eventType: "",
    eventDate: "",
    eventCity: "",
    guests: "",
    budget: "",
    message: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const valid =
    form.name.trim() &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.eventType &&
    form.eventDate &&
    form.eventCity.trim() &&
    form.guests &&
    form.budget &&
    form.message.trim();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      await createBooking.mutateAsync({
        vendorId,
        name: form.name.trim(),
        email: form.email.trim(),
        eventType: form.eventType,
        eventDate: form.eventDate,
        eventCity: form.eventCity.trim(),
        guests: parseInt(form.guests, 10) || 0,
        budget: form.budget,
        message: form.message.trim(),
      });
      setDone(true);
      toast.success("Booking request sent!", {
        description: "The vendor will respond shortly.",
      });
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-border bg-brand-soft p-8 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-brand text-brand-foreground">
          <PartyPopper className="size-7" />
        </div>
        <h3 className="mt-4 text-lg font-bold">Request sent!</h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          We&apos;ve sent your enquiry to the vendor. You&apos;ll hear back soon —
          keep an eye on your inbox.
        </p>
        <Button
          variant="outline"
          className="mt-5"
          onClick={() => {
            setDone(false);
            setForm({
              name: "",
              email: "",
              eventType: "",
              eventDate: "",
              eventCity: "",
              guests: "",
              budget: "",
              message: "",
            });
          }}
        >
          Send another request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" required>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Jane Doe"
            className="h-10"
          />
        </Field>
        <Field label="Email" required>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="jane@email.com"
            className="h-10"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Event type" required>
          <Select value={form.eventType} onValueChange={(v) => set("eventType", v)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Event date" required>
          <Input
            type="date"
            value={form.eventDate}
            onChange={(e) => set("eventDate", e.target.value)}
            className="h-10"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Event city" required>
          <Input
            value={form.eventCity}
            onChange={(e) => set("eventCity", e.target.value)}
            placeholder="e.g. Paris, France"
            className="h-10"
          />
        </Field>
        <Field label="Guests" required>
          <Input
            type="number"
            min={1}
            value={form.guests}
            onChange={(e) => set("guests", e.target.value)}
            placeholder="50"
            className="h-10"
          />
        </Field>
      </div>

      <Field label="Budget" required>
        <Select value={form.budget} onValueChange={(v) => set("budget", v)}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select budget range" />
          </SelectTrigger>
          <SelectContent>
            {BUDGETS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Message" required>
        <Textarea
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Tell the vendor about your event, what you need, and any questions…"
          rows={4}
          className="resize-none"
        />
      </Field>

      <Button
        type="submit"
        disabled={createBooking.isPending || !valid}
        className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
      >
        {createBooking.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="size-4" />
            Send booking request
          </>
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <CalendarCheck className="size-3.5" />
        Free to enquire · No payment required · Cancel anytime
      </p>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
