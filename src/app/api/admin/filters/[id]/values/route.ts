import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

/**
 * POST /api/admin/filters/[id]/values — add a value to a filter group
 * Body: { value: string }
 *
 * Also used to bulk-add values: { values: string[] }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const { id } = await params;
    const body = await req.json();

    const valuesToAdd: string[] = body.values || (body.value ? [body.value] : []);

    if (valuesToAdd.length === 0) {
      return NextResponse.json({ error: "No values provided" }, { status: 400 });
    }

    // Get current max sortOrder
    const existing = await db.filterValue.findMany({
      where: { groupId: id },
      orderBy: { sortOrder: "desc" },
      take: 1,
    });
    const startOrder = (existing[0]?.sortOrder ?? -1) + 1;

    await db.filterValue.createMany({
      data: valuesToAdd.map((v: string, i: number) => ({
        groupId: id,
        value: v,
        sortOrder: startOrder + i,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, added: valuesToAdd.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
