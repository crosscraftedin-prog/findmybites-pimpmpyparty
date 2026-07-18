/**
 * Archived on 2026-07-14
 * Reason:
 * No verified runtime references found.
 * Preserved for future features.
 *
 * DO NOT IMPORT FROM THIS DIRECTORY.
 */

"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, PartyPopper, Send, CalendarCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface QuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  vendorName?: string;
}

/**
 * Modal popup quote/enquiry form. Hooks into the existing "Get Instant Quote"
 * button on the vendor modal. Matches the BookingForm style exactly — same
 * Field wrapper, same Input/Select/Label/Button components, same success state.
 */
export function QuoteDialog({ open, onOpenChange, vendorId, vendorName }: QuoteDialogProps) {
  const createBooking = useCreateBooking();
  const [done, setDone] = React.useState(false);
  const [form, setForm] = React.useState({
    eventType: "",
    eventDate: "",
    guests: "",
    budget: "",
    eventCity: "",
    email: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const valid =
    form.eventType &&
    form.eventDate &&
    form.guests &&
    form.budget.trim() &&
    form.eventCity.trim() &&
    /\S+@\S+\.\S+/.test(form.email);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      await createBooking.mutateAsync({
        vendorId,
        // Booking API requires name + message; derive from the fields we collect.
        name: form.email.split("@")[0] || "Guest",
        email: form.email.trim(),
        eventType: form.eventType,
        eventDate: form.eventDate,
        eventCity: form.eventCity.trim(),
        guests: parseInt(form.guests, 10) || 0,
        budget: form.budget.trim(),
        message: `Quote request for ${form.eventType} on ${form.eventDate} for ${form.guests} guests. Budget: ${form.budget.trim()}.`,
      });
      setDone(true);
      toast.success("Quote request sent!", {
        description: "The vendor will respond shortly.",
      });
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleClose = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      // reset after the close animation
      setTimeout(() => {
        setDone(false);
        setForm({ eventType: "", eventDate: "", guests: "", budget: "", eventCity: "", email: "" });
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogTitle className="px-5 pt-5 text-lg font-bold">
          {done ? "Request sent" : `Get an instant quote${vendorName ? ` from ${vendorName}` : ""}`}
        </DialogTitle>
        <DialogDescription className="px-5 text-sm text-muted-foreground">
          {done
            ? "Your enquiry is on its way."
            : "Fill in your event details and the vendor will get back to you."}
        </DialogDescription>

        <div className="p-5 pt-3">
          {done ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-border bg-brand-soft p-8 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-brand text-brand-foreground">
                <PartyPopper className="size-7" />
              </div>
              <h3 className="mt-4 text-lg font-bold">Request sent!</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                We&apos;ve sent your enquiry to the vendor. You&apos;ll hear back
                soon — keep an eye on your inbox.
              </p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => handleClose(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Event Type (dropdown) */}
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

              {/* Date (date picker) */}
              <Field label="Event date" required>
                <Input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => set("eventDate", e.target.value)}
                  className="h-10"
                />
              </Field>

              {/* Guest Count (number input) */}
              <Field label="Guest count" required>
                <Input
                  type="number"
                  min={1}
                  value={form.guests}
                  onChange={(e) => set("guests", e.target.value)}
                  placeholder="50"
                  className="h-10"
                />
              </Field>

              {/* Budget (text input) */}
              <Field label="Budget" required>
                <Input
                  type="text"
                  value={form.budget}
                  onChange={(e) => set("budget", e.target.value)}
                  placeholder="e.g. $1,000–$2,000"
                  className="h-10"
                />
              </Field>

              {/* City (text input) */}
              <Field label="City" required>
                <Input
                  type="text"
                  value={form.eventCity}
                  onChange={(e) => set("eventCity", e.target.value)}
                  placeholder="e.g. Paris, France"
                  className="h-10"
                />
              </Field>

              {/* Email (email input) */}
              <Field label="Email" required>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="jane@email.com"
                  className="h-10"
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
                    Submit request
                  </>
                )}
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <CalendarCheck className="size-3.5" />
                Free to enquire · No payment required · Cancel anytime
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
