"use client";

import * as React from "react";
import { Search, MapPin, Loader2, X, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AddressResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    country?: string;
    state?: string;
    region?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    neighbourhood?: string;
    postcode?: string;
    road?: string;
    house_number?: string;
  };
}

interface AddressAutocompleteProps {
  value: { country: string; state: string; city: string; address: string; zipCode: string; latitude: string; longitude: string };
  onChange: (field: string, value: any) => void;
  onUseLocation?: () => void;
  locating?: boolean;
}

/**
 * Single search box for address autocomplete.
 * Uses OpenStreetMap Nominatim (free, no API key, global coverage).
 * On select, fills: country, state, city, area, postal code, lat, long.
 *
 * Also provides a "Use My Location" button for GPS detection.
 */
export function AddressAutocomplete({ value, onChange, onUseLocation, locating }: AddressAutocompleteProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<AddressResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Pre-fill query with existing city/country
  React.useEffect(() => {
    if (!query && (value.city || value.country)) {
      setQuery(`${value.address ? value.address + ", " : ""}${value.city ? value.city + ", " : ""}${value.state ? value.state + ", " : ""}${value.country || ""}`.trim().replace(/,\s*$/, ""));
    }
  }, []); // Only on mount

  // Debounced search
  React.useEffect(() => {
    if (!query.trim() || query.trim().length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const q = encodeURIComponent(query.trim());
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&addressdetails=1&limit=5`, {
          headers: { "Accept-Language": "en" },
        });
        const data = await res.json();
        setResults(data || []);
        setShowDropdown(true);
        setSelectedIndex(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const selectAddress = (result: AddressResult) => {
    const a = result.address;
    const city = a.city || a.town || a.village || a.municipality || "";
    const area = a.suburb || a.neighbourhood || a.road || "";
    const state = a.state || a.region || "";
    const fullAddress = result.display_name.split(",").slice(0, 3).join(", ").trim();

    onChange("country", a.country || "");
    onChange("state", state);
    onChange("city", city);
    onChange("address", area);
    onChange("zipCode", a.postcode || "");
    onChange("latitude", parseFloat(result.lat));
    onChange("longitude", parseFloat(result.lon));

    setQuery(fullAddress);
    setShowDropdown(false);
    setResults([]);
    toast.success("Address filled automatically");
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      selectAddress(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll selected item into view
  React.useEffect(() => {
    if (selectedIndex < 0) return;
    const el = dropdownRef.current?.querySelector(`[data-idx="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <div className="space-y-3">
      {/* Main search box */}
      <div ref={dropdownRef} className="relative">
        <label className="text-sm font-medium">Search your business address</label>
        <p className="text-[11px] text-muted-foreground">Start typing your address — we'll fill everything automatically</p>
        <div className="relative mt-1.5">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
            placeholder="e.g. Petbasheerabad, Hyderabad, Telangana"
            className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-10 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Search address"
            aria-expanded={showDropdown}
            aria-controls="address-dropdown"
            role="combobox"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          {!loading && query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Autocomplete dropdown */}
        {showDropdown && results.length > 0 && (
          <div
            id="address-dropdown"
            role="listbox"
            className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border bg-popover shadow-xl"
          >
            {results.map((result, idx) => {
              const a = result.address;
              const city = a.city || a.town || a.village || "";
              const parts = [a.road || a.suburb || a.neighbourhood, city, a.state, a.country].filter(Boolean);
              const primary = parts.slice(0, 2).join(", ") || result.display_name.split(",")[0];
              const secondary = parts.slice(2).join(", ");

              return (
                <button
                  key={idx}
                  type="button"
                  data-idx={idx}
                  role="option"
                  aria-selected={selectedIndex === idx}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onMouseDown={(e) => { e.preventDefault(); selectAddress(result); }}
                  className={cn(
                    "flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors",
                    selectedIndex === idx ? "bg-accent" : "hover:bg-accent/50"
                  )}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{primary}</p>
                    {secondary && <p className="truncate text-xs text-muted-foreground">{secondary}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* No results */}
        {showDropdown && !loading && results.length === 0 && query.length >= 3 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border bg-popover p-3 text-center text-sm text-muted-foreground shadow-xl">
            No addresses found. Try a different search or fill manually below.
          </div>
        )}
      </div>

      {/* Use My Location button */}
      {onUseLocation && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20 p-3">
          <Navigation className="size-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Use GPS to detect location</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">Fills address & coordinates automatically</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={onUseLocation} disabled={locating} className="shrink-0">
            {locating ? <><Loader2 className="mr-1.5 size-3.5 animate-spin" /> Detecting…</> : <><Navigation className="mr-1.5 size-3.5" /> Use My Location</>}
          </Button>
        </div>
      )}

      {/* Auto-filled fields (visible but read-only feel — vendor can tweak) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Country</label>
          <Input value={value.country || ""} onChange={(e) => onChange("country", e.target.value)} className="mt-0.5" placeholder="Auto-filled" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">State / Province</label>
          <Input value={value.state || ""} onChange={(e) => onChange("state", e.target.value)} className="mt-0.5" placeholder="Auto-filled" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">City</label>
          <Input value={value.city || ""} onChange={(e) => onChange("city", e.target.value)} className="mt-0.5" placeholder="Auto-filled" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Area / Neighborhood</label>
          <Input value={value.address || ""} onChange={(e) => onChange("address", e.target.value)} className="mt-0.5" placeholder="Auto-filled" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Postal Code</label>
          <Input value={value.zipCode || ""} onChange={(e) => onChange("zipCode", e.target.value)} className="mt-0.5" placeholder="Auto-filled" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Coordinates</label>
          <div className="mt-0.5 flex h-9 items-center rounded-md border bg-muted/30 px-3 text-xs text-muted-foreground">
            {value.latitude ? `📍 ${parseFloat(String(value.latitude)).toFixed(4)}, ${parseFloat(String(value.longitude)).toFixed(4)}` : "Auto-detected"}
          </div>
        </div>
      </div>
    </div>
  );
}
