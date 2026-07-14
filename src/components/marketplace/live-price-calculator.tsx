"use client";

import * as React from "react";
import { Minus, Plus, Check, MapPin, Star, BadgeCheck, Truck, Clock, Users, Sparkles, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

interface AddonOption {
  name: string;
  price: number;
}

const DEFAULT_ADDONS: AddonOption[] = [
  { name: "Live Counter", price: 5000 },
  { name: "Decoration", price: 8000 },
  { name: "Waiters", price: 2000 },
  { name: "Photography", price: 10000 },
  { name: "DJ / Music", price: 15000 },
];

interface LivePriceCalculatorProps {
  pricePerGuest: number;
  currency: string;
  minGuests: number;
  maxGuests?: number;
  addons?: AddonOption[];
  onGuestsChange?: (guests: number) => void;
  onTotalChange?: (total: number) => void;
}

export function LivePriceCalculator({
  pricePerGuest,
  currency,
  minGuests,
  maxGuests,
  addons = DEFAULT_ADDONS,
  onGuestsChange,
  onTotalChange,
}: LivePriceCalculatorProps) {
  const [guests, setGuests] = React.useState(minGuests);
  const [selectedAddons, setSelectedAddons] = React.useState<Set<string>>(new Set());

  const subtotal = guests * pricePerGuest;
  const addonsTotal = Array.from(selectedAddons).reduce((sum, name) => {
    const addon = addons.find(a => a.name === name);
    return sum + (addon?.price ?? 0);
  }, 0);
  const total = subtotal + addonsTotal;

  React.useEffect(() => {
    onGuestsChange?.(guests);
  }, [guests, onGuestsChange]);

  React.useEffect(() => {
    onTotalChange?.(total);
  }, [total, onTotalChange]);

  const adjustGuests = (delta: number) => {
    const next = Math.max(minGuests, Math.min(maxGuests ?? 99999, guests + delta));
    setGuests(next);
  };

  const toggleAddon = (name: string) => {
    setSelectedAddons(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency + " ";

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <h3 className="text-base font-bold">Live Price Calculator</h3>

      {/* Guest counter */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Guests</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => adjustGuests(-5)}
            disabled={guests <= minGuests}
            className="grid size-8 place-items-center rounded-full border border-border hover:bg-muted disabled:opacity-30"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-[3rem] text-center text-lg font-bold">{guests}</span>
          <button
            onClick={() => adjustGuests(5)}
            disabled={!!maxGuests && guests >= maxGuests}
            className="grid size-8 place-items-center rounded-full border border-border hover:bg-muted disabled:opacity-30"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      {/* Price per guest */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Price per guest</span>
        <span className="font-medium">{symbol}{pricePerGuest.toLocaleString()}</span>
      </div>

      {/* Subtotal */}
      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">Subtotal ({guests} guests)</span>
        <span className="font-medium">{symbol}{subtotal.toLocaleString()}</span>
      </div>

      {/* Addons */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add-ons</p>
        {addons.map(addon => (
          <label
            key={addon.name}
            className={cn(
              "flex cursor-pointer items-center justify-between rounded-lg border p-2.5 text-sm transition-colors",
              selectedAddons.has(addon.name)
                ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20"
                : "border-border hover:bg-muted/30"
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "grid size-4 place-items-center rounded border",
                selectedAddons.has(addon.name) ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/30"
              )}>
                {selectedAddons.has(addon.name) && <Check className="size-3 text-white" />}
              </div>
              <input
                type="checkbox"
                checked={selectedAddons.has(addon.name)}
                onChange={() => toggleAddon(addon.name)}
                className="sr-only"
              />
              {addon.name}
            </div>
            <span className="font-medium text-muted-foreground">+{symbol}{addon.price.toLocaleString()}</span>
          </label>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-base font-bold">Total</span>
        <span className="text-xl font-extrabold text-emerald-600">{symbol}{total.toLocaleString()}</span>
      </div>

      <Button className="w-full gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
        <Calendar className="size-4" /> Book Package
      </Button>
    </div>
  );
}
