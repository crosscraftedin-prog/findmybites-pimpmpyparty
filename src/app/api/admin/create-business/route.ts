import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
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

    // Generate invite token — insert directly via raw SQL (bypasses RLS)
    // Can't use Supabase RPC generate_invite_token because the server-side
    // client doesn't have the admin's auth session, so is_admin() returns false.
    const ttlHours = 168;
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);

    // Insert directly into vendor_invite_tokens via raw SQL (Prisma bypasses RLS)
    try {
      await db.$executeRaw`
        INSERT INTO "vendor_invite_tokens" (vendor_id, token, expires_at, used, created_at)
        VALUES (${vendor.id}, ${token}, ${expiresAt}, false, NOW())
      `;
    } catch (tokenErr) {
      console.error("[api/admin/create-business] Token insert failed:", tokenErr);
      // Token table might not exist — still return success, vendor can be claimed via OTP
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
