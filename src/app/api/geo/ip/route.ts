import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geo/ip
 * IP-based geolocation fallback for "Near Me" when the user denies browser
 * GPS permission. Uses the free ipwho.is service (no API key, no rate-limit
 * hassle for low volume). Returns { lat, lng, city, country } or 404.
 *
 * In production behind a load balancer, read the real client IP from
 * x-forwarded-for. ipwho.is auto-detects the caller IP when no IP is passed.
 */
export async function GET(req: NextRequest) {
  try {
    // Try to read the real client IP from common proxy headers.
    const xff = req.headers.get("x-forwarded-for");
    const clientIp = xff ? xff.split(",")[0].trim() : "";
    const url = clientIp
      ? `https://ipwho.is/${encodeURIComponent(clientIp)}?fields=latitude,longitude,city,country,success,message`
      : "https://ipwho.is/?fields=latitude,longitude,city,country,success,message";

    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "IP geolocation unavailable." },
        { status: 502 }
      );
    }
    const data = (await res.json()) as {
      latitude?: number;
      longitude?: number;
      city?: string;
      country?: string;
      success?: boolean;
      message?: string;
    };
    if (!data.success || data.latitude == null || data.longitude == null) {
      return NextResponse.json(
        { error: data.message ?? "IP geolocation failed." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      lat: data.latitude,
      lng: data.longitude,
      city: data.city ?? "",
      country: data.country ?? "",
      source: "ip" as const,
    });
  } catch (err) {
    console.error("[api/geo/ip] GET failed:", err);
    return NextResponse.json(
      { error: "IP geolocation failed." },
      { status: 500 }
    );
  }
}
