import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/vendor/signup
 *
 * Organic vendor self-registration. Creates a vendor record with:
 *   - approved = false (pending admin approval)
 *   - invite_type = 'organic'
 *   - ownership_status = 'unclaimed'
 *
 * After admin approval, the vendor receives an activation link.
 *
 * Body: { name, whatsapp, ecosystem, category?, city?, country?, email?, tagline? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, whatsapp, ecosystem, category, city, country, email, tagline } = body as {
      name: string;
      whatsapp: string;
      ecosystem: string;
      category?: string;
      city?: string;
      country?: string;
      email?: string;
      tagline?: string;
    };

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }
    if (!whatsapp?.trim()) {
      return NextResponse.json({ error: "WhatsApp number is required" }, { status: 400 });
    }
    if (!ecosystem || !["FINDMYBITES", "PIMPMYPARTY"].includes(ecosystem)) {
      return NextResponse.json({ error: "Valid platform is required" }, { status: 400 });
    }

    // Generate slug
    const baseSlug = name.trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Create vendor with approved=false (pending), invite_type='organic'
    const vendor = await db.vendor.create({
      data: {
        name: name.trim(),
        slug,
        ecosystem,
        category: category || "bakers-bakery",
        tagline: tagline?.trim() || `Welcome to ${name.trim()}`,
        description: "",
        city: city?.trim() || "Unknown",
        country: country?.trim() || "Unknown",
        countryCode: "IN",
        continent: "Asia",
        currency: "INR",
        priceRange: "₹₹",
        basePrice: 0,
        rating: 0,
        reviewCount: 0,
        heroImage: "",
        avatarImage: "",
        gallery: "[]",
        tags: "[]",
        featured: false,
        verified: false,
        approved: false, // Pending — requires admin approval
        responseTime: "Under 24 hours",
        yearsActive: 1,
        completedBookings: 0,
        ownership_status: "unclaimed",
        invite_type: "organic",
        whatsapp: whatsapp.trim(),
        userEmail: email?.trim() || null,
      },
    });


    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
        approved: false,
        invite_type: "organic",
      },
      message: "Your registration has been submitted! Our team will review it and send you an activation link within 24-48 hours.",
    }, { status: 201 });
  } catch (error: any) {
    console.error("[vendor/signup] POST failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
