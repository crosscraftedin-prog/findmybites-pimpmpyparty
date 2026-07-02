/**
 * Product Service — Scalable Product Management
 * Supports both FindMyBites (food) and PimpMyParty (packages).
 * All operations validate vendor ownership.
 */
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/format";

export interface ProductSearchParams {
  vendorId: string;
  search?: string;
  category?: string;
  status?: "active" | "draft" | "hidden" | "unavailable";
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
  views: number; enquiryCount: number; sortOrder: number;
  createdAt: string; updatedAt: string;
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
    tags: p.tags ? parseJsonArray<string>(p.tags) : [],
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
    views: p.views ?? 0, enquiryCount: p.enquiryCount ?? 0, sortOrder: p.sortOrder ?? 0,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
  };
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
  if (params.status === "active") { where.isAvailable = true; }
  else if (params.status === "draft") { where.status = "draft"; }
  else if (params.status === "hidden") { where.status = "hidden"; }
  else if (params.status === "unavailable") { where.isAvailable = false; }

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
  const [total, active, draft, hidden, unavailable, viewsAgg] = await Promise.all([
    db.product.count({ where: { vendorId } }),
    db.product.count({ where: { vendorId, isAvailable: true } }),
    db.product.count({ where: { vendorId, status: "draft" } }),
    db.product.count({ where: { vendorId, status: "hidden" } }),
    db.product.count({ where: { vendorId, isAvailable: false } }),
    db.product.aggregate({ where: { vendorId }, _sum: { views: true } }),
  ]);
  return { total, active, draft, hidden, unavailable, totalViews: viewsAgg._sum.views ?? 0, totalEnquiries: 0 };
}

export async function getProduct(productId: string, vendorId: string): Promise<ProductDetail | null> {
  const p = await db.product.findFirst({ where: { id: productId, vendorId } });
  return p ? toDetail(p) : null;
}

export async function createProduct(vendorId: string, data: any): Promise<ProductDetail> {
  const slug = `${(data.name || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${Date.now().toString(36)}`;
  const p = await db.product.create({ data: {
    vendorId, name: data.name || "Untitled", slug,
    description: data.description || null, shortDescription: data.shortDescription || null,
    price: data.price || 0, offerPrice: data.offerPrice ?? null, currency: data.currency || "INR",
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
    tags: data.tags ? JSON.stringify(data.tags) : null,
    metaTitle: data.metaTitle || null, metaDescription: data.metaDescription || null,
    duration: data.duration || null, capacity: data.capacity ?? null,
    includes: data.includes ? JSON.stringify(data.includes) : null,
    serviceAreas: data.serviceAreas || null,
    includedServices: data.includedServices ? JSON.stringify(data.includedServices) : null,
    optionalServices: data.optionalServices ? JSON.stringify(data.optionalServices) : null,
    equipmentIncluded: data.equipmentIncluded || null, indoorOutdoor: data.indoorOutdoor || null,
    travelAvailable: data.travelAvailable ?? false, bookingNotice: data.bookingNotice || null,
    cancellationPolicy: data.cancellationPolicy || null, leadTime: data.leadTime || null,
    pricingTiers: data.pricingTiers ? JSON.stringify(data.pricingTiers) : null,
    status: data.status || "active",
  }});
  return toDetail(p);
}

export async function updateProduct(productId: string, vendorId: string, data: any): Promise<ProductDetail> {
  const existing = await db.product.findFirst({ where: { id: productId, vendorId } });
  if (!existing) throw new Error("Product not found or not owned by this vendor");
  const updateData: any = {};
  const fields = ["name","description","shortDescription","price","offerPrice","currency","image","videoUrl",
    "productType","category","subCategory","ecosystem","sizes","flavours","weight","prepTime","servings","shape",
    "ingredients","allergenInfo","spicyLevel","eggless","vegetarian","vegan","halal","glutenFree","sugarFree",
    "deliveryAvailable","pickupAvailable","customOrder","sameDay","startingFromPrice","hidePrice","priceOnRequest",
    "isAvailable","inStock","limitedTime","customOrderOnly","featured","metaTitle","metaDescription",
    "duration","capacity","serviceAreas","equipmentIncluded","indoorOutdoor","travelAvailable",
    "bookingNotice","cancellationPolicy","leadTime","status"];
  for (const f of fields) { if (data[f] !== undefined) updateData[f] = data[f]; }
  if (data.images !== undefined) updateData.images = data.images ? JSON.stringify(data.images) : null;
  if (data.tags !== undefined) updateData.tags = data.tags ? JSON.stringify(data.tags) : null;
  if (data.includes !== undefined) updateData.includes = data.includes ? JSON.stringify(data.includes) : null;
  if (data.includedServices !== undefined) updateData.includedServices = data.includedServices ? JSON.stringify(data.includedServices) : null;
  if (data.optionalServices !== undefined) updateData.optionalServices = data.optionalServices ? JSON.stringify(data.optionalServices) : null;
  if (data.pricingTiers !== undefined) updateData.pricingTiers = data.pricingTiers ? JSON.stringify(data.pricingTiers) : null;
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
  const slug = `${existing.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-copy-${Date.now().toString(36)}`;
  const { id, createdAt, updatedAt, ...rest } = existing;
  const p = await db.product.create({ data: { ...rest, name: `${existing.name} (Copy)`, slug, status: "draft", views: 0 } });
  return toDetail(p);
}

export async function incrementViews(productId: string): Promise<void> {
  try { await db.product.update({ where: { id: productId }, data: { views: { increment: 1 } } }); } catch {}
}
