import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { extractFromExtraFields } from "@/lib/products/product-info";
import { PackageDetailClient } from "./package-detail-client";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await db.product.findUnique({
      where: { slug },
      select: { name: true, description: true, metaTitle: true, metaDescription: true },
    });
    if (!product) return { title: "Package Not Found" };
    return {
      title: product.metaTitle || `${product.name} | PimpMyParty`,
      description: product.metaDescription || product.description?.slice(0, 160) || "",
    };
  } catch {
    return { title: "Package | PimpMyParty" };
  }
}

async function getPackage(slug: string) {
  try {
    const product = await db.product.findUnique({
      where: { slug },
      include: {
        vendor: {
          select: {
            id: true, name: true, slug: true, city: true, country: true, countryCode: true,
            rating: true, reviewCount: true, avatarImage: true, verified: true,
            whatsapp: true, ecosystem: true, category: true,
          },
        },
      },
    });
    if (!product || product.ecosystem !== "PIMPMYPARTY") return null;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      offerPrice: product.offerPrice,
      currency: product.currency || "INR",
      image: product.image,
      images: product.images ? parseJsonArray<string>(product.images) : [],
      videoUrl: product.videoUrl,
      productType: product.productType,
      category: product.category,
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured || product.featured,
      deliveryAvailable: product.deliveryAvailable,
      pickupAvailable: product.pickupAvailable,
      minGuests: product.minGuests,
      pricePerHead: product.pricePerHead,
      featured: product.featured,
      createdAt: product.createdAt.toISOString(),
      vendor: product.vendor ? {
        id: product.vendor.id,
        name: product.vendor.name,
        slug: product.vendor.slug,
        city: product.vendor.city,
        country: product.vendor.country,
        rating: product.vendor.rating,
        reviewCount: product.vendor.reviewCount,
        avatarImage: product.vendor.avatarImage,
        verified: product.vendor.verified,
        whatsapp: product.vendor.whatsapp,
        ecosystem: product.vendor.ecosystem,
        category: product.vendor.category,
      } : null,
      productInfo: extractFromExtraFields(product.extraFields),
    };
  } catch (error) {
    console.error("[package detail] fetch failed:", error);
    return null;
  }
}

export default async function PackageDetailPage({ params }: Props) {
  const { slug } = await params;
  const pkg = await getPackage(slug);
  if (!pkg) notFound();

  return <PackageDetailClient pkg={pkg} />;
}
