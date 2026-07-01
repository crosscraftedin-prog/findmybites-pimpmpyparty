import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { getCategoryInfo } from "@/lib/category-server";
import type { VendorWithRelations } from "@/lib/types";
import { VendorProfileClient } from "./vendor-profile-client";

/**
 * /vendor/[slug] — public vendor profile page (what CUSTOMERS see).
 *
 * Server component: fetches vendor data for SEO metadata + initial render,
 * then hands off to the client component for interactivity.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getVendor(slug: string): Promise<VendorWithRelations | null> {
  try {
    const v = await db.vendor.findUnique({
      where: { slug },
      include: { reviews: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    if (!v) return null;
    return {
      id: v.id,
      name: v.name,
      slug: v.slug,
      ecosystem: v.ecosystem as VendorWithRelations["ecosystem"],
      category: v.category,
      tagline: v.tagline,
      description: v.description,
      city: v.city,
      country: v.country,
      countryCode: v.countryCode,
      continent: v.continent,
      currency: v.currency,
      priceRange: v.priceRange,
      basePrice: v.basePrice,
      rating: v.rating,
      reviewCount: v.reviewCount,
      heroImage: v.heroImage,
      avatarImage: v.avatarImage,
      gallery: parseJsonArray<string>(v.gallery),
      tags: parseJsonArray<string>(v.tags),
      featured: v.featured,
      approved: v.approved,
      verified: v.verified,
      responseTime: v.responseTime,
      yearsActive: v.yearsActive,
      completedBookings: v.completedBookings,
      subcategory: v.subcategory,
      state: v.state,
      address: v.address,
      zipCode: v.zipCode,
      instagram: v.instagram,
      website: v.website,
      whatsapp: v.whatsapp,
      facebook: (v as any).facebook,
      youtube: (v as any).youtube,
      tiktok: (v as any).tiktok,
      twitter: (v as any).twitter,
      snapchat: (v as any).snapchat,
      fssaiNumber: (v as any).fssaiNumber,
      settingsLocked: (v as any).settingsLocked,
      planExpiresAt: (v as any).planExpiresAt?.toISOString() ?? null,
      openHours: v.openHours,
      deliveryAvailable: v.deliveryAvailable,
      pickupAvailable: v.pickupAvailable,
      serviceAreas: v.serviceAreas,
      metaTitle: v.metaTitle,
      metaDescription: v.metaDescription,
      latitude: v.latitude,
      longitude: v.longitude,
      serviceRadiusKm: v.serviceRadiusKm,
      userEmail: v.userEmail,
      owner_user_id: v.owner_user_id,
      createdAt: v.createdAt.toISOString(),
      reviews: v.reviews.map((r) => ({
        id: r.id,
        vendorId: r.vendorId,
        author: r.author,
        avatar: r.avatar,
        rating: r.rating,
        comment: r.comment,
        eventDate: r.eventDate,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  } catch (err) {
    console.error("[vendor/[slug]] getVendor failed:", err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await getVendor(slug);
  if (!vendor) {
    return { title: "Vendor not found — FindMyBites × PimpMyParty" };
  }
  const cat = await getCategoryInfo(vendor.category);
  const catLabel = cat?.label ?? "Vendor";
  const title =
    vendor.metaTitle ||
    `${vendor.name} — ${catLabel} in ${vendor.city} | FindMyBites`;
  const description =
    vendor.metaDescription ||
    vendor.tagline ||
    `${vendor.name} is a ${catLabel} in ${vendor.city}, ${vendor.country}. Book on FindMyBites × PimpMyParty.`;
  const ogImage = vendor.heroImage || vendor.avatarImage || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `https://findmybites.com/vendor/${vendor.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://findmybites.com/vendor/${vendor.slug}`,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function VendorProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const vendor = await getVendor(slug);
  if (!vendor) {
    notFound();
  }

  // JSON-LD structured data for SEO
  const cat = await getCategoryInfo(vendor.category);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": vendor.ecosystem === "FINDMYBITES" ? "Bakery" : "LocalBusiness",
    "@id": `https://findmybites.com/vendor/${vendor.slug}`,
    name: vendor.name,
    description: vendor.metaDescription || vendor.tagline || vendor.description,
    image: vendor.heroImage || vendor.avatarImage,
    url: `https://findmybites.com/vendor/${vendor.slug}`,
    telephone: vendor.whatsapp || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: vendor.city,
      addressRegion: vendor.state || undefined,
      addressCountry: vendor.countryCode,
      postalCode: vendor.zipCode || undefined,
      streetAddress: vendor.address || undefined,
    },
    geo:
      vendor.latitude && vendor.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: vendor.latitude,
            longitude: vendor.longitude,
          }
        : undefined,
    aggregateRating:
      vendor.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: vendor.rating,
            reviewCount: vendor.reviewCount,
            bestRating: 5,
          }
        : undefined,
    priceRange: vendor.priceRange,
    servesCuisine: vendor.ecosystem === "FINDMYBITES" ? cat?.label : undefined,
  };

  // Breadcrumbs structured data
  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: vendor.ecosystem === "FINDMYBITES" ? "FindMyBites" : "PimpMyParty",
        item: `https://findmybites.com/#${vendor.ecosystem === "FINDMYBITES" ? "food" : "party"}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: cat?.label || "Vendors",
        item: `https://findmybites.com/?category=${vendor.category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: vendor.name,
        item: `https://findmybites.com/vendor/${vendor.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <VendorProfileClient vendor={vendor} />
    </>
  );
}
