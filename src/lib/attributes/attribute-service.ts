/**
 * Global Attribute System — service layer.
 * ─────────────────────────────────────────────────────────────────────────
 * Single source of truth for all attribute operations:
 *   - list/query attributes (with group/ecosystem/active filters)
 *   - CRUD for admin
 *   - get/set vendor attributes
 *   - get/set product attributes
 *   - filter vendors/products by attribute slugs
 *   - tag → attribute migration (best-effort normalization)
 *
 * All API routes and components use THIS module — no direct Prisma queries
 * for attributes elsewhere. This keeps the logic centralized and testable.
 */
import { db } from "@/lib/db";
import {
  ALL_SEED_ATTRIBUTES,
  ATTRIBUTE_GROUPS,
  type AttributeGroup,
  type SeedAttribute,
} from "./seed-data";

// ── Types ──────────────────────────────────────────────────────────────────

export interface AttributeDTO {
  id: string;
  slug: string;
  name: string;
  group: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  sortOrder: number;
  active: boolean;
  ecosystem: string;
}

export interface AttributeWithGroup {
  group: string;
  groupLabel: string;
  attributes: AttributeDTO[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function toDTO(a: {
  id: string;
  slug: string;
  name: string;
  group: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  sortOrder: number;
  active: boolean;
  ecosystem: string;
}): AttributeDTO {
  return {
    id: a.id,
    slug: a.slug,
    name: a.name,
    group: a.group,
    icon: a.icon,
    color: a.color,
    description: a.description,
    sortOrder: a.sortOrder,
    active: a.active,
    ecosystem: a.ecosystem,
  };
}

/**
 * Normalize a free-text tag into a slug for matching against attributes.
 * "Egg less" → "egg-less", "Sugar-Free!" → "sugar-free"
 */
export function normalizeTagToSlug(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Read: list attributes ──────────────────────────────────────────────────

/**
 * List all active attributes, optionally filtered by group/ecosystem.
 * Returns grouped structure for UI rendering.
 */
export async function listAttributes(opts?: {
  group?: AttributeGroup | string;
  ecosystem?: string; // "FINDMYBITES" | "PIMPMYPARTY" | "BOTH"
  activeOnly?: boolean;
}): Promise<AttributeDTO[]> {
  const where: {
    group?: string;
    active?: boolean;
    ecosystem?: { in: string[] };
  } = {};

  if (opts?.group) where.group = opts.group;
  if (opts?.activeOnly !== false) where.active = true;

  if (opts?.ecosystem && opts.ecosystem !== "BOTH") {
    // Include attributes scoped to this ecosystem + "BOTH"
    where.ecosystem = { in: [opts.ecosystem, "BOTH"] };
  }

  const rows = await db.attribute.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toDTO);
}

/**
 * List attributes grouped by their `group` field — for UI panels.
 */
export async function listAttributesGrouped(opts?: {
  ecosystem?: string;
  activeOnly?: boolean;
}): Promise<AttributeWithGroup[]> {
  const attrs = await listAttributes(opts);
  const grouped: AttributeWithGroup[] = [];

  for (const g of ATTRIBUTE_GROUPS) {
    const items = attrs.filter((a) => a.group === g.key);
    if (items.length > 0) {
      grouped.push({
        group: g.key,
        groupLabel: g.label,
        attributes: items,
      });
    }
  }
  return grouped;
}

/**
 * Get a single attribute by slug. Returns null if not found.
 */
export async function getAttributeBySlug(slug: string): Promise<AttributeDTO | null> {
  const row = await db.attribute.findUnique({ where: { slug } });
  return row ? toDTO(row) : null;
}

/**
 * Resolve a comma-separated list of slugs into attribute IDs.
 * Skips unknown slugs silently (defensive).
 */
export async function resolveAttributeSlugs(slugs: string[]): Promise<string[]> {
  if (slugs.length === 0) return [];
  const rows = await db.attribute.findMany({
    where: { slug: { in: slugs }, active: true },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

// ── Read: vendor/product attributes ────────────────────────────────────────

/**
 * Get all attributes assigned to a vendor.
 */
export async function getVendorAttributes(vendorId: string): Promise<AttributeDTO[]> {
  const rows = await db.vendorAttribute.findMany({
    where: { vendorId },
    include: { attribute: true },
    orderBy: { attribute: { sortOrder: "asc" } },
  });
  return rows.map((r) => toDTO(r.attribute));
}

/**
 * Get all attributes assigned to a product.
 */
export async function getProductAttributes(productId: string): Promise<AttributeDTO[]> {
  const rows = await db.productAttribute.findMany({
    where: { productId },
    include: { attribute: true },
    orderBy: { attribute: { sortOrder: "asc" } },
  });
  return rows.map((r) => toDTO(r.attribute));
}

/**
 * Batch-fetch attributes for many vendors (avoids N+1).
 * Returns a map: vendorId → AttributeDTO[]
 */
export async function getVendorAttributesBatch(
  vendorIds: string[]
): Promise<Map<string, AttributeDTO[]>> {
  const result = new Map<string, AttributeDTO[]>();
  if (vendorIds.length === 0) return result;

  const rows = await db.vendorAttribute.findMany({
    where: { vendorId: { in: vendorIds } },
    include: { attribute: true },
    orderBy: { attribute: { sortOrder: "asc" } },
  });

  for (const r of rows) {
    const list = result.get(r.vendorId) ?? [];
    list.push(toDTO(r.attribute));
    result.set(r.vendorId, list);
  }
  return result;
}

/**
 * Batch-fetch attributes for many products (avoids N+1).
 * Returns a map: productId → AttributeDTO[]
 */
export async function getProductAttributesBatch(
  productIds: string[]
): Promise<Map<string, AttributeDTO[]>> {
  const result = new Map<string, AttributeDTO[]>();
  if (productIds.length === 0) return result;

  const rows = await db.productAttribute.findMany({
    where: { productId: { in: productIds } },
    include: { attribute: true },
    orderBy: { attribute: { sortOrder: "asc" } },
  });

  for (const r of rows) {
    const list = result.get(r.productId) ?? [];
    list.push(toDTO(r.attribute));
    result.set(r.productId, list);
  }
  return result;
}

// ── Write: set vendor/product attributes ───────────────────────────────────

/**
 * Replace a vendor's attribute set. Uses delete-then-create (simple, correct
 * for small sets). The unique constraint prevents duplicates.
 */
export async function setVendorAttributes(
  vendorId: string,
  attributeIds: string[]
): Promise<void> {
  const uniqueIds = [...new Set(attributeIds)];

  await db.$transaction([
    db.vendorAttribute.deleteMany({ where: { vendorId } }),
    ...uniqueIds.map((id) =>
      db.vendorAttribute.create({
        data: { vendorId, attributeId: id },
      })
    ),
  ]);
}

/**
 * Replace a product's attribute set.
 */
export async function setProductAttributes(
  productId: string,
  attributeIds: string[]
): Promise<void> {
  const uniqueIds = [...new Set(attributeIds)];

  await db.$transaction([
    db.productAttribute.deleteMany({ where: { productId } }),
    ...uniqueIds.map((id) =>
      db.productAttribute.create({
        data: { productId, attributeId: id },
      })
    ),
  ]);
}

// ── Filter: find vendors/products by attribute slugs ────────────────────────

/**
 * Find vendor IDs that have ALL the specified attribute slugs (AND logic).
 * For OR logic, call with a single slug per query and union.
 *
 * This is the core filter query, optimized by the index on
 * vendor_attributes(attributeId).
 */
export async function findVendorIdsByAttributes(
  attributeSlugs: string[],
  opts?: { ecosystem?: string; category?: string }
): Promise<string[]> {
  if (attributeSlugs.length === 0) return [];

  const attributeIds = await resolveAttributeSlugs(attributeSlugs);
  if (attributeIds.length === 0) return [];

  // AND logic: vendor must have ALL specified attributes.
  // Group by vendorId, count distinct attributes, filter count === total.
  const rows = await db.vendorAttribute.groupBy({
    by: ["vendorId"],
    where: { attributeId: { in: attributeIds } },
    _count: { attributeId: true },
    having: { attributeId: { _count: { equals: attributeIds.length } } },
  });

  let vendorIds = rows.map((r) => r.vendorId);

  // Optional ecosystem/category filter (applied on Vendor table)
  if (opts?.ecosystem || opts?.category) {
    const vendorWhere: { ecosystem?: string; category?: string; approved?: boolean } = {};
    if (opts.ecosystem) vendorWhere.ecosystem = opts.ecosystem;
    if (opts.category) vendorWhere.category = opts.category;
    vendorWhere.approved = true;

    const matched = await db.vendor.findMany({
      where: { id: { in: vendorIds }, ...vendorWhere },
      select: { id: true },
    });
    vendorIds = matched.map((v) => v.id);
  }

  return vendorIds;
}

/**
 * Find product IDs that have ALL the specified attribute slugs (AND logic).
 */
export async function findProductIdsByAttributes(
  attributeSlugs: string[]
): Promise<string[]> {
  if (attributeSlugs.length === 0) return [];

  const attributeIds = await resolveAttributeSlugs(attributeSlugs);
  if (attributeIds.length === 0) return [];

  const rows = await db.productAttribute.groupBy({
    by: ["productId"],
    where: { attributeId: { in: attributeIds } },
    _count: { attributeId: true },
    having: { attributeId: { _count: { equals: attributeIds.length } } },
  });

  return rows.map((r) => r.productId);
}

// ── Admin CRUD ─────────────────────────────────────────────────────────────

export async function createAttribute(input: {
  slug: string;
  name: string;
  group: string;
  icon?: string | null;
  color?: string | null;
  description?: string | null;
  ecosystem?: string;
}): Promise<AttributeDTO> {
  const row = await db.attribute.create({
    data: {
      slug: input.slug.toLowerCase().trim(),
      name: input.name.trim(),
      group: input.group,
      icon: input.icon ?? null,
      color: input.color ?? null,
      description: input.description ?? null,
      ecosystem: input.ecosystem ?? "BOTH",
    },
  });
  return toDTO(row);
}

export async function updateAttribute(
  id: string,
  input: Partial<{
    slug: string;
    name: string;
    group: string;
    icon: string | null;
    color: string | null;
    description: string | null;
    sortOrder: number;
    active: boolean;
    ecosystem: string;
  }>
): Promise<AttributeDTO> {
  const row = await db.attribute.update({
    where: { id },
    data: input,
  });
  return toDTO(row);
}

export async function deleteAttribute(id: string): Promise<void> {
  await db.attribute.delete({ where: { id } });
}

// ── Seed ───────────────────────────────────────────────────────────────────

/**
 * Seed canonical attributes. Idempotent: updates existing rows by slug,
 * creates missing ones. Does NOT delete attributes that aren't in the seed
 * (admin-created attributes are preserved).
 */
export async function seedAttributes(): Promise<{
  created: number;
  updated: number;
  total: number;
}> {
  let created = 0;
  let updated = 0;

  for (let i = 0; i < ALL_SEED_ATTRIBUTES.length; i++) {
    const a: SeedAttribute = ALL_SEED_ATTRIBUTES[i];
    const data = {
      slug: a.slug,
      name: a.name,
      group: a.group,
      icon: a.icon ?? null,
      color: a.color ?? null,
      description: a.description ?? null,
      ecosystem: a.ecosystem ?? "BOTH",
      sortOrder: i,
      active: true,
    };

    const existing = await db.attribute.findUnique({ where: { slug: a.slug } });
    if (existing) {
      await db.attribute.update({
        where: { slug: a.slug },
        data: {
          name: data.name,
          group: data.group,
          icon: data.icon,
          color: data.color,
          description: data.description,
          sortOrder: data.sortOrder,
        },
      });
      updated++;
    } else {
      await db.attribute.create({ data });
      created++;
    }
  }

  const total = await db.attribute.count();
  return { created, updated, total };
}

// ── Tag migration ──────────────────────────────────────────────────────────

/**
 * Migrate a vendor's free-text tags into the attribute system.
 * Best-effort: normalizes each tag to a slug and matches against canonical
 * attributes. Non-matching tags are left in Vendor.tags (no data loss).
 *
 * Idempotent: safe to run multiple times (unique constraint skips dupes).
 */
export async function migrateVendorTagsToAttributes(
  vendorId: string,
  tags: string[]
): Promise<{ matched: string[]; unmatched: string[] }> {
  const matched: string[] = [];
  const unmatched: string[] = [];

  const slugs = tags.map(normalizeTagToSlug);
  const attrs = await db.attribute.findMany({
    where: { slug: { in: slugs }, active: true },
    select: { id: true, slug: true },
  });

  const slugToId = new Map(attrs.map((a) => [a.slug, a.id]));

  for (let i = 0; i < tags.length; i++) {
    const originalTag = tags[i];
    const slug = slugs[i];
    const attrId = slugToId.get(slug);
    if (attrId) {
      matched.push(slug);
      // Insert (skip if exists — idempotent)
      try {
        await db.vendorAttribute.create({
          data: { vendorId, attributeId: attrId },
        });
      } catch {
        // unique constraint violation = already exists, skip
      }
    } else {
      unmatched.push(originalTag);
    }
  }

  return { matched, unmatched };
}
