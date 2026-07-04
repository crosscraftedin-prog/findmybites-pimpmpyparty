/**
 * Support Service — Vendor Support & Admin Messaging.
 * ───────────────────────────────────────────────────────────────────────────
 * WhatsApp-style support tickets between vendors and platform admins.
 * Each ticket is a conversation thread with messages, attachments, and
 * a full status workflow.
 *
 * Security: vendors can only access their own tickets (resolved via
 * resolveVendorFromSession). Admins access all tickets (requireAdmin).
 *
 * Future-ready: the polymorphic `senderType` + `attachments` JSON fields
 * support live chat, AI chatbot, email, and WhatsApp integration without
 * schema changes.
 */
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

// ── Status taxonomy ──────────────────────────────────────────────────────────
export const TICKET_STATUSES = [
  "open", "pending", "waiting_vendor", "in_progress", "resolved", "closed",
] as const;

export const TICKET_STATUS_META: Record<string, { label: string; className: string; dot: string }> = {
  open: { label: "Open", className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800", dot: "bg-blue-500" },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800", dot: "bg-amber-500" },
  waiting_vendor: { label: "Waiting for You", className: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800", dot: "bg-violet-500" },
  in_progress: { label: "In Progress", className: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800", dot: "bg-sky-500" },
  resolved: { label: "Resolved", className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800", dot: "bg-emerald-500" },
  closed: { label: "Closed", className: "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700", dot: "bg-zinc-400" },
};

export const TICKET_CATEGORIES = [
  { value: "account", label: "Account Issue" },
  { value: "business_listing", label: "Business Listing" },
  { value: "subscription", label: "Subscription" },
  { value: "payments", label: "Payments" },
  { value: "products", label: "Products" },
  { value: "photos", label: "Photos" },
  { value: "reviews", label: "Reviews" },
  { value: "claim_business", label: "Claim Business" },
  { value: "technical_bug", label: "Technical Bug" },
  { value: "feature_request", label: "Feature Request" },
  { value: "other", label: "Other" },
] as const;

export const TICKET_PRIORITIES = [
  { value: "low", label: "Low", className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  { value: "medium", label: "Medium", className: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
  { value: "high", label: "High", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  { value: "urgent", label: "Urgent", className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" },
] as const;

// ── Types ────────────────────────────────────────────────────────────────────
export interface TicketSummary {
  id: string; ticketNumber: string; subject: string; category: string;
  priority: string; status: string; vendorId: string; vendorName: string;
  vendorUnreadCount: number; adminUnreadCount: number;
  assignedTo: string | null; assignedToEmail: string | null;
  lastVendorMessageAt: string | null; lastAdminMessageAt: string | null;
  createdAt: string; updatedAt: string; resolvedAt: string | null;
}

export interface Attachment {
  type: "image" | "pdf" | "document"; url: string; name: string; size: number;
}

export interface SupportMessageDetail {
  id: string; senderType: string; senderId: string | null;
  senderName: string; senderAvatar: string | null;
  body: string; attachments: Attachment[]; createdAt: string;
}

export interface TicketDetail extends TicketSummary {
  businessName: string | null; vendorEmail: string | null; vendorPhone: string | null;
  browserInfo: string | null; dashboardUrl: string | null;
  internalNotes: string | null; messages: SupportMessageDetail[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseAttachments(raw: string | null): Attachment[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as Attachment[]; } catch { return []; }
}

function toSummary(t: any): TicketSummary {
  return {
    id: t.id, ticketNumber: t.ticketNumber, subject: t.subject,
    category: t.category, priority: t.priority, status: t.status,
    vendorId: t.vendorId, vendorName: t.vendor?.name ?? "Unknown",
    vendorUnreadCount: t.vendorUnreadCount ?? 0, adminUnreadCount: t.adminUnreadCount ?? 0,
    assignedTo: t.assignedTo ?? null, assignedToEmail: t.assignedToEmail ?? null,
    lastVendorMessageAt: t.lastVendorMessageAt instanceof Date ? t.lastVendorMessageAt.toISOString() : (t.lastVendorMessageAt ?? null),
    lastAdminMessageAt: t.lastAdminMessageAt instanceof Date ? t.lastAdminMessageAt.toISOString() : (t.lastAdminMessageAt ?? null),
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
    updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : String(t.updatedAt),
    resolvedAt: t.resolvedAt instanceof Date ? t.resolvedAt.toISOString() : (t.resolvedAt ?? null),
  };
}

function toDetail(t: any): TicketDetail {
  return {
    ...toSummary(t),
    businessName: t.businessName ?? null,
    vendorEmail: t.vendorEmail ?? null,
    vendorPhone: t.vendorPhone ?? null,
    browserInfo: t.browserInfo ?? null,
    dashboardUrl: t.dashboardUrl ?? null,
    internalNotes: t.internalNotes ?? null,
    messages: (t.messages ?? []).map((m: any) => ({
      id: m.id, senderType: m.senderType, senderId: m.senderId ?? null,
      senderName: m.senderName, senderAvatar: m.senderAvatar ?? null,
      body: m.body, attachments: parseAttachments(m.attachments),
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
    })),
  };
}

function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const random = randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
  return `SUP-${year}-${random}`;
}

// ── Vendor operations ────────────────────────────────────────────────────────

export interface CreateTicketInput {
  vendorId: string; vendorName: string; vendorEmail: string; vendorPhone: string;
  subject: string; category: string; priority: string; description: string;
  attachments?: Attachment[]; browserInfo?: string; dashboardUrl?: string;
}

export async function createTicket(input: CreateTicketInput): Promise<TicketDetail> {
  let ticketNumber = generateTicketNumber();
  for (let i = 0; i < 3; i++) {
    const existing = await db.supportTicket.findUnique({ where: { ticketNumber }, select: { id: true } }).catch(() => null);
    if (!existing) break;
    ticketNumber = generateTicketNumber();
  }

  const ticket = await db.supportTicket.create({
    data: {
      ticketNumber, vendorId: input.vendorId,
      subject: input.subject.trim(), category: input.category,
      priority: input.priority || "medium", status: "open",
      businessName: input.vendorName, vendorEmail: input.vendorEmail,
      vendorPhone: input.vendorPhone,
      browserInfo: input.browserInfo || null, dashboardUrl: input.dashboardUrl || null,
      lastVendorMessageAt: new Date(),
      messages: {
        create: {
          senderType: "vendor", senderId: input.vendorId, senderName: input.vendorName,
          body: input.description.trim(),
          attachments: input.attachments?.length ? JSON.stringify(input.attachments) : null,
        },
      },
    },
    include: { vendor: { select: { name: true } }, messages: { orderBy: { createdAt: "asc" } } },
  });

  // Notify all admins
  try {
    await db.notification.create({
      data: {
        recipientType: "admin", recipientId: "admin",
        type: "new_support_ticket", title: `New support ticket: ${input.subject}`,
        message: `${input.vendorName} (${input.vendorEmail}) — ${input.category}`,
        actionUrl: "/admin", vendorId: input.vendorId,
      },
    });
  } catch {}

  return toDetail(ticket);
}

export interface TicketSearchFilters {
  vendorId?: string; status?: string; category?: string; priority?: string;
  search?: string; limit?: number; offset?: number;
}

export async function searchTickets(filters: TicketSearchFilters): Promise<{ tickets: TicketSummary[]; total: number }> {
  const where: any = {};
  if (filters.vendorId) where.vendorId = filters.vendorId;
  if (filters.status && filters.status !== "all") where.status = filters.status;
  if (filters.category && filters.category !== "all") where.category = filters.category;
  if (filters.priority && filters.priority !== "all") where.priority = filters.priority;
  if (filters.search) {
    where.OR = [
      { subject: { contains: filters.search } },
      { ticketNumber: { contains: filters.search } },
    ];
  }

  const [rows, total] = await Promise.all([
    db.supportTicket.findMany({
      where, include: { vendor: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: Math.min(filters.limit ?? 50, 100), skip: filters.offset ?? 0,
    }),
    db.supportTicket.count({ where }),
  ]);

  return { tickets: rows.map(toSummary), total };
}

export async function getTicket(ticketId: string, vendorId?: string): Promise<TicketDetail | null> {
  const where: any = { id: ticketId };
  if (vendorId) where.vendorId = vendorId;
  const ticket = await db.supportTicket.findFirst({
    where,
    include: { vendor: { select: { name: true } }, messages: { orderBy: { createdAt: "asc" } } },
  });
  return ticket ? toDetail(ticket) : null;
}

export async function sendMessage(
  ticketId: string,
  senderType: "vendor" | "admin" | "system",
  senderId: string | null,
  senderName: string,
  senderAvatar: string | null,
  body: string,
  attachments?: Attachment[]
): Promise<SupportMessageDetail> {
  const msg = await db.supportMessage.create({
    data: {
      ticketId, senderType, senderId, senderName, senderAvatar,
      body: body.trim(),
      attachments: attachments?.length ? JSON.stringify(attachments) : null,
    },
  });

  const now = new Date();
  if (senderType === "vendor") {
    await db.supportTicket.update({
      where: { id: ticketId },
      data: {
        lastVendorMessageAt: now, vendorUnreadCount: 0,
        adminUnreadCount: { increment: 1 }, status: "in_progress", updatedAt: now,
      },
    });
    try {
      const ticket = await db.supportTicket.findUnique({ where: { id: ticketId }, select: { subject: true, vendorId: true } });
      if (ticket) {
        await db.notification.create({
          data: {
            recipientType: "admin", recipientId: "admin", type: "support_message",
            title: `Support reply: ${ticket.subject}`, message: `${senderName} replied to ticket`,
            actionUrl: "/admin", vendorId: ticket.vendorId,
          },
        });
      }
    } catch {}
  } else if (senderType === "admin") {
    const current = await db.supportTicket.findUnique({ where: { id: ticketId }, select: { status: true } });
    const newStatus = current && ["open", "pending"].includes(current.status) ? "waiting_vendor" : undefined;
    await db.supportTicket.update({
      where: { id: ticketId },
      data: {
        lastAdminMessageAt: now, adminUnreadCount: 0,
        vendorUnreadCount: { increment: 1 },
        ...(newStatus ? { status: newStatus } : {}),
        updatedAt: now,
      },
    });
    try {
      const ticket = await db.supportTicket.findUnique({ where: { id: ticketId }, select: { subject: true, vendorId: true } });
      if (ticket) {
        await db.notification.create({
          data: {
            recipientType: "vendor", recipientId: ticket.vendorId, type: "support_reply",
            title: `Admin replied: ${ticket.subject}`, message: `${senderName}: ${body.slice(0, 100)}`,
            actionUrl: "/dashboard", vendorId: ticket.vendorId,
          },
        });
      }
    } catch {}
  }

  return {
    id: msg.id, senderType: msg.senderType, senderId: msg.senderId,
    senderName: msg.senderName, senderAvatar: msg.senderAvatar,
    body: msg.body, attachments: parseAttachments(msg.attachments),
    createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : String(msg.createdAt),
  };
}

export async function markVendorRead(ticketId: string, vendorId: string): Promise<void> {
  await db.supportTicket.updateMany({ where: { id: ticketId, vendorId }, data: { vendorUnreadCount: 0 } });
}

export async function markAdminRead(ticketId: string): Promise<void> {
  await db.supportTicket.update({ where: { id: ticketId }, data: { adminUnreadCount: 0 } }).catch(() => {});
}

export async function getVendorTicketStats(vendorId: string): Promise<{ total: number; open: number; unread: number }> {
  const [total, open, unreadAgg] = await Promise.all([
    db.supportTicket.count({ where: { vendorId } }),
    db.supportTicket.count({ where: { vendorId, status: { in: ["open", "pending", "waiting_vendor", "in_progress"] } } }),
    db.supportTicket.aggregate({ where: { vendorId, vendorUnreadCount: { gt: 0 } }, _sum: { vendorUnreadCount: true } }),
  ]);
  return { total, open, unread: unreadAgg._sum.vendorUnreadCount ?? 0 };
}

// ── Admin operations ─────────────────────────────────────────────────────────

export async function adminUpdateTicket(
  ticketId: string,
  updates: { status?: string; priority?: string; assignedTo?: string | null; assignedToEmail?: string | null }
): Promise<TicketDetail | null> {
  const data: any = {};
  if (updates.status) {
    data.status = updates.status;
    if (updates.status === "resolved") data.resolvedAt = new Date();
    if (updates.status === "closed") data.closedAt = new Date();
  }
  if (updates.priority) data.priority = updates.priority;
  if (updates.assignedTo !== undefined) data.assignedTo = updates.assignedTo;
  if (updates.assignedToEmail !== undefined) data.assignedToEmail = updates.assignedToEmail;

  const ticket = await db.supportTicket.update({
    where: { id: ticketId }, data,
    include: { vendor: { select: { name: true } }, messages: { orderBy: { createdAt: "asc" } } },
  });

  if (updates.status) {
    await db.supportMessage.create({
      data: { ticketId, senderType: "system", senderName: "System",
        body: `Status changed to ${TICKET_STATUS_META[updates.status]?.label || updates.status}` },
    }).catch(() => {});
  }

  return toDetail(ticket);
}

export async function addInternalNote(ticketId: string, note: string, adminEmail: string): Promise<void> {
  const ticket = await db.supportTicket.findUnique({ where: { id: ticketId }, select: { internalNotes: true } });
  const notes: { note: string; adminEmail: string; timestamp: string }[] = ticket?.internalNotes ? JSON.parse(ticket.internalNotes) : [];
  notes.push({ note, adminEmail, timestamp: new Date().toISOString() });
  await db.supportTicket.update({ where: { id: ticketId }, data: { internalNotes: JSON.stringify(notes) } });
}

export async function mergeTickets(sourceId: string, targetId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.supportMessage.updateMany({ where: { ticketId: sourceId }, data: { ticketId: targetId } });
    await tx.supportTicket.update({ where: { id: sourceId }, data: { status: "closed", mergedIntoId: targetId, closedAt: new Date() } });
    await tx.supportMessage.create({ data: { ticketId: targetId, senderType: "system", senderName: "System", body: "A related ticket was merged into this conversation." } });
  });
}

export async function deleteTicket(ticketId: string): Promise<void> {
  await db.supportTicket.delete({ where: { id: ticketId } });
}

export async function getAdminStats(): Promise<{ total: number; open: number; urgent: number; unassigned: number; adminUnread: number }> {
  const [total, open, urgent, unassigned, unreadAgg] = await Promise.all([
    db.supportTicket.count(),
    db.supportTicket.count({ where: { status: { in: ["open", "pending", "waiting_vendor", "in_progress"] } } }),
    db.supportTicket.count({ where: { priority: "urgent", status: { in: ["open", "pending", "waiting_vendor", "in_progress"] } } }),
    db.supportTicket.count({ where: { assignedTo: null, status: { in: ["open", "pending", "waiting_vendor", "in_progress"] } } }),
    db.supportTicket.aggregate({ where: { adminUnreadCount: { gt: 0 } }, _sum: { adminUnreadCount: true } }),
  ]);
  return { total, open, urgent, unassigned, adminUnread: unreadAgg._sum.adminUnreadCount ?? 0 };
}

// ── FAQ ──────────────────────────────────────────────────────────────────────
export const FAQS: { category: string; question: string; answer: string }[] = [
  { category: "verification", question: "How do I verify my business?", answer: "Go to My Listing → complete your profile (business name, address, photos, tagline, description). Once your profile is at least 80% complete, click 'Submit for Verification'. Our team reviews listings within 48 hours. Verified businesses get a blue badge and appear higher in search results." },
  { category: "products", question: "How do I upload products?", answer: "Navigate to My Products → click 'Add Product'. Fill in the name, price, description, and upload high-quality photos. You can set inventory, availability, preparation time, and booking notice. Products appear on your public profile immediately after publishing." },
  { category: "subscription", question: "What's included in the Pro plan?", answer: "The Pro plan includes up to 25 products, AI Growth Advisor, SEO Center, Social Media Generator, Email Campaigns, QR Codes, and the Review Booster. It costs ₹999/month or ₹9,999/year (save 17%). Upgrade from Plan & Billing in your dashboard." },
  { category: "payments", question: "How do payments work?", answer: "Customers pay you directly — FindMyBites × PimpMyParty takes no commission on your first 5 bookings. You can accept payments via UPI, bank transfer, or any method you prefer. The platform subscription (Pro/Business) is paid via Razorpay." },
  { category: "reviews", question: "How do I get more reviews?", answer: "Use the Review Booster in the Marketing Center. Generate review request links, send them via WhatsApp or email to happy customers, and share QR codes at events. More verified reviews improve your ranking and conversion rate." },
  { category: "claim", question: "How do I claim my business?", answer: "If your business was imported from public directories, you'll see a 'Claim This Listing' banner. Click it, verify your identity (email + phone), and we'll transfer ownership to your account. If you can't find the claim banner, contact support." },
  { category: "seo", question: "How do I improve my SEO?", answer: "Open the Marketing Center → SEO Center. Use 'Generate with AI' to create an optimized meta title, description, and keywords. Ensure your profile is 100% complete, add at least 5 products with descriptions, and collect reviews." },
  { category: "analytics", question: "How do I track my performance?", answer: "The Marketing Center → Performance tab shows your profile views, product views, enquiries, bookings, revenue, and conversion rate over time. Compare against similar vendors in the Competitors tab." },
];
