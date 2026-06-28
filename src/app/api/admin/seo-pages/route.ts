import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import {
  getAllSEOPages,
  getAllCities,
  getAllCategories,
} from "@/lib/seo-data";

/**
 * GET /api/admin/seo-pages — stats + page list for the admin SEO dashboard.
 * POST /api/admin/seo-pages — revalidate all auto-generated SEO pages +
 * sitemap (used by the "Revalidate All" button).
 */
export async function GET(_req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const [pages, cities, categories] = await Promise.all([
      getAllSEOPages(),
      getAllCities(),
      getAllCategories(),
    ]);

    // Build the table rows (keyword pages + city pages + near-me pages)
    const rows: {
      url: string;
      city: string;
      category: string;
      vendors: number;
      ecosystem: string;
    }[] = [];

    for (const p of pages) {
      rows.push({
        url: `/${p.keyword}`,
        city: p.city,
        category: p.category,
        vendors: 0, // individual count would need a separate query per page; 0 = "see page"
        ecosystem: p.ecosystem,
      });
    }
    for (const c of cities) {
      rows.push({
        url: `/${c.citySlug}`,
        city: c.city,
        category: "All categories",
        vendors: c.vendorCount,
        ecosystem: "BOTH",
      });
    }

    // Unique countries from cities
    const countries = new Set(cities.map((c) => c.countryCode));

    return NextResponse.json({
      totalKeywordPages: pages.length,
      totalCityPages: cities.length,
      totalNearMePages: categories.length,
      totalCities: cities.length,
      totalCountries: countries.size,
      pages: rows,
    });
  } catch (err) {
    console.error("[api/admin/seo-pages] GET failed:", err);
    return NextResponse.json(
      { error: "Failed to load SEO page stats" },
      { status: 500 }
    );
  }
}

export async function POST(_req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  try {
    const [pages, cities, categories] = await Promise.all([
      getAllSEOPages(),
      getAllCities(),
      getAllCategories(),
    ]);

    let count = 0;

    // Revalidate every keyword page
    for (const p of pages) {
      try {
        revalidatePath(`/${p.keyword}`);
        revalidatePath(`/${p.citySlug}/${p.categorySlug}`);
        count += 2;
      } catch {}
    }

    // Revalidate every city page
    for (const c of cities) {
      try {
        revalidatePath(`/${c.citySlug}`);
        count += 1;
      } catch {}
    }

    // Revalidate every near-me page
    for (const cat of categories) {
      try {
        revalidatePath(`/near-me/${cat.categorySlug}`);
        count += 1;
      } catch {}
    }

    // Sitemap + homepage
    revalidatePath("/sitemap.xml");
    revalidatePath("/");
    count += 2;

    return NextResponse.json({
      ok: true,
      revalidated: count,
      message: `Revalidated ${count} SEO pages + sitemap`,
    });
  } catch (err) {
    console.error("[api/admin/seo-pages] POST failed:", err);
    return NextResponse.json(
      { error: "Revalidation failed" },
      { status: 500 }
    );
  }
}
