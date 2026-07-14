/**
 * Archived on 2026-07-14
 * Reason: Zero runtime references found during production audit.
 * Preserved for future features.
 */
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, IndianRupee, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const EVENT_TYPES = [
  "Wedding", "Birthday", "Corporate", "Engagement", "Anniversary",
  "Baby Shower", "Graduation", "Housewarming", "Festival", "Other",
];

export function BookingForm({ vendorId, vendorName }: { vendorId: string; vendorName?: string }) {
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    eventType: "Wedding",
    bookingDate: "",
    bookingTime: "14:00",
    address: "",
    city: "",
    guests: "50",
    budget: "10000",
    specialNotes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          ...form,
          guests: parseInt(form.guests) || 0,
          budget: parseInt(form.budget) * 100,
          currency: "INR",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booking");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center"
      >
        <CheckCircle2 className="size-12 text-emerald-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Booking Request Sent!</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {vendorName ? `${vendorName} will review your request and respond shortly.` : "The vendor will review your request and respond shortly."}
        </p>
        <Button variant="outline" onClick={() => { setSuccess(false); setForm({ ...form, specialNotes: "" }); }}>
          Make Another Booking
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="customerName">Full Name *</Label>
          <Input id="customerName" required value={form.customerName}
            onChange={e => setForm({ ...form, customerName: e.target.value })}
            placeholder="John Doe" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="customerPhone">Phone *</Label>
          <Input id="customerPhone" required type="tel" value={form.customerPhone}
            onChange={e => setForm({ ...form, customerPhone: e.target.value })}
            placeholder="+91 98765 43210" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="customerEmail">Email *</Label>
        <Input id="customerEmail" required type="email" value={form.customerEmail}
          onChange={e => setForm({ ...form, customerEmail: e.target.value })}
          placeholder="john@example.com" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="eventType">Event Type *</Label>
          <select id="eventType" value={form.eventType}
            onChange={e => setForm({ ...form, eventType: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guests">Guests</Label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input id="guests" type="number" value={form.guests}
              onChange={e => setForm({ ...form, guests: e.target.value })}
              className="pl-9" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="bookingDate">Event Date *</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input id="bookingDate" required type="date" value={form.bookingDate}
              onChange={e => setForm({ ...form, bookingDate: e.target.value })}
              className="pl-9" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bookingTime">Event Time *</Label>
          <Input id="bookingTime" type="time" value={form.bookingTime}
            onChange={e => setForm({ ...form, bookingTime: e.target.value })} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Event / Delivery Address *</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Textarea id="address" required value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            className="pl-9 min-h-[60px]" placeholder="123 Main St, Apartment 4B" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="city">City *</Label>
          <Input id="city" required value={form.city}
            onChange={e => setForm({ ...form, city: e.target.value })}
            placeholder="Mumbai" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="budget">Budget (₹)</Label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input id="budget" type="number" value={form.budget}
              onChange={e => setForm({ ...form, budget: e.target.value })}
              className="pl-9" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="specialNotes">Special Notes</Label>
        <Textarea id="specialNotes" value={form.specialNotes}
          onChange={e => setForm({ ...form, specialNotes: e.target.value })}
          placeholder="Eggless chocolate cake, 3-tier, floral design..." />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" disabled={submitting} className="w-full bg-[#FF6B35] hover:bg-[#e85a2a]">
        {submitting ? (
          <><Loader2 className="size-4 mr-2 animate-spin" /> Sending Request...</>
        ) : (
          "Send Booking Request"
        )}
      </Button>
    </motion.form>
  );
}
