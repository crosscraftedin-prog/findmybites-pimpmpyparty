import { NextRequest, NextResponse } from "next/server";
import { listAttributes, createAttribute, seedAttributes } from "@/lib/attributes/attribute-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/attributes — list ALL attributes (including inactive).
 *   ?group=dietary  — filter by group
 *   Admin only.
 *
 * POST /api/admin/attributes — create a new attribute.
 *   Body: { slug, name, group, icon?, color?, description?, ecosystem? }
 *
 * POST /api/admin/attributes?action=seed — re-run canonical seed (idempotent).
 */
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  const isAdmin = user.app_metadata?.role === "admin";
  if (!isAdmin) return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  return { user };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const group = url.searchParams.get("group") ?? undefined;

  try {
    const attributes = await listAttributes({ group, activeOnly: false });
    return NextResponse.json({ attributes });
  } catch (error: any) {
    console.error("[api/admin/attributes] GET failed:", error);
    return NextResponse.json({ error: "Failed to fetch attributes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // Seed action
  if (action === "seed") {
    try {
      const result = await seedAttributes();
      return NextResponse.json(result);
    } catch (error: any) {
      console.error("[api/admin/attributes] seed failed:", error);
      return NextResponse.json({ error: "Seed failed" }, { status: 500 });
    }
  }

  // Create action
  try {
    const body = await req.json();
    if (!body.slug || !body.name || !body.group) {
      return NextResponse.json(
        { error: "slug, name, and group are required" },
        { status: 400 }
      );
    }
    const attr = await createAttribute({
      slug: body.slug,
      name: body.name,
      group: body.group,
      icon: body.icon ?? null,
      color: body.color ?? null,
      description: body.description ?? null,
      ecosystem: body.ecosystem ?? "BOTH",
    });
    return NextResponse.json({ attribute: attr }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    console.error("[api/admin/attributes] POST failed:", error);
    return NextResponse.json({ error: "Failed to create attribute" }, { status: 500 });
  }
}
