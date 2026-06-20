"use client";

import * as React from "react";

/**
 * Hook for getting the user's current GPS location.
 * Returns:
 *  - location: { lat, lng } | null
 *  - loading: boolean
 *  - error: string | null
 *  - requestLocation: () => void — triggers the browser permission prompt
 *  - clearLocation: () => void — clears the stored location
 *
 * Uses navigator.geolocation.getCurrentPosition with a fallback to
 * localStorage so the location persists across page navigations.
 */
export function useNearMe() {
  const [location, setLocation] = React.useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("fmb-pmp:user-location");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.lat === "number" && typeof parsed.lng === "number") {
          setLocation(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const requestLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: Math.round(position.coords.latitude * 1e6) / 1e6,
          lng: Math.round(position.coords.longitude * 1e6) / 1e6,
        };
        setLocation(loc);
        setLoading(false);
        try {
          localStorage.setItem("fmb-pmp:user-location", JSON.stringify(loc));
        } catch {
          // ignore
        }
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location access denied. Please enable location permissions in your browser settings.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information is unavailable. Please try selecting your city manually.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Please try again.");
            break;
          default:
            setError("Could not get your location. Please try selecting your city manually.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, []);

  const clearLocation = React.useCallback(() => {
    setLocation(null);
    setError(null);
    try {
      localStorage.removeItem("fmb-pmp:user-location");
    } catch {
      // ignore
    }
  }, []);

  return { location, loading, error, requestLocation, clearLocation };
}
