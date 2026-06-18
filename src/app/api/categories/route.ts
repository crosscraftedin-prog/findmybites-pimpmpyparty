import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CATEGORIES } from "@/lib/constants";
import type { Ecosystem } from "@/lib/types";

interface CategoryWithCount {
  id: string;
  ecosystem: Ecosystem;
  label: string;
  description: string;
  icon: string;
  image: string;
  accent: string;
  count: number;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const ecosystemParam = sp.get("ecosystem") as Ecosystem | null;

    const cats = ecosystemParam
      ? CATEGORIES.filter((c) => c.ecosystem === ecosystemParam)
      : CATEGORIES;

    const categories: CategoryWithCount[] = await Promise.all(
      cats.map(async (c) => {
        const count = await db.vendor.count({
          where: { ecosystem: c.ecosystem, category: c.id },
        });
        return {
          id: c.id,
          ecosystem: c.ecosystem,
          label: c.label,
          description: c.description,
          icon: c.icon,
          image: c.image,
          accent: c.accent,
          count,
        };
      })
    );

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("[api/categories] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
