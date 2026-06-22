import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/claim/auto-approve
 * Auto-approves an invite-token claim (no admin needed).
 * Only works for claims with claim_method = 'invite_token'.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { claimId } = body;

    if (!claimId) {
      return NextResponse.json({ error: "claimId is required" }, { status: 400 });
    }

    const claim = await db.$queryRaw<any[]>`
      SELECT * FROM public.vendor_claims WHERE id = ${claimId}::uuid
    `;

    if (!claim || claim.length === 0) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    const c = claim[0];

    if (c.claim_method !== "invite_token") {
      return NextResponse.json(
        { error: "Only invite-token claims can be auto-approved" },
        { status: 403 }
      );
    }

    if (c.status !== "pending") {
      return NextResponse.json({ error: "Claim is not pending" }, { status: 400 });
    }

    // Approve the claim
    await db.$executeRaw`
      UPDATE public.vendor_claims 
      SET status = 'approved', reviewed_at = NOW(), admin_notes = 'Auto-approved (invite token)'
      WHERE id = ${claimId}::uuid
    `;

    // Update the vendor — set approved=true so it shows on the public site
    await db.$executeRaw`
      UPDATE public."Vendor" 
      SET ownership_status = 'claimed', "owner_user_id" = ${c.user_id}::uuid, verified = true, approved = true
      WHERE id = ${c.vendor_id}
    `;

    // Update user role to vendor
    await db.$executeRaw`
      UPDATE public.profiles SET role = 'vendor' 
      WHERE id = ${c.user_id}::uuid AND role = 'customer'
    `;

    // Notification
    await db.$executeRaw`
      INSERT INTO public.notifications (user_id, title, message, link)
      VALUES (${c.user_id}::uuid, 'Claim approved', 'Your business claim has been approved. Welcome aboard!', '/dashboard')
    `;

    // Audit log
    await db.$executeRaw`
      INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, metadata)
      VALUES (${c.user_id}::uuid, 'claim.auto_approve', 'vendor_claims', ${claimId}, jsonb_build_object('vendor_id', ${c.vendor_id}))
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/claim/auto-approve] POST failed:", err);
    return NextResponse.json({ error: "Failed to auto-approve" }, { status: 500 });
  }
}
