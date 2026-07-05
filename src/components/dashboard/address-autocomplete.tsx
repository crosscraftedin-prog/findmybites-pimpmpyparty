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
 * Address autocomplete with Google Places (primary) → OSM Nominatim (fallback).
 *
 * If NEXT_PUBLIC_GOOGLE_PLACES_API_KEY is set, uses Google Places Autocomplete
 * for superior accuracy and global coverage. Falls back to OpenStreetMap
 * Nominatim (free, no API key) if Google is unavailable or not configured.
 *
 * On select, fills: country, state, city, area, postal code, lat, long.
 */

// Google Places script loader (lazy, singleton)
let googlePlacesPromise: Promise<any> | null = null;
function loadGooglePlaces(): Promise<any> | null {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;
  if (typeof window === "undefined") return null;
  if (window.google?.maps?.places) return Promise.resolve(window.google.maps.places);
  if (googlePlacesPromise) return googlePlacesPromise;

  googlePlacesPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=__initGooglePlaces`;
    script.async = true;
    script.defer = true;
    (window as any).__initGooglePlaces = () => {
      resolve(window.google?.maps?.places || null);
    };
    script.onerror = () => reject(new Error("Google Places failed to load"));
    document.head.appendChild(script);
  });
  return googlePlacesPromise;
}

export function AddressAutocomplete({ value, onChange, onUseLocation, locating }: AddressAutocompleteProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<AddressResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [useGoogle, setUseGoogle] = React.useState<boolean | null>(null);
  const [googleSession, setGoogleSession] = React.useState<any>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const googleAutocompleteRef = React.useRef<any>(null);

  // Pre-fill query with existing address
  React.useEffect(() => {
    if (!query && (value.city || value.country)) {
      setQuery(`${value.address ? value.address + ", " : ""}${value.city ? value.city + ", " : ""}${value.state ? value.state + ", " : ""}${value.country || ""}`.trim().replace(/,\s*$/, ""));
    }
  }, []);

  // Try to load Google Places on mount
  React.useEffect(() => {
    const places = loadGooglePlaces();
    if (places) {
      places.then((p) => {
        if (p) {
          setUseGoogle(true);
          // Use Google Places Autocomplete (session-based, cheaper)
          if (inputRef.current && p.Autocomplete) {
            try {
              const autocomplete = new p.Autocomplete(inputRef.current, {
                types: ["address"],
                fields: ["address_components", "formatted_address", "geometry"],
              });
              autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                if (place?.address_components) {
                  handleGooglePlace(place);
                }
              });
              googleAutocompleteRef.current = autocomplete;
            } catch {
              setUseGoogle(false); // fallback to OSM
            }
          }
        } else {
          setUseGoogle(false);
        }
      }).catch(() => setUseGoogle(false));
    } else {
      setUseGoogle(false);
    }
  }, []);

  // Google Places result handler
  const handleGooglePlace = (place: any) => {
    const components = place.address_components || [];
    const getComponent = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name || "";

    const country = getComponent("country");
    const state = getComponent("administrative_area_level_1") || getComponent("administrative_area_level_2");
    const city = getComponent("locality") || getComponent("administrative_area_level_2") || getComponent("postal_town") || "";
    const area = getComponent("sublocality") || getComponent("sublocality_level_1") || getComponent("neighborhood") || getComponent("route") || "";
    const zipCode = getComponent("postal_code") || "";
    const lat = place.geometry?.location?.lat();
    const lon = place.geometry?.location?.lng();

    onChange("country", country);
    onChange("state", state);
    onChange("city", city);
    onChange("address", area);
    onChange("zipCode", zipCode);
    if (lat && lon) {
      onChange("latitude", lat);
      onChange("longitude", lon);
    }
    setQuery(place.formatted_address || `${area}, ${city}, ${country}`.trim());
    setShowDropdown(false);
    toast.success("Address filled from Google Places");
  };

  // OSM Nominatim search (fallback when Google is not available)
  React.useEffect(() => {
    // Skip OSM search if Google Places autocomplete is active (it handles its own dropdown)
    if (useGoogle === true) return;
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
  }, [query, useGoogle]);

  const selectOsmAddress = (result: AddressResult) => {
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

  // Keyboard navigation (for OSM dropdown — Google handles its own)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (useGoogle || !showDropdown || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      selectOsmAddress(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  // Close OSM dropdown on outside click
  React.useEffect(() => {
    if (useGoogle) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [useGoogle]);

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
        <p className="text-[11px] text-muted-foreground">
          {useGoogle === null ? "Start typing your address…" :
           useGoogle ? "Powered by Google Maps — type your address" :
           "Type your address — we'll fill everything automatically"}
        </p>
        <div className="relative mt-1.5">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); if (!useGoogle) setShowDropdown(true); }}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (!useGoogle && results.length > 0) setShowDropdown(true); }}
            placeholder="e.g. Petbasheerabad, Hyderabad, Telangana"
            className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-10 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Search address"
            aria-expanded={showDropdown}
            aria-controls="address-suggestions"
            role="combobox"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          {!loading && query && !useGoogle && (
            <button
              type="button"
              onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
          {useGoogle && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-medium text-blue-500">Google</span>
          )}
        </div>

        {/* OSM Autocomplete dropdown (only when Google is not active) */}
        {!useGoogle && showDropdown && results.length > 0 && (
          <div
            id="address-suggestions"
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
                  onMouseDown={(e) => { e.preventDefault(); selectOsmAddress(result); }}
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

        {/* No results (OSM only) */}
        {!useGoogle && showDropdown && !loading && results.length === 0 && query.length >= 3 && (
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

      {/* Auto-filled fields (vendor can tweak) */}
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
