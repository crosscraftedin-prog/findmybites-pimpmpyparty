import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

/**
 * POST /api/admin/vendors/[id]/approve
 *
 * Admin approves a pending organic vendor. Sets:
 *   - approved = true
 *   - ownership_status stays 'unclaimed' until vendor activates
 * Generates an activation token and returns the activation URL.
 *
 * The admin can then share the activation link with the vendor via WhatsApp.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // Fetch the vendor
    const vendor = await db.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // ── Reject path ──
    if (body?.reject === true) {
      await db.vendor.update({
        where: { id },
        data: {
          approved: false,
          verified: false,
          ownership_status: "rejected",
        },
      });

      // Audit log
      const supabaseR = await createSupabaseServerClient();
      const { data: { session: sessR } } = await supabaseR.auth.getSession();
      const adminIdR = sessR?.user?.id ?? null;
      await db.$executeRaw`
        INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, metadata)
        VALUES (${adminIdR}::uuid, 'vendor.reject', 'vendor_listings', ${id},
          jsonb_build_object('name', ${vendor.name}))
      `;

      return NextResponse.json({ success: true, vendor: { id: vendor.id, name: vendor.name, approved: false } });
    }

    // ── Approve path ──
    if (vendor.approved) {
      return NextResponse.json({ error: "Vendor is already approved" }, { status: 400 });
    }

    // Get admin ID
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    const adminId = session?.user?.id ?? null;

    // Approve the vendor
    await db.vendor.update({
      where: { id },
      data: {
        approved: true,
        verified: true,
      },
    });

    // Generate activation token
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.$executeRaw`
      INSERT INTO public.vendor_invite_tokens (vendor_id, token, expires_at, created_by)
      VALUES (${id}, ${token}, ${expiresAt}, ${adminId}::uuid)
    `;

    // Audit log
    await db.$executeRaw`
      INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, metadata)
      VALUES (${adminId}::uuid, 'vendor.approve', 'vendor_listings', ${id},
        jsonb_build_object('name', ${vendor.name}, 'invite_type', ${vendor.invite_type ?? "organic"}))
    `;

    const activateUrl = `https://www.findmybites.com/activate/${token}`;

    // Build WhatsApp share message
    const waMessage = encodeURIComponent(
      `🎉 Great news! Your business "${vendor.name}" has been approved on FindMyBites × PimpMyParty!\n\n` +
      `Click here to activate your account:\n${activateUrl}\n\n` +
      `This link is valid for 7 days. After signing in with Google, you'll go straight to your dashboard.`
    );
    const waPhone = vendor.whatsapp?.replace(/\D/g, "") || "";
    const waLink = waPhone
      ? `https://wa.me/${waPhone}?text=${waMessage}`
      : `https://wa.me/?text=${waMessage}`;


    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        approved: true,
      },
      activateUrl,
      token,
      whatsappShareUrl: waLink,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error("[admin/vendors/approve] POST failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
