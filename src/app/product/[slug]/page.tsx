import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { getCategoryInfo } from "@/lib/category-server";
import { ProductPageClient } from "./product-page-client";

/**
 * /product/[slug] — public product/service detail page (what CUSTOMERS see).
 *
 * Server component: fetches product data for SEO metadata + JSON-LD structured
 * data, then hands off to the client component for interactivity.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  try {
    const p = await db.product.findUnique({
      where: { slug },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            ecosystem: true,
            category: true,
            city: true,
            country: true,
            countryCode: true,
            currency: true,
            rating: true,
            reviewCount: true,
            avatarImage: true,
            verified: true,
            featured: true,
            deliveryAvailable: true,
            pickupAvailable: true,
          },
        },
      },
    });

    if (!p || !p.isAvailable) return null;

    return p;
  } catch (err) {
    console.error("[product/[slug]] getProduct failed:", err);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: "Product not found — FindMyBites × PimpMyParty" };
  }

  const cat = product.vendor ? await getCategoryInfo(product.vendor.category) : null;
  const isFood = product.vendor?.ecosystem === "FINDMYBITES";
  const currencySymbol =
    product.vendor?.currency === "INR" ? "₹" :
    product.vendor?.currency === "USD" ? "$" :
    product.vendor?.currency === "GBP" ? "£" :
    product.vendor?.currency === "AED" ? "AED" : "";

  const title =
    product.metaTitle ||
    `${product.name} — ${currencySymbol}${product.price} | ${product.vendor?.name ?? "Vendor"}`;
  const description =
    product.metaDescription ||
    product.description ||
    `${product.name} by ${product.vendor?.name}. ${product.description || ""} Book on FindMyBites × PimpMyParty.`;
  const ogImage = product.image || (product.images ? parseJsonArray<string>(product.images)[0] : undefined);

  return {
    title,
    description,
    alternates: {
      canonical: `https://findmybites.com/product/${product.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://findmybites.com/product/${product.slug}`,
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

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const cat = product.vendor ? await getCategoryInfo(product.vendor.category) : null;
  const isFood = product.vendor?.ecosystem === "FINDMYBITES";

  // JSON-LD Product structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `https://findmybites.com/product/${product.slug}`,
    name: product.name,
    description: product.metaDescription || product.description || "",
    image: product.image || (product.images ? parseJsonArray<string>(product.images) : []),
    url: `https://findmybites.com/product/${product.slug}`,
    sku: product.id,
    brand: product.vendor
      ? { "@type": "Brand", name: product.vendor.name }
      : undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.vendor?.currency || "USD",
      availability: product.isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `https://findmybites.com/product/${product.slug}`,
      seller: product.vendor
        ? { "@type": "Organization", name: product.vendor.name }
        : undefined,
    },
    aggregateRating: undefined as any, // added below if vendor has reviews
  };

  if (product.vendor && product.vendor.reviewCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.vendor.rating,
      reviewCount: product.vendor.reviewCount,
      bestRating: 5,
    };
  }

  // Breadcrumbs structured data
  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isFood ? "FindMyBites" : "PimpMyParty",
        item: `https://findmybites.com/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: cat?.label || "Vendors",
        item: `https://findmybites.com/vendor/${product.vendor?.slug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `https://findmybites.com/product/${product.slug}`,
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
      <ProductPageClient slug={slug} />
    </>
  );
}
