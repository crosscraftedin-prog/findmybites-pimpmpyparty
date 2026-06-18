"use client";

/**
 * Client-side location detection for the "Near Me" feature.
 *
 * Resolution order:
 *  1. Browser Geolocation API (GPS, most accurate) — requires permission.
 *  2. IP-based fallback via /api/geo/ip (server proxies ipwho.is).
 *  3. Manual — caller can fall back to letting the user pick a city, which
 *     we geocode via /api/geocode. (Handled by the component, not here.)
 *
 * The last successful location is cached in localStorage so subsequent visits
 * load instantly without re-prompting for permission.
 */

export interface UserLocation {
  lat: number;
  lng: number;
  source: "gps" | "ip" | "cached" | "manual";
  label?: string;
}

const CACHE_KEY = "fmb-pmp:last-location";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function readCache(): UserLocation | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      location: UserLocation;
      ts: number;
    };
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return { ...parsed.location, source: "cached" };
  } catch {
    return null;
  }
}

function writeCache(loc: UserLocation) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ location: loc, ts: Date.now() })
    );
  } catch {
    // ignore quota / private-mode errors
  }
}

/** Ask the browser for GPS coordinates. Resolves null if denied/unavailable. */
function getGpsLocation(): Promise<UserLocation | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "gps",
        });
      },
      () => resolve(null), // permission denied, timeout, or unavailable
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

/** IP-based fallback. Resolves null on failure. */
async function getIpLocation(): Promise<UserLocation | null> {
  try {
    const res = await fetch("/api/geo/ip", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      lat?: number;
      lng?: number;
      city?: string;
      country?: string;
    };
    if (data.lat == null || data.lng == null) return null;
    return {
      lat: data.lat,
      lng: data.lng,
      source: "ip",
      label: [data.city, data.country].filter(Boolean).join(", "),
    };
  } catch {
    return null;
  }
}

export interface DetectResult {
  location: UserLocation | null;
  /** why GPS wasn't used (helps the UI explain the IP fallback). */
  reason?: "denied" | "unavailable" | "gps-failed";
}

/**
 * Detect the user's location: GPS first, IP fallback, then cached.
 * Always resolves (never throws). The caller decides what to do when null.
 */
export async function detectUserLocation(
  useCache = true
): Promise<DetectResult> {
  if (useCache) {
    const cached = readCache();
    if (cached) return { location: cached };
  }

  const gps = await getGpsLocation();
  if (gps) {
    writeCache(gps);
    return { location: gps };
  }

  // GPS denied/unavailable → try IP.
  const ip = await getIpLocation();
  if (ip) {
    writeCache(ip);
    return { location: ip, reason: "denied" };
  }

  return { location: null, reason: "unavailable" };
}

/** Geocode a manually-entered city/address into a UserLocation. */
export async function geocodeToLocation(
  query: string
): Promise<UserLocation | null> {
  try {
    const res = await fetch(
      `/api/geocode?address=${encodeURIComponent(query)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: number; lng: number };
    const loc: UserLocation = {
      lat: data.lat,
      lng: data.lng,
      source: "manual",
      label: query,
    };
    writeCache(loc);
    return loc;
  } catch {
    return null;
  }
}

/** Clear the cached location (used by the "change location" affordance). */
export function clearCachedLocation() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}
