import { NextRequest, NextResponse } from "next/server";
import { updateAttribute, deleteAttribute } from "@/lib/attributes/attribute-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/constants";

/**
 * PUT /api/admin/attributes/[id] — update an attribute.
 *   Body: partial { slug, name, group, icon, color, description, sortOrder, active, ecosystem }
 *
 * DELETE /api/admin/attributes/[id] — delete an attribute (cascades to join tables).
 *
 * Admin only.
 */
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  if (!isAdminEmail(user.email)) return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  return { user };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  try {
    const body = await req.json();
    const attr = await updateAttribute(id, body);
    return NextResponse.json({ attribute: attr });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Attribute not found" }, { status: 404 });
    }
    console.error("[api/admin/attributes/[id]] PUT failed:", error);
    return NextResponse.json({ error: "Failed to update attribute" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  try {
    await deleteAttribute(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Attribute not found" }, { status: 404 });
    }
    console.error("[api/admin/attributes/[id]] DELETE failed:", error);
    return NextResponse.json({ error: "Failed to delete attribute" }, { status: 500 });
  }
}
