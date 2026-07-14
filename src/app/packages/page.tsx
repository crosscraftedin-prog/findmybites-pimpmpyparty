import { Metadata } from "next";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { extractFromExtraFields } from "@/lib/products/product-info";
import { PackagesClient } from "./packages-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catering Packages | PimpMyParty",
  description: "Browse premium catering packages for weddings, birthdays, corporate events and more. Compare prices, menus, and services.",
};

async function getPackages() {
  try {
    const products = await db.product.findMany({
      where: {
        ecosystem: "PIMPMYPARTY",
        isAvailable: true,
        status: "active",
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            country: true,
            countryCode: true,
            rating: true,
            reviewCount: true,
            avatarImage: true,
            verified: true,
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 100,
    });

    return products.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      offerPrice: p.offerPrice,
      currency: p.currency || "INR",
      image: p.image,
      images: p.images ? parseJsonArray<string>(p.images) : null,
      productType: p.productType,
      category: p.category,
      isAvailable: p.isAvailable,
      isFeatured: p.isFeatured || p.featured,
      deliveryAvailable: p.deliveryAvailable,
      pickupAvailable: p.pickupAvailable,
      minGuests: p.minGuests,
      pricePerHead: p.pricePerHead,
      featured: p.featured,
      createdAt: p.createdAt.toISOString(),
      vendor: p.vendor ? {
        id: p.vendor.id,
        name: p.vendor.name,
        slug: p.vendor.slug,
        city: p.vendor.city,
        country: p.vendor.country,
        rating: p.vendor.rating,
        reviewCount: p.vendor.reviewCount,
        avatarImage: p.vendor.avatarImage,
        verified: p.vendor.verified,
      } : undefined,
      productInfo: extractFromExtraFields(p.extraFields),
    }));
  } catch (error) {
    console.error("[packages] fetch failed:", error);
    return [];
  }
}

export default async function PackagesPage() {
  const packages = await getPackages();
  return <PackagesClient initialPackages={packages} />;
}
