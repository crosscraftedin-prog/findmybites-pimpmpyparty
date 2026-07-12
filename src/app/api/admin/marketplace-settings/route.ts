import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/constants";

/**
 * GET /api/admin/marketplace-settings — get marketplace settings.
 * POST /api/admin/marketplace-settings — update marketplace settings.
 *   Body: { vendorAutoApproval: boolean, autoApprovalThreshold: number }
 *
 * Settings are stored in a simple key-value table (marketplace_settings).
 * If the table doesn't exist, returns defaults.
 *
 * Admin only.
 */
export const dynamic = "force-dynamic";

const DEFAULTS = {
  vendorAutoApproval: true,
  autoApprovalThreshold: 500,
};

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  if (!isAdminEmail(user.email)) return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  return { user, email: user.email ?? "" };
}

export async function GET(_req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    // Try to read from the database. If the table doesn't exist, return defaults.
    // We use a raw query since the marketplace_settings table may not be in the Prisma schema.
    const { db } = await import("@/lib/db");
    let settings = DEFAULTS;
    try {
      const rows = await (db as any).$queryRaw`
        SELECT key, value FROM marketplace_settings
      `;
      if (Array.isArray(rows)) {
        const map: Record<string, string> = {};
        for (const r of rows) map[r.key] = r.value;
        settings = {
          vendorAutoApproval: map.vendorAutoApproval !== "false",
          autoApprovalThreshold: Number(map.autoApprovalThreshold) || DEFAULTS.autoApprovalThreshold,
        };
      }
    } catch {
      // Table doesn't exist — return defaults
    }
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ settings: DEFAULTS });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { vendorAutoApproval, autoApprovalThreshold } = body;

    // Upsert settings (create table if needed via raw SQL)
    const { db } = await import("@/lib/db");
    try {
      // Create table if not exists (idempotent)
      await (db as any).$executeRaw`
        CREATE TABLE IF NOT EXISTS marketplace_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updatedAt TIMESTAMP DEFAULT NOW()
        )
      `;
      // Upsert each setting
      if (typeof vendorAutoApproval === "boolean") {
        await (db as any).$executeRaw`
          INSERT INTO marketplace_settings (key, value, "updatedAt")
          VALUES ('vendorAutoApproval', ${String(vendorAutoApproval)}, NOW())
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
        `;
      }
      if (typeof autoApprovalThreshold === "number") {
        await (db as any).$executeRaw`
          INSERT INTO marketplace_settings (key, value, "updatedAt")
          VALUES ('autoApprovalThreshold', ${String(autoApprovalThreshold)}, NOW())
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
        `;
      }
    } catch (dbErr) {
      // Non-fatal — settings will use defaults
      console.error("[marketplace-settings] DB write failed (non-fatal):", dbErr);
    }

    return NextResponse.json({
      settings: {
        vendorAutoApproval: vendorAutoApproval ?? DEFAULTS.vendorAutoApproval,
        autoApprovalThreshold: autoApprovalThreshold ?? DEFAULTS.autoApprovalThreshold,
      },
    });
  } catch (error: any) {
    console.error("[marketplace-settings] POST failed:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
