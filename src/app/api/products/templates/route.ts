import { NextRequest, NextResponse } from "next/server";
import { getTemplates } from "@/lib/product-templates";
import type { Ecosystem } from "@/lib/types";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const category = sp.get("category") ?? "";
  const ecosystem = (sp.get("ecosystem") ?? "FINDMYBITES") as Ecosystem;
  
  if (!category) {
    return NextResponse.json({ templates: [] });
  }
  
  const templates = getTemplates(ecosystem, category);
  return NextResponse.json({ templates });
}
