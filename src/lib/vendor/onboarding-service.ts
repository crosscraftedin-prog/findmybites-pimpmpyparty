/**
 * Vendor Onboarding Service
 *
 * Calculates profile completion percentage and generates a step-by-step
 * onboarding checklist for vendors. Supports both FindMyBites and PimpMyParty
 * with platform-specific items.
 */

import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  weight: number;
  section: string;
  action?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
  completed: number;
  total: number;
}

export interface OnboardingState {
  completion: number;
  level: "getting_started" | "halfway" | "almost_ready" | "live";
  levelLabel: string;
  sections: ChecklistSection[];
  nextStep: ChecklistItem | null;
  nextSectionId: string | null;
  totalItems: number;
  completedItems: number;
  isLive: boolean;
}

export async function computeOnboarding(vendorId: string): Promise<OnboardingState | null> {
  const vendor = await db.vendor.findUnique({
    where: { id: vendorId },
    include: {
      products: {
        where: { isAvailable: true },
        select: { id: true, image: true, price: true, name: true },
        take: 20,
      },
    },
  });

  if (!vendor) return null;

  const isFood = vendor.ecosystem === "FINDMYBITES";
  const items: ChecklistItem[] = [];

  // Business Profile (50%)
  items.push({ id: "logo", label: "Upload Business Logo", completed: !!vendor.avatarImage, weight: 8, section: "listing", action: "listing" });
  items.push({ id: "cover", label: "Upload Cover Photo", completed: !!vendor.heroImage, weight: 8, section: "listing", action: "listing" });
  items.push({ id: "description", label: "Add Business Description", completed: !!vendor.description && vendor.description.length > 30, weight: 8, section: "listing", action: "listing" });
  items.push({ id: "category", label: "Select Business Category", completed: vendor.category !== "bakers-bakery" || !!vendor.subcategory, weight: 8, section: "listing", action: "listing" });
  items.push({ id: "address", label: "Add Business Address", completed: !!vendor.address && vendor.address.length > 3, weight: 8, section: "listing", action: "listing" });
  items.push({ id: "city", label: "Select City", completed: vendor.city !== "Unknown" && !!vendor.city, weight: 5, section: "listing", action: "listing" });
  items.push({ id: "map", label: "Pin Business Location on Map", completed: vendor.latitude != null && vendor.longitude != null, weight: 5, section: "listing", action: "listing" });

  // Contact Information (15%)
  items.push({ id: "whatsapp", label: "Verify WhatsApp Number", completed: !!vendor.whatsapp, weight: 8, section: "settings", action: "settings" });
  items.push({ id: "email", label: "Add Email Address", completed: !!vendor.userEmail, weight: 4, section: "settings", action: "settings" });
  items.push({ id: "website", label: "Add Website (optional)", completed: !!vendor.website, weight: 2, section: "settings", action: "settings" });
  items.push({ id: "social", label: "Add Social Media Links (optional)", completed: !!(vendor.instagram || vendor.facebook || vendor.youtube || vendor.tiktok), weight: 1, section: "settings", action: "settings" });

  // Products / Services (35%)
  const productCount = vendor.products.length;
  if (isFood) {
    items.push({ id: "first_product", label: "Add First Product", completed: productCount >= 1, weight: 15, section: "products", action: "products" });
    items.push({ id: "five_products", label: "Add At Least 5 Products", completed: productCount >= 5, weight: 10, section: "products", action: "products" });
    items.push({ id: "product_images", label: "Add Product Images", completed: vendor.products.some(p => !!p.image), weight: 5, section: "products", action: "products" });
    items.push({ id: "product_prices", label: "Add Prices to All Products", completed: productCount > 0 && vendor.products.every(p => p.price > 0), weight: 5, section: "products", action: "products" });
  } else {
    items.push({ id: "first_package", label: "Add First Service Package", completed: productCount >= 1, weight: 15, section: "products", action: "products" });
    items.push({ id: "five_packages", label: "Add At Least 5 Packages", completed: productCount >= 5, weight: 10, section: "products", action: "products" });
    items.push({ id: "package_images", label: "Add Package Images", completed: vendor.products.some(p => !!p.image), weight: 5, section: "products", action: "products" });
    items.push({ id: "service_area", label: "Add Service Area", completed: !!vendor.serviceAreas, weight: 5, section: "products", action: "products" });
  }

  // Calculate completion
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const completedWeight = items.filter(i => i.completed).reduce((sum, item) => sum + item.weight, 0);
  const completion = Math.round((completedWeight / totalWeight) * 100);

  // Group by section
  const sectionMap = new Map<string, ChecklistSection>();
  for (const item of items) {
    if (!sectionMap.has(item.section)) {
      sectionMap.set(item.section, {
        id: item.section,
        title: item.section === "listing" ? "Business Profile" : item.section === "settings" ? "Contact Information" : "Products / Services",
        items: [],
        completed: 0,
        total: 0,
      });
    }
    const section = sectionMap.get(item.section)!;
    section.items.push(item);
    section.total++;
    if (item.completed) section.completed++;
  }

  const nextStep = items.find(i => !i.completed) ?? null;

  let level: OnboardingState["level"];
  let levelLabel: string;
  if (completion >= 100) { level = "live"; levelLabel = "Your Business Is Live!"; }
  else if (completion >= 75) { level = "almost_ready"; levelLabel = "Almost Ready"; }
  else if (completion >= 50) { level = "halfway"; levelLabel = "Halfway There"; }
  else { level = "getting_started"; levelLabel = "Getting Started"; }

  const requiredComplete =
    !!vendor.avatarImage &&
    !!vendor.description &&
    !!vendor.address &&
    vendor.city !== "Unknown" &&
    productCount >= 1 &&
    !!vendor.whatsapp;

  return {
    completion,
    level,
    levelLabel,
    sections: Array.from(sectionMap.values()),
    nextStep,
    nextSectionId: nextStep?.action ?? null,
    totalItems: items.length,
    completedItems: items.filter(i => i.completed).length,
    isLive: requiredComplete && completion >= 80,
  };
}

export async function getAdminOnboardingOverview() {
  const vendors = await db.vendor.findMany({
    where: { approved: true },
    select: {
      id: true, name: true, slug: true, ecosystem: true, country: true, countryCode: true,
      city: true, avatarImage: true, heroImage: true, description: true,
      address: true, whatsapp: true, userEmail: true, website: true,
      instagram: true, latitude: true, longitude: true, category: true,
      subcategory: true, serviceAreas: true, invite_type: true, createdAt: true,
      _count: { select: { products: { where: { isAvailable: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return vendors.map(v => {
    const checks = [
      !!v.avatarImage, !!v.heroImage, !!v.description && v.description.length > 30,
      !!v.address && v.address.length > 3, v.city !== "Unknown" && !!v.city,
      v.latitude != null && v.longitude != null, !!v.whatsapp, !!v.userEmail,
      (v._count?.products ?? 0) >= 1, (v._count?.products ?? 0) >= 5,
    ];
    const completed = checks.filter(Boolean).length;
    const completion = Math.round((completed / checks.length) * 100);
    const productCount = v._count?.products ?? 0;

    let status: string;
    let statusColor: string;
    if (completion >= 100) { status = "Live"; statusColor = "green"; }
    else if (completion >= 75) { status = "Almost Ready"; statusColor = "green"; }
    else if (completion >= 50) { status = "Halfway"; statusColor = "amber"; }
    else if (productCount === 0) { status = "Needs Products"; statusColor = "amber"; }
    else if (!v.avatarImage && !v.heroImage) { status = "Waiting For Photos"; statusColor = "orange"; }
    else { status = "Incomplete"; statusColor = "red"; }

    return {
      id: v.id, name: v.name, slug: v.slug, ecosystem: v.ecosystem, country: v.country,
      countryCode: v.countryCode, completion, status, statusColor,
      productCount, invite_type: v.invite_type, createdAt: v.createdAt,
    };
  });
}
