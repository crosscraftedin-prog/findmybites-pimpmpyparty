"use client";

import * as React from "react";
import { Loader2, MapPin, Navigation, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarketplace } from "@/lib/store";
import {
  detectUserLocation,
  geocodeToLocation,
  clearCachedLocation,
} from "@/lib/geo";

type BannerState = "checking" | "prompt" | "city-input" | "done";

/**
 * Auto-asks for location permission on page load.
 *
 * - If the user already granted location → silently detect + open NearMeSection
 *   (banner is never shown).
 * - If not granted → show a small friendly banner below the nav bar:
 *     "📍 Allow location access to find vendors near you"
 *     [Allow Location]  [Search by City instead]
 * - [Allow Location] → triggers the browser geolocation permission popup.
 * - [Search by City instead] → shows a simple city text input in the same banner.
 *
 * When a location is obtained (via GPS or city search), the banner hides and
 * the NearMeSection auto-opens with nearby vendors.
 */
export function LocationBanner() {
  const setUserLocation = useMarketplace((s) => s.setUserLocation);
  const setNearMeOpen = useMarketplace((s) => s.setNearMeOpen);
  const userLocation = useMarketplace((s) => s.userLocation);

  const [state, setState] = React.useState<BannerState>("checking");
  const [locating, setLocating] = React.useState(false);
  const [cityQuery, setCityQuery] = React.useState("");
  const [citySearching, setCitySearching] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  // On mount: check if we already have a location (cached or GPS permission
  // already granted). If so, silently load nearby vendors — no banner.
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. Check for a cached location first (covers city-search users who
      //    never granted GPS permission — their geocoded city is cached).
      const { location: cached } = await detectUserLocation(true);
      if (cancelled) return;
      if (cached) {
        setUserLocation(cached);
        return; // state will flip to "done" via the useEffect below.
      }

      // 2. No cached location — check if GPS permission is already granted.
      if (typeof navigator === "undefined" || !navigator.permissions) {
        if (!cancelled) setState("prompt");
        return;
      }

      try {
        const result = await navigator.permissions.query({
          name: "geolocation" as PermissionName,
        });
        if (cancelled) return;
        if (result.state === "granted") {
          silentlyDetect();
        } else {
          setState("prompt");
        }
        result.onchange = () => {
          if (result.state === "granted" && !cancelled) {
            silentlyDetect();
          }
        };
      } catch {
        if (!cancelled) setState("prompt");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-hide banner once we have a location (set by either flow below).
  React.useEffect(() => {
    if (userLocation && state !== "done") {
      setState("done");
      setNearMeOpen(true);
    }
  }, [userLocation, state, setNearMeOpen]);

  const silentlyDetect = async () => {
    setLocating(true);
    try {
      const { location } = await detectUserLocation();
      if (location) {
        setUserLocation(location);
      } else {
        setState("prompt");
      }
    } finally {
      setLocating(false);
    }
  };

  const onAllowLocation = async () => {
    setLocating(true);
    try {
      const { location } = await detectUserLocation(false);
      if (location) {
        setUserLocation(location);
      } else {
        setState("city-input");
      }
    } finally {
      setLocating(false);
    }
  };

  const onCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityQuery.trim()) return;
    setCitySearching(true);
    try {
      const loc = await geocodeToLocation(cityQuery.trim());
      if (loc) {
        setUserLocation(loc);
      }
    } finally {
      setCitySearching(false);
    }
  };

  if (state === "checking" || state === "done" || dismissed) {
    return null;
  }

  return (
    <div className="border-b border-brand-border/40 bg-brand-soft/60">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <p className="flex items-center gap-2 text-sm font-medium text-brand-soft-foreground">
          <MapPin className="size-4 shrink-0 text-brand" />
          Allow location access to find vendors near you
        </p>

        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {state === "city-input" ? (
            <form
              onSubmit={onCitySearch}
              className="flex w-full max-w-sm items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  placeholder="Enter your city — e.g. Paris"
                  className="h-9 rounded-full pl-9 pr-3 text-sm"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={citySearching || !cityQuery.trim()}
                className="h-9 rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
              >
                {citySearching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setState("prompt")}
                className="h-9 rounded-full"
              >
                Back
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={onAllowLocation}
                disabled={locating}
                className="h-9 rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
              >
                {locating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Detecting…
                  </>
                ) : (
                  <>
                    <Navigation className="size-4" />
                    Allow Location
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setState("city-input")}
                className="h-9 rounded-full"
              >
                <Search className="size-4" />
                Search by City instead
              </Button>
            </div>
          )}

          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss location banner"
            className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
