"use client";

import * as React from "react";
import { Calendar, Plus, X, Check, Clock, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Vendor } from "@/lib/types";

const DAYS = [
  { id: "Mon", label: "Mon" },
  { id: "Tue", label: "Tue" },
  { id: "Wed", label: "Wed" },
  { id: "Thu", label: "Thu" },
  { id: "Fri", label: "Fri" },
  { id: "Sat", label: "Sat" },
  { id: "Sun", label: "Sun" },
];

export function Availability({ vendor }: { vendor: Vendor }) {
  const [activeDays, setActiveDays] = React.useState<string[]>(
    vendor.openHours ? vendor.openHours.split(",")[0]?.split(" ").filter(Boolean) ?? ["Mon", "Tue", "Wed", "Thu", "Fri"] : ["Mon", "Tue", "Wed", "Thu", "Fri"]
  );
  const [fromTime, setFromTime] = React.useState("09:00");
  const [toTime, setToTime] = React.useState("18:00");
  const [advanceDays, setAdvanceDays] = React.useState("2");
  const [lastMinute, setLastMinute] = React.useState(true);
  const [autoReply, setAutoReply] = React.useState("");
  const [blackoutDates, setBlackoutDates] = React.useState<string[]>([]);
  const [calMonth, setCalMonth] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [saving, setSaving] = React.useState(false);

  const toggleDay = (dayId: string) => {
    setActiveDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Availability saved!");
    setSaving(false);
  };

  const addBlackout = (date: string) => {
    if (!blackoutDates.includes(date)) {
      setBlackoutDates([...blackoutDates, date]);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">
        Manage Your Availability
      </h1>

      {/* A) Weekly schedule */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-bold">Weekly Schedule</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {DAYS.map((day) => {
            const active = activeDays.includes(day.id);
            return (
              <button
                key={day.id}
                onClick={() => toggleDay(day.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-accent"
                )}
              >
                {active && <Check className="size-3" />}
                {day.label}
              </button>
            );
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-semibold">Available from</Label>
            <Input
              type="time"
              value={fromTime}
              onChange={(e) => setFromTime(e.target.value)}
              className="h-10"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold">Available to</Label>
            <Input
              type="time"
              value={toTime}
              onChange={(e) => setToTime(e.target.value)}
              className="h-10"
            />
          </div>
        </div>
      </div>

      {/* B) Monthly calendar */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">Monthly Calendar</h2>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
              }
              className="grid size-8 place-items-center rounded-lg border border-border transition-colors hover:bg-accent"
            >
              ←
            </button>
            <span className="px-2 py-1 text-sm font-semibold">
              {calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <button
              onClick={() =>
                setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
              }
              className="grid size-8 place-items-center rounded-lg border border-border transition-colors hover:bg-accent"
            >
              →
            </button>
          </div>
        </div>
        <CalendarGrid
          month={calMonth}
          blackoutDates={blackoutDates}
          onToggleDate={addBlackout}
        />
      </div>

      {/* C) Blackout dates list */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-bold">Blackout Dates</h2>
        {blackoutDates.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {blackoutDates.map((date) => (
              <Badge
                key={date}
                variant="secondary"
                className="gap-1 border-0 bg-muted text-foreground"
              >
                {new Date(date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                <button
                  onClick={() =>
                    setBlackoutDates(blackoutDates.filter((d) => d !== date))
                  }
                  className="ml-0.5 grid size-3.5 place-items-center rounded-full hover:bg-accent"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No blackout dates set.</p>
        )}
      </div>

      {/* D) Booking settings */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-bold">Booking Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label className="text-xs font-semibold">Last minute bookings</Label>
              <p className="text-[11px] text-muted-foreground">
                Accept bookings with less than 24 hours notice
              </p>
            </div>
            <button
              onClick={() => setLastMinute(!lastMinute)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                lastMinute ? "bg-brand" : "bg-muted-foreground/30"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
                  lastMinute ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
          <div>
            <Label className="text-xs font-semibold">Minimum advance notice (days)</Label>
            <Input
              type="number"
              min={0}
              value={advanceDays}
              onChange={(e) => setAdvanceDays(e.target.value)}
              className="h-10"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold">Auto-reply when unavailable</Label>
            <Textarea
              value={autoReply}
              onChange={(e) => setAutoReply(e.target.value)}
              placeholder="Hi! Thanks for your enquiry. I'm not available on this date but I'd love to help with your next event..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
      </div>

      <Button
        onClick={save}
        disabled={saving}
        className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save Availability
      </Button>
    </div>
  );
}

function CalendarGrid({
  month,
  blackoutDates,
  onToggleDate,
}: {
  month: Date;
  blackoutDates: string[];
  onToggleDate: (date: string) => void;
}) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }

  return (
    <div className="grid grid-cols-7 gap-1.5 text-center">
      {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
        <div key={i} className="pb-1 text-[10px] font-semibold uppercase text-muted-foreground">
          {d}
        </div>
      ))}
      {cells.map((date, i) => {
        if (!date) return <div key={i} />;
        const day = parseInt(date.split("-")[2]);
        const isBlackout = blackoutDates.includes(date);
        return (
          <button
            key={i}
            onClick={() => onToggleDate(date)}
            className={cn(
              "grid aspect-square place-items-center rounded-lg text-xs font-medium transition-colors",
              isBlackout
                ? "bg-rose-100 text-rose-700 line-through"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            )}
          >
            {day}
          </button>
        );
      })}
    </div>
  );
}
