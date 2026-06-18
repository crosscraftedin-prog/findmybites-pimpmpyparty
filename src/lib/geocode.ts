/**
 * Server-side geocoding via OpenStreetMap Nominatim (free, no API key).
 *
 * Used to convert a vendor's address → lat/lng so the vendor is discoverable
 * in the "Near Me" geo search. Called from POST/PATCH /api/vendors and from
 * the /api/geocode preview endpoint.
 *
 * Nominatim usage policy: max 1 request/sec, include a descriptive UA.
 * For a production marketplace you'd switch to Google Places / Mapbox /
 * Supabase's geocoding — the function signature stays the same.
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName?: string;
}

const EARTH_RADIUS_KM = 6371;

/** Haversine great-circle distance in kilometres between two coordinates. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Geocode a free-text address string into lat/lng.
 * Returns null if no result or on error (caller treats as "no coordinates").
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodeResult | null> {
  const q = address.trim();
  if (!q) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
    q
  )}`;
  try {
    const res = await fetch(url, {
      headers: {
        // Nominatim requires a descriptive User-Agent.
        "User-Agent": "FindMyBites-PimpMyParty/1.0 (marketplace)",
        Accept: "application/json",
      },
      // don't hang the request forever
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name?: string;
    }>;
    if (!Array.isArray(data) || data.length === 0) return null;
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, displayName: data[0].display_name };
  } catch {
    return null;
  }
}

/**
 * Build the best geocoding query string from the vendor's address parts.
 * Falls back gracefully when only city+country are available.
 */
export function buildGeocodeQuery(parts: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
}): string {
  return [parts.address, parts.city, parts.state, parts.zipCode, parts.country]
    .filter((p): p is string => !!p && p.trim().length > 0)
    .map((p) => p.trim())
    .join(", ");
}

/**
 * Reverse geocode lat/lng → a human-readable city/country label, for the
 * IP-fallback path where we only have coordinates. Returns "" on failure.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "FindMyBites-PimpMyParty/1.0 (marketplace)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return "";
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? "";
  } catch {
    return "";
  }
}
