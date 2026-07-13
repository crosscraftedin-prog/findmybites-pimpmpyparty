/**
 * Admin-Created Business Listings service.
 * ─────────────────────────────────────────────────────────────────────────
 * Allows admins to create complete public business listings that can later
 * be claimed by the real business owner. Admin-created listings are
 * indistinguishable from vendor-created ones on the public site.
 *
 * Key features:
 *   - Create listing with full business data
 *   - Generate claim links (unique, expiring tokens)
 *   - Track invite status (pending → opened → claimed → expired)
 *   - Duplicate detection (phone/email/name) to prevent double-listing
 *   - Claim audit trail (vendor_claims table)
 *   - Public visibility controlled by listingStatus (not ownership_status)
 */
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

// ── Types ──────────────────────────────────────────────────────────────────

export type ListingStatus = "draft" | "published" | "claimed" | "hidden" | "rejected";
export type BusinessSource = "manual" | "google" | "website" | "customer";
export type InviteStatus = "pending" | "opened" | "claimed" | "expired";

export interface AdminCreateVendorInput {
  name: string;
  category: string;
  subcategory?: string;
  tagline?: string;
  description?: string;
  city: string;
  state?: string;
  country: string;
  countryCode: string;
  continent?: string;
  currency?: string;
  priceRange?: string;
  basePrice?: number;
  ecosystem: string;
  phone?: string;
  whatsapp?: string;
  userEmail?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  address?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  serviceRadiusKm?: number;
  deliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  openHours?: string;
  heroImage?: string;
  avatarImage?: string;
  gallery?: string[];
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  featured?: boolean;
  verified?: boolean;
  businessSource?: BusinessSource;
  listingStatus?: ListingStatus;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function generateClaimToken(): string {
  return randomBytes(32).toString("hex");
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateUniqueSlug(name: string): string {
  const base = slugify(name) || "business";
  return `${base}-${Date.now().toString(36)}`;
}

// ── Duplicate Detection ────────────────────────────────────────────────────

export interface DuplicateMatch {
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
  matchField: "phone" | "email" | "name";
  matchValue: string;
}

/**
 * Check if a business already exists with the same phone, email, or name.
 * Used during both admin creation and vendor self-registration to prevent
 * duplicate listings.
 */
export async function findDuplicateListings(opts: {
  phone?: string;
  email?: string;
  name?: string;
  excludeVendorId?: string;
}): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = [];
  const where: any[] = [];

  if (opts.phone && opts.phone.trim().length >= 7) {
    where.push({ phone: { contains: opts.phone.trim(), mode: "insensitive" } });
  }
  if (opts.email && opts.email.trim()) {
    where.push({ userEmail: { equals: opts.email.trim(), mode: "insensitive" } });
  }
  if (opts.name && opts.name.trim().length >= 3) {
    where.push({ name: { equals: opts.name.trim(), mode: "insensitive" } });
  }

  if (where.length === 0) return [];

  const vendors = await db.vendor.findMany({
    where: {
      OR: where,
      ...(opts.excludeVendorId ? { id: { not: opts.excludeVendorId } } : {}),
    },
    select: { id: true, name: true, slug: true, phone: true, userEmail: true },
    take: 10,
  });

  for (const v of vendors) {
    if (opts.phone && v.phone?.toLowerCase().includes(opts.phone.trim().toLowerCase())) {
      matches.push({ vendorId: v.id, vendorName: v.name, vendorSlug: v.slug, matchField: "phone", matchValue: opts.phone });
    } else if (opts.email && v.userEmail?.toLowerCase() === opts.email.trim().toLowerCase()) {
      matches.push({ vendorId: v.id, vendorName: v.name, vendorSlug: v.slug, matchField: "email", matchValue: opts.email });
    } else if (opts.name && v.name.toLowerCase() === opts.name.trim().toLowerCase()) {
      matches.push({ vendorId: v.id, vendorName: v.name, vendorSlug: v.slug, matchField: "name", matchValue: opts.name });
    }
  }

  return matches;
}

// ── Create ─────────────────────────────────────────────────────────────────

export async function adminCreateVendor(
  input: AdminCreateVendorInput,
  adminId: string,
  adminEmail: string
): Promise<{ id: string; slug: string; claimToken: string }> {
  const slug = generateUniqueSlug(input.name);
  const claimToken = generateClaimToken();
  const claimTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Atomic transaction — vendor + audit trail + admin log, or nothing
  const result = await db.$transaction(async (tx) => {
    const vendor = await tx.vendor.create({
      data: {
        name: input.name,
        slug,
        ecosystem: input.ecosystem,
        category: input.category,
        subcategory: input.subcategory || null,
        tagline: input.tagline || input.name,
        description: input.description || "",
        city: input.city,
        state: input.state || null,
        country: input.country,
        countryCode: input.countryCode,
        continent: input.continent || "",
        currency: input.currency || "USD",
        priceRange: input.priceRange || "$$",
        basePrice: input.basePrice || 0,
        rating: 0,
        reviewCount: 0,
        heroImage: input.heroImage || "",
        avatarImage: input.avatarImage || "",
        gallery: JSON.stringify(input.gallery || []),
        tags: JSON.stringify(input.tags || []),
        featured: input.featured || false,
        verified: input.verified ?? true,
        approved: true,
        responseTime: "24 hours",
        yearsActive: 1,
        completedBookings: 0,
        phone: input.phone || null,
        whatsapp: input.whatsapp || null,
        userEmail: input.userEmail || null,
        website: input.website || null,
        instagram: input.instagram || null,
        facebook: input.facebook || null,
        address: input.address || null,
        zipCode: input.zipCode || null,
        latitude: input.latitude || null,
        longitude: input.longitude || null,
        serviceRadiusKm: input.serviceRadiusKm || null,
        deliveryAvailable: input.deliveryAvailable || false,
        pickupAvailable: input.pickupAvailable || false,
        openHours: input.openHours || null,
        metaTitle: input.metaTitle || null,
        metaDescription: input.metaDescription || null,
        listingStatus: input.listingStatus || "published",
        businessSource: input.businessSource || "manual",
        adminCreated: true,
        ownership_status: "unclaimed",
        invite_type: "admin",
        claimToken,
        claimTokenExpiresAt,
      },
      select: { id: true, slug: true },
    });

    // Audit trail (inside transaction — rollback if this fails)
    await tx.vendorClaim.create({
      data: {
        vendorId: vendor.id,
        eventType: "admin_created",
        initiatedBy: "admin",
        adminId,
        adminEmail,
        tokenSnippet: claimToken.slice(-8),
        notes: `Admin created listing: ${input.name}`,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        action: "vendor_admin_create",
        adminId,
        adminEmail,
        targetId: vendor.id,
        targetName: input.name,
        metadata: JSON.stringify({ slug: vendor.slug, source: input.businessSource || "manual" }),
      },
    });

    return vendor;
  });

  return { id: result.id, slug: result.slug, claimToken };
}

// ── Claim Link ─────────────────────────────────────────────────────────────

export async function generateClaimLink(vendorId: string): Promise<string> {
  const token = generateClaimToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.vendor.update({
    where: { id: vendorId },
    data: {
      claimToken: token,
      claimTokenExpiresAt: expiresAt,
      inviteStatus: "pending",
      inviteSentAt: new Date(),
    },
  });

  return token;
}

export async function validateClaimToken(token: string): Promise<{
  valid: boolean;
  vendorId?: string;
  vendorName?: string;
  reason?: string;
}> {
  if (!token || token.length < 32) {
    return { valid: false, reason: "Invalid token format" };
  }

  const vendor = await db.vendor.findFirst({
    where: { claimToken: token },
    select: { id: true, name: true, claimTokenExpiresAt: true, ownership_status: true },
  });

  if (!vendor) {
    return { valid: false, reason: "Claim link not found" };
  }

  if (vendor.ownership_status === "claimed") {
    return { valid: false, reason: "This business has already been claimed" };
  }

  if (vendor.claimTokenExpiresAt && vendor.claimTokenExpiresAt < new Date()) {
    return { valid: false, reason: "This claim link has expired" };
  }

  return { valid: true, vendorId: vendor.id, vendorName: vendor.name };
}

/**
 * Mark that a claim link was opened (for tracking).
 */
export async function markClaimLinkOpened(token: string): Promise<void> {
  const vendor = await db.vendor.findFirst({
    where: { claimToken: token },
    select: { id: true },
  });
  if (!vendor) return;

  await db.vendor.update({
    where: { id: vendor.id },
    data: { inviteStatus: "opened", inviteOpenedAt: new Date() },
  });

  await db.vendorClaim.create({
    data: {
      vendorId: vendor.id,
      eventType: "invite_opened",
      initiatedBy: "vendor",
      tokenSnippet: token.slice(-8),
    },
  });
}

/**
 * Start a claim — the vendor has clicked "Claim this listing" and signed in.
 * Sets ownership_status to 'pending' for admin approval.
 */
export async function startClaim(
  vendorId: string,
  userId: string,
  userEmail: string,
  userName: string
): Promise<void> {
  await db.vendor.update({
    where: { id: vendorId },
    data: {
      ownership_status: "pending",
      inviteStatus: "claimed",
    },
  });

  await db.vendorClaim.create({
    data: {
      vendorId,
      eventType: "claim_started",
      initiatedBy: "vendor",
      claimantEmail: userEmail,
      claimantUserId: userId,
      claimantName: userName,
    },
  });
}

/**
 * Admin approves a claim — transfers ownership to the vendor.
 */
export async function approveClaim(
  vendorId: string,
  adminId: string,
  adminEmail: string
): Promise<void> {
  // Get the most recent claim_started event to find the claimant
  const claimEvent = await db.vendorClaim.findFirst({
    where: { vendorId, eventType: "claim_started" },
    orderBy: { createdAt: "desc" },
  });

  await db.vendor.update({
    where: { id: vendorId },
    data: {
      ownership_status: "claimed",
      listingStatus: "claimed",
      claimedAt: new Date(),
      claimedByUserId: claimEvent?.claimantUserId || null,
      owner_user_id: claimEvent?.claimantUserId || null,
      userEmail: claimEvent?.claimantEmail || null,
    },
  });

  await db.vendorClaim.create({
    data: {
      vendorId,
      eventType: "claim_approved",
      initiatedBy: "admin",
      adminId,
      adminEmail,
      claimantUserId: claimEvent?.claimantUserId,
      claimantEmail: claimEvent?.claimantEmail,
      claimantName: claimEvent?.claimantName,
      notes: "Claim approved by admin",
    },
  });

  await db.adminAuditLog.create({
    data: {
      action: "vendor_claim_approved",
      adminId,
      adminEmail,
      targetId: vendorId,
      metadata: JSON.stringify({ claimantUserId: claimEvent?.claimantUserId }),
    },
  });
}

/**
 * Admin rejects a claim — resets ownership_status to unclaimed.
 */
export async function rejectClaim(
  vendorId: string,
  adminId: string,
  adminEmail: string,
  reason?: string
): Promise<void> {
  await db.vendor.update({
    where: { id: vendorId },
    data: {
      ownership_status: "unclaimed",
      inviteStatus: "pending",
    },
  });

  await db.vendorClaim.create({
    data: {
      vendorId,
      eventType: "claim_rejected",
      initiatedBy: "admin",
      adminId,
      adminEmail,
      notes: reason || "Claim rejected by admin",
    },
  });

  await db.adminAuditLog.create({
    data: {
      action: "vendor_claim_rejected",
      adminId,
      adminEmail,
      targetId: vendorId,
      reason,
    },
  });
}

// ── Read: get claim history ────────────────────────────────────────────────

export async function getClaimHistory(vendorId: string) {
  return db.vendorClaim.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// ── Bulk operations ────────────────────────────────────────────────────────

export async function bulkUpdateListingStatus(
  vendorIds: string[],
  status: ListingStatus,
  adminId: string,
  adminEmail: string
): Promise<{ updated: number }> {
  const result = await db.vendor.updateMany({
    where: { id: { in: vendorIds } },
    data: { listingStatus: status },
  });

  await db.adminAuditLog.create({
    data: {
      action: "vendor_bulk_status_update",
      adminId,
      adminEmail,
      targetId: vendorIds.join(","),
      metadata: JSON.stringify({ status, count: result.count }),
    },
  });

  return { updated: result.count };
}

export async function bulkInviteVendors(
  vendorIds: string[],
  adminId: string,
  adminEmail: string
): Promise<{ invited: number; tokens: { vendorId: string; vendorName: string; token: string }[] }> {
  const vendors = await db.vendor.findMany({
    where: { id: { in: vendorIds }, ownership_status: "unclaimed" },
    select: { id: true, name: true },
  });

  const tokens: { vendorId: string; vendorName: string; token: string }[] = [];

  for (const v of vendors) {
    const token = await generateClaimLink(v.id);
    tokens.push({ vendorId: v.id, vendorName: v.name, token });

    await db.vendorClaim.create({
      data: {
        vendorId: v.id,
        eventType: "invite_sent",
        initiatedBy: "admin",
        adminId,
        adminEmail,
        tokenSnippet: token.slice(-8),
      },
    });
  }

  await db.adminAuditLog.create({
    data: {
      action: "vendor_bulk_invite",
      adminId,
      adminEmail,
      targetId: vendorIds.join(","),
      metadata: JSON.stringify({ count: tokens.length }),
    },
  });

  return { invited: tokens.length, tokens };
}
