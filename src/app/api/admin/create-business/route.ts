import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { COUNTRIES } from "@/lib/constants";

/**
 * POST /api/admin/create-business
 * Creates a new vendor listing (unclaimed, not approved) and generates
 * an invite token for the vendor to claim it.
 *
 * Admin-only — requires authenticated admin session.
 * Uses Prisma (server-side) which bypasses RLS.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();
    const { name, whatsapp, category, ecosystem, city, country, tagline, description } = body;

    if (!name?.trim() || !whatsapp?.trim() || !category || !city?.trim() || !ecosystem) {
      return NextResponse.json(
        { error: "Missing required fields: name, whatsapp, category, city, ecosystem" },
        { status: 400 }
      );
    }

    const baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    let slug = `${baseSlug}-${Date.now().toString(36)}`;
    let suffix = 0;
    while (await db.vendor.findUnique({ where: { slug } })) {
      suffix++;
      slug = `${baseSlug}-${Date.now().toString(36)}-${suffix}`;
    }

    const countryName = country?.trim() || "India";
    const countryEntry = Object.entries(COUNTRIES).find(([, c]) => c.name === countryName);
    const countryCode = countryEntry?.[0] ?? "IN";
    const isIndia = countryName === "India";
    const currency = isIndia ? "INR" : "USD";

    const continentMap: Record<string, string> = {
      India: "Asia", USA: "North America", UK: "Europe", "United Kingdom": "Europe",
      Canada: "North America", Australia: "Oceania", UAE: "Asia", Singapore: "Asia",
    };
    const continent = continentMap[countryName] || "Asia";

    const vendor = await db.vendor.create({
      data: {
        name: name.trim(),
        slug,
        ecosystem,
        category,
        tagline: tagline?.trim() || `Business listing`,
        description: description?.trim() || `${name.trim()} — ${category}`,
        city: city.trim(),
        country: countryName,
        countryCode,
        continent,
        currency,
        priceRange: "$$",
        basePrice: 0,
        rating: 0,
        reviewCount: 0,
        heroImage: "",
        avatarImage: "",
        gallery: "[]",
        tags: "[]",
        featured: false,
        verified: false,
        approved: false,
        responseTime: "24 hours",
        yearsActive: 1,
        completedBookings: 0,
        whatsapp: whatsapp.trim().replace(/\D/g, ""),
        latitude: null,
        longitude: null,
      },
    });

    // Generate invite token
    const supabase = await createSupabaseServerClient();
    const ttlHours = 168;
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

    let token: string;
    try {
      const { data: tokenData, error: tokenError } = await supabase.rpc(
        "generate_invite_token",
        { p_vendor_id: vendor.id, p_ttl_hours: ttlHours }
      );
      if (tokenError) throw tokenError;
      const tokenRow = Array.isArray(tokenData) ? tokenData[0] : tokenData;
      token = tokenRow.token;
    } catch {
      token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      await supabase.from("vendor_invite_tokens").insert({
        vendor_id: vendor.id,
        token,
        expires_at: expiresAt.toISOString(),
        used: false,
      });
    }

    const inviteUrl = `${req.nextUrl.origin}/claim-token/${token}`;

    return NextResponse.json({
      success: true,
      vendor: { id: vendor.id, name: vendor.name, whatsapp: vendor.whatsapp },
      inviteUrl,
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("[api/admin/create-business] POST failed:", err);
    return NextResponse.json(
      { error: "Failed to create business: " + (err instanceof Error ? err.message : "Unknown error") },
      { status: 500 }
    );
  }
}
