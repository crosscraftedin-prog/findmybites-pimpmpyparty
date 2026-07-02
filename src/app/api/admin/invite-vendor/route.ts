import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

/**
 * POST /api/admin/invite-vendor
 *
 * Admin invites a vendor by entering Business Name + WhatsApp Number.
 * Creates a vendor record with:
 *   - approved = true (immediately live)
 *   - invite_type = 'admin'
 *   - ownership_status = 'unclaimed'
 * Generates a secure invite token and returns the invite URL.
 *
 * Body: { name, whatsapp, ecosystem, category?, city?, country?, tagline? }
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const body = await req.json();
    const { name, whatsapp, ecosystem, category, city, country, tagline } = body as {
      name: string;
      whatsapp: string;
      ecosystem: string;
      category?: string;
      city?: string;
      country?: string;
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
      return NextResponse.json({ error: "Valid ecosystem is required (FINDMYBITES or PIMPMYPARTY)" }, { status: 400 });
    }

    // Generate a slug from the business name
    const baseSlug = name.trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Get the admin user ID for the invite token
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    const adminId = session?.user?.id ?? null;

    // Generate a secure invite token (48-char hex)
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

    // Create the vendor record with approved=true, invite_type='admin'
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
        approved: true, // Admin-invited vendors are immediately approved
        responseTime: "Under 24 hours",
        yearsActive: 1,
        completedBookings: 0,
        ownership_status: "unclaimed",
        invite_type: "admin",
        whatsapp: whatsapp.trim(),
      },
    });

    // Store the invite token in vendor_invite_tokens
    await db.$executeRaw`
      INSERT INTO public.vendor_invite_tokens (vendor_id, token, expires_at, created_by)
      VALUES (${vendor.id}, ${token}, ${expiresAt}, ${adminId}::uuid)
    `;

    // Audit log
    await db.$executeRaw`
      INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, metadata)
      VALUES (${adminId}::uuid, 'vendor.invite', 'vendor_listings', ${vendor.id},
        jsonb_build_object('name', ${name.trim()}, 'ecosystem', ${ecosystem}, 'whatsapp', ${whatsapp.trim()}))
    `;

    const inviteUrl = `https://www.findmybites.com/activate/${token}`;

    // Build WhatsApp share message
    const waMessage = encodeURIComponent(
      `🎉 You've been invited to join FindMyBites × PimpMyParty!\n\n` +
      `Business: ${name.trim()}\n` +
      `Platform: ${ecosystem === "FINDMYBITES" ? "FindMyBites" : "PimpMyParty"}\n\n` +
      `Click here to activate your account:\n${inviteUrl}\n\n` +
      `This link is valid for 7 days. After signing in with Google, you'll go straight to your dashboard.`
    );
    const waPhone = whatsapp.replace(/\D/g, "");
    const waLink = waPhone
      ? `https://wa.me/${waPhone}?text=${waMessage}`
      : `https://wa.me/?text=${waMessage}`;

    console.log(`[invite-vendor] Created vendor ${vendor.id} (${name}) with invite token`);

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
        ecosystem: vendor.ecosystem,
        invite_type: "admin",
        approved: true,
      },
      inviteUrl,
      token,
      whatsappShareUrl: waLink,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error("[invite-vendor] POST failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
