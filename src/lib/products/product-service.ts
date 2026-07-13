/**
 * Product Service — Scalable Product Management
 * Supports both FindMyBites (food) and PimpMyParty (packages).
 * All operations validate vendor ownership.
 */
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";
import { extractFromExtraFields, mergeIntoExtraFields, type ProductInfo } from "./product-info";

// ── Type normalization helper ──────────────────────────────────────────────
// HTML form inputs arrive as strings. Prisma Int fields reject strings.
// This converts any value to a proper number or null.
const toInt = (value: unknown): number | null => {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : Math.trunc(n);
};

// Some Int fields should default to 0 rather than null when empty
const toIntOrZero = (value: unknown): number => {
  const n = toInt(value);
  return n === null ? 0 : n;
};

export interface ProductSearchParams {
  vendorId: string;
  search?: string;
  category?: string;
  status?: "all" | "active" | "draft" | "out_of_stock" | "temporarily_unavailable" | "seasonal" | "archived" | "hidden" | "unavailable";
  sortBy?: "newest" | "oldest" | "price_high" | "price_low" | "name" | "views";
  limit?: number;
  offset?: number;
}

export interface ProductStats {
  total: number; active: number; draft: number; hidden: number;
  unavailable: number; totalViews: number; totalEnquiries: number;
}

export interface ProductDetail {
  id: string; vendorId: string; name: string; slug: string;
  description: string | null; shortDescription: string | null;
  price: number; offerPrice: number | null; currency: string;
  image: string | null; images: string[]; videoUrl: string | null;
  productType: string | null; category: string | null; subCategory: string | null;
  ecosystem: string | null;
  sizes: string | null; flavours: string | null; weight: string | null;
  prepTime: string | null; servings: string | null; shape: string | null;
  ingredients: string | null; allergenInfo: string | null; spicyLevel: string | null;
  eggless: boolean; vegetarian: boolean; vegan: boolean; halal: boolean;
  glutenFree: boolean; sugarFree: boolean;
  deliveryAvailable: boolean; pickupAvailable: boolean; customOrder: boolean; sameDay: boolean;
  startingFromPrice: boolean; hidePrice: boolean; priceOnRequest: boolean;
  isAvailable: boolean; inStock: boolean; limitedTime: boolean; customOrderOnly: boolean;
  featured: boolean; isFeatured: boolean;
  tags: string[]; metaTitle: string | null; metaDescription: string | null;
  duration: string | null; capacity: number | null; includes: string[];
  serviceAreas: string | null;
  includedServices: string[]; optionalServices: string[];
  equipmentIncluded: string | null; indoorOutdoor: string | null;
  travelAvailable: boolean; bookingNotice: string | null; cancellationPolicy: string | null;
  leadTime: string | null; pricingTiers: any[] | null;
  variants: any[] | null;
  views: number; enquiryCount: number; sortOrder: number;
  createdAt: string; updatedAt: string;
  // ── Inventory & Availability Management ──
  status: string;
  salesRevenue: number;
  maxOrdersPerDay: number | null;
  availabilityMode: string;
  availableDays: string[];
  availabilityStart: string | null;
  availabilityEnd: string | null;
  preparationTimeCategory: string | null;
  preparationTimeCustom: string | null;
  bookingNoticeHours: number | null;
  serviceAreaType: string | null;
  serviceCities: string[];
  forceHidden: boolean;
  adminNotes: string | null;
  seasonLabel: string | null;
  stockType: string | null;
  stockCount: number | null;
  lowStockThreshold: number;
  orderCount: number;
  lastViewedAt: string | null;
  // ── Product Information System (stored in extraFields JSON) ──
  productInfo: import("./product-info").ProductInfo;
}

function toDetail(p: any): ProductDetail {
  return {
    id: p.id, vendorId: p.vendorId, name: p.name, slug: p.slug,
    description: p.description, shortDescription: p.shortDescription ?? null,
    price: p.price, offerPrice: p.offerPrice ?? null, currency: p.currency ?? "INR",
    image: p.image, images: p.images ? parseJsonArray<string>(p.images) : [],
    videoUrl: p.videoUrl ?? null, productType: p.productType ?? null,
    category: p.category ?? null, subCategory: p.subCategory ?? null, ecosystem: p.ecosystem ?? null,
    sizes: p.sizes ?? null, flavours: p.flavours ?? null, weight: p.weight ?? null,
    prepTime: p.prepTime ?? null, servings: p.servings ?? null, shape: p.shape ?? null,
    ingredients: p.ingredients ?? null, allergenInfo: p.allergenInfo ?? null, spicyLevel: p.spicyLevel ?? null,
    eggless: p.eggless ?? false, vegetarian: p.vegetarian ?? false, vegan: p.vegan ?? false,
    halal: p.halal ?? false, glutenFree: p.glutenFree ?? false, sugarFree: p.sugarFree ?? false,
    deliveryAvailable: p.deliveryAvailable ?? false, pickupAvailable: p.pickupAvailable ?? false,
    customOrder: p.customOrder ?? false, sameDay: p.sameDay ?? false,
    startingFromPrice: p.startingFromPrice ?? false, hidePrice: p.hidePrice ?? false, priceOnRequest: p.priceOnRequest ?? false,
    isAvailable: p.isAvailable ?? true, inStock: p.inStock ?? true,
    limitedTime: p.limitedTime ?? false, customOrderOnly: p.customOrderOnly ?? false,
    featured: p.featured ?? false, isFeatured: p.isFeatured ?? false,
    tags: (p as any).tags ? parseJsonArray<string>((p as any).tags) : [],
    metaTitle: p.metaTitle ?? null, metaDescription: p.metaDescription ?? null,
    duration: p.duration ?? null, capacity: p.capacity ?? null,
    includes: p.includes ? parseJsonArray<string>(p.includes) : [],
    serviceAreas: p.serviceAreas ?? null,
    includedServices: p.includedServices ? parseJsonArray<string>(p.includedServices) : [],
    optionalServices: p.optionalServices ? parseJsonArray<string>(p.optionalServices) : [],
    equipmentIncluded: p.equipmentIncluded ?? null, indoorOutdoor: p.indoorOutdoor ?? null,
    travelAvailable: p.travelAvailable ?? false, bookingNotice: p.bookingNotice ?? null,
    cancellationPolicy: p.cancellationPolicy ?? null, leadTime: p.leadTime ?? null,
    pricingTiers: p.pricingTiers ? JSON.parse(p.pricingTiers) : null,
    variants: (p as any).variants ? (typeof (p as any).variants === "string" ? JSON.parse((p as any).variants) : (p as any).variants) : [],
    views: p.views ?? 0, enquiryCount: p.enquiryCount ?? 0, sortOrder: p.sortOrder ?? 0,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
    // ── Inventory & Availability Management ──
    status: p.status ?? "active",
    salesRevenue: p.salesRevenue ?? 0,
    maxOrdersPerDay: p.maxOrdersPerDay ?? null,
    availabilityMode: p.availabilityMode ?? "always",
    availableDays: p.availableDays ? safeParseArr<string>(p.availableDays) : [],
    availabilityStart: p.availabilityStart ? (p.availabilityStart instanceof Date ? p.availabilityStart.toISOString() : p.availabilityStart) : null,
    availabilityEnd: p.availabilityEnd ? (p.availabilityEnd instanceof Date ? p.availabilityEnd.toISOString() : p.availabilityEnd) : null,
    preparationTimeCategory: p.preparationTimeCategory ?? null,
    preparationTimeCustom: p.preparationTimeCustom ?? null,
    bookingNoticeHours: p.bookingNoticeHours ?? null,
    serviceAreaType: p.serviceAreaType ?? null,
    serviceCities: p.serviceCities ? safeParseArr<string>(p.serviceCities) : [],
    forceHidden: p.forceHidden ?? false,
    adminNotes: p.adminNotes ?? null,
    seasonLabel: p.seasonLabel ?? null,
    stockType: p.stockType ?? "unlimited",
    stockCount: p.stockCount ?? null,
    lowStockThreshold: p.lowStockThreshold ?? 10,
    orderCount: p.orderCount ?? 0,
    lastViewedAt: p.lastViewedAt ? (p.lastViewedAt instanceof Date ? p.lastViewedAt.toISOString() : p.lastViewedAt) : null,
    // ── Product Information System (stored in extraFields JSON) ──
    productInfo: extractFromExtraFields((p as any).extraFields),
  };
}

function safeParseArr<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as T[]; } catch { return []; }
}

export async function searchProducts(params: ProductSearchParams) {
  const where: any = { vendorId: params.vendorId };
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params.category) where.category = params.category;
  // Unified status taxonomy: active | draft | out_of_stock | temporarily_unavailable | seasonal | archived
  if (params.status && params.status !== "all") { where.status = params.status; }

  let orderBy: any = { createdAt: "desc" };
  if (params.sortBy === "oldest") orderBy = { createdAt: "asc" };
  else if (params.sortBy === "price_high") orderBy = { price: "desc" };
  else if (params.sortBy === "price_low") orderBy = { price: "asc" };
  else if (params.sortBy === "name") orderBy = { name: "asc" };
  else if (params.sortBy === "views") orderBy = { views: "desc" };

  const [rows, total] = await Promise.all([
    db.product.findMany({ where, orderBy, take: Math.min(params.limit ?? 50, 100), skip: params.offset ?? 0 }),
    db.product.count({ where }),
  ]);
  return { products: rows.map(toDetail), total };
}

export async function getProductStats(vendorId: string): Promise<ProductStats> {
  const [total, active, draft, outOfStock, unavailable, viewsAgg] = await Promise.all([
    db.product.count({ where: { vendorId } }),
    db.product.count({ where: { vendorId, status: "active" } }),
    db.product.count({ where: { vendorId, status: "draft" } }),
    db.product.count({ where: { vendorId, status: "out_of_stock" } }),
    db.product.count({ where: { vendorId, status: "temporarily_unavailable" } }),
    db.product.aggregate({ where: { vendorId }, _sum: { views: true } }),
  ]);
  return { total, active, draft, hidden: outOfStock, unavailable, totalViews: viewsAgg._sum.views ?? 0, totalEnquiries: 0 };
}

export async function getProduct(productId: string, vendorId: string): Promise<ProductDetail | null> {
  const p = await db.product.findFirst({ where: { id: productId, vendorId } });
  return p ? toDetail(p) : null;
}

// ── Subscription-based product limits ────────────────────────────────────────
const PRODUCT_LIMITS: Record<string, number> = {
  free: 5,
  pro: 25,
  business: Infinity,
};

export async function getProductLimit(vendorId: string): Promise<{ limit: number; current: number; canCreate: boolean }> {
  const [subscription, currentCount] = await Promise.all([
    db.vendorSubscription.findFirst({
      where: { vendorId, status: "active" },
      orderBy: { createdAt: "desc" },
      select: { planTier: true },
    }).catch(() => null),
    db.product.count({ where: { vendorId, status: { notIn: ["archived", "draft"] } } }),
  ]);
  const tier = subscription?.planTier || "free";
  const limit = PRODUCT_LIMITS[tier] ?? PRODUCT_LIMITS.free;
  return { limit, current: currentCount, canCreate: currentCount < limit };
}

export async function createProduct(vendorId: string, data: any): Promise<ProductDetail> {
  // ── Enforce subscription limit ──
  const { canCreate, limit, current } = await getProductLimit(vendorId);
  if (!canCreate) {
    throw new Error(`Product limit reached (${current}/${limit}). Upgrade your subscription to add more products.`);
  }

  const nameSlug = (data.name || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "product";
  const slug = `${nameSlug}-${Date.now().toString(36)}`;
  const p = await db.product.create({ data: {
    vendorId, name: data.name || "Untitled", slug,
    description: data.description || null, shortDescription: data.shortDescription || null,
    price: toIntOrZero(data.price), offerPrice: toInt(data.offerPrice), currency: data.currency || "INR",
    image: data.image || null, images: data.images ? JSON.stringify(data.images) : null,
    videoUrl: data.videoUrl || null, productType: data.productType || null,
    category: data.category || null, subCategory: data.subCategory || null, ecosystem: data.ecosystem || null,
    sizes: data.sizes || null, flavours: data.flavours || null, weight: data.weight || null,
    prepTime: data.prepTime || null, servings: data.servings || null, shape: data.shape || null,
    ingredients: data.ingredients || null, allergenInfo: data.allergenInfo || null, spicyLevel: data.spicyLevel || null,
    eggless: data.eggless ?? false, vegetarian: data.vegetarian ?? false, vegan: data.vegan ?? false,
    halal: data.halal ?? false, glutenFree: data.glutenFree ?? false, sugarFree: data.sugarFree ?? false,
    deliveryAvailable: data.deliveryAvailable ?? false, pickupAvailable: data.pickupAvailable ?? false,
    customOrder: data.customOrder ?? false, sameDay: data.sameDay ?? false,
    startingFromPrice: data.startingFromPrice ?? false, hidePrice: data.hidePrice ?? false,
    priceOnRequest: data.priceOnRequest ?? false, isAvailable: data.isAvailable ?? true,
    inStock: data.inStock ?? true, limitedTime: data.limitedTime ?? false,
    customOrderOnly: data.customOrderOnly ?? false, featured: data.featured ?? false,
    metaTitle: data.metaTitle || null, metaDescription: data.metaDescription || null,
    duration: data.duration || null, capacity: toInt(data.capacity),
    includes: data.includes ? JSON.stringify(data.includes) : null,
    includedServices: data.includedServices ? JSON.stringify(data.includedServices) : null,
    optionalServices: data.optionalServices ? JSON.stringify(data.optionalServices) : null,
    equipmentIncluded: data.equipmentIncluded || null, indoorOutdoor: data.indoorOutdoor || null,
    travelAvailable: data.travelAvailable ?? false, bookingNotice: data.bookingNotice || null,
    cancellationPolicy: data.cancellationPolicy || null, leadTime: data.leadTime || null,
    pricingTiers: data.pricingTiers ? JSON.stringify(data.pricingTiers) : null,
    variants: data.variants ? (typeof data.variants === "string" ? data.variants : JSON.stringify(data.variants)) : null,
    status: data.status || "active",
    // ── Inventory & Availability Management defaults ──
    stockType: data.stockType || "unlimited",
    stockCount: toInt(data.stockCount),
    lowStockThreshold: toInt(data.lowStockThreshold) ?? 10,
    maxOrdersPerDay: toInt(data.maxOrdersPerDay),
    availabilityMode: data.availabilityMode || "always",
    availableDays: Array.isArray(data.availableDays) && data.availableDays.length ? JSON.stringify(data.availableDays) : null,
    availabilityStart: data.availabilityStart ? new Date(data.availabilityStart) : null,
    availabilityEnd: data.availabilityEnd ? new Date(data.availabilityEnd) : null,
    preparationTimeCategory: data.preparationTimeCategory || null,
    preparationTimeCustom: data.preparationTimeCustom || null,
    bookingNoticeHours: toInt(data.bookingNoticeHours),
    serviceAreaType: data.serviceAreaType || null,
    serviceCities: Array.isArray(data.serviceCities) && data.serviceCities.length ? JSON.stringify(data.serviceCities) : null,
    seasonLabel: data.seasonLabel || null,
    // ── Product Information System (stored in extraFields JSON) ──
    extraFields: mergeIntoExtraFields(null, data.productInfo),
  }});
  return toDetail(p);
}

export async function updateProduct(productId: string, vendorId: string, data: any): Promise<ProductDetail> {
  const existing = await db.product.findFirst({ where: { id: productId, vendorId } });
  if (!existing) throw new Error("Product not found or not owned by this vendor");
  const updateData: any = {};
  // NOTE: forceHidden, adminNotes, salesRevenue, orderCount are admin/system-only
  // and intentionally excluded here so vendors cannot self-promote or self-unhide.

  // ── Numeric Int fields — must be converted from string→number ──
  // HTML form inputs arrive as strings; Prisma rejects strings for Int fields.
  const INT_FIELDS = ["price", "offerPrice", "capacity", "stockCount", "lowStockThreshold",
    "maxOrdersPerDay", "bookingNoticeHours", "comparePrice", "minGuests", "pricePerHead",
    "bundleDiscount", "minOrderForOffer", "discountPercent", "sortOrder", "views",
    "enquiryCount", "orderCount", "salesRevenue"];
  for (const f of INT_FIELDS) {
    if (data[f] !== undefined) {
      updateData[f] = toInt(data[f]);
    }
  }

  // ── String/Boolean fields — copy directly ──
  const fields = ["name","description","shortDescription","currency","image","videoUrl",
    "productType","category","subCategory","ecosystem","sizes","flavours","weight","prepTime","servings","shape",
    "ingredients","allergenInfo","spicyLevel","eggless","vegetarian","vegan","halal","glutenFree","sugarFree",
    "deliveryAvailable","pickupAvailable","customOrder","sameDay","startingFromPrice","hidePrice","priceOnRequest",
    "isAvailable","inStock","limitedTime","customOrderOnly","featured","metaTitle","metaDescription",
    "duration","equipmentIncluded","indoorOutdoor","travelAvailable",
    "bookingNotice","cancellationPolicy","leadTime","status",
    "availabilityMode","preparationTimeCategory","preparationTimeCustom","serviceAreaType",
    "seasonLabel","stockType"];
  for (const f of fields) { if (data[f] !== undefined) updateData[f] = data[f]; }
  if (data.images !== undefined) updateData.images = data.images ? JSON.stringify(data.images) : null;
  if (data.includes !== undefined) updateData.includes = data.includes ? JSON.stringify(data.includes) : null;
  if (data.includedServices !== undefined) updateData.includedServices = data.includedServices ? JSON.stringify(data.includedServices) : null;
  if (data.optionalServices !== undefined) updateData.optionalServices = data.optionalServices ? JSON.stringify(data.optionalServices) : null;
  if (data.pricingTiers !== undefined) updateData.pricingTiers = data.pricingTiers ? JSON.stringify(data.pricingTiers) : null;
  if (data.variants !== undefined) updateData.variants = data.variants ? (typeof data.variants === "string" ? data.variants : JSON.stringify(data.variants)) : null;
  if (data.availableDays !== undefined) updateData.availableDays = Array.isArray(data.availableDays) && data.availableDays.length ? JSON.stringify(data.availableDays) : null;
  if (data.serviceCities !== undefined) updateData.serviceCities = Array.isArray(data.serviceCities) && data.serviceCities.length ? JSON.stringify(data.serviceCities) : null;
  // Normalise date fields
  if (data.availabilityStart !== undefined) updateData.availabilityStart = data.availabilityStart ? new Date(data.availabilityStart) : null;
  if (data.availabilityEnd !== undefined) updateData.availabilityEnd = data.availabilityEnd ? new Date(data.availabilityEnd) : null;
  // ── Product Information System (stored in extraFields JSON) ──
  if (data.productInfo !== undefined) {
    updateData.extraFields = mergeIntoExtraFields(existing.extraFields, data.productInfo);
  }
  const p = await db.product.update({ where: { id: productId }, data: updateData });
  return toDetail(p);
}

export async function deleteProduct(productId: string, vendorId: string): Promise<void> {
  const existing = await db.product.findFirst({ where: { id: productId, vendorId } });
  if (!existing) throw new Error("Product not found or not owned by this vendor");
  await db.product.delete({ where: { id: productId } });
}

export async function duplicateProduct(productId: string, vendorId: string): Promise<ProductDetail> {
  const existing = await db.product.findFirst({ where: { id: productId, vendorId } });
  if (!existing) throw new Error("Product not found or not owned by this vendor");
  const nameSlug = existing.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "product";
  const slug = `${nameSlug}-copy-${Date.now().toString(36)}`;
  const { id, createdAt, updatedAt, ...rest } = existing;
  const p = await db.product.create({ data: { ...rest, name: `${existing.name} (Copy)`, slug, status: "draft", views: 0 } });
  return toDetail(p);
}

export async function incrementViews(productId: string): Promise<void> {
  try { await db.product.update({ where: { id: productId }, data: { views: { increment: 1 } } }); } catch {}
}
