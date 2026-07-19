/**
 * Event Intelligence Service — V6 AI Event Operating System
 *
 * Extends the existing ConciergeEvent model with:
 *   - AI Budget Allocation (suggests how to split budget across categories)
 *   - Event Timeline Generation (auto-creates task timeline with reminders)
 *   - Vendor Checklist (which vendors are needed for this event type)
 *   - Cross-sell Recommendations (recommends additional vendors)
 *
 * This service REUSES existing data:
 *   - ConciergeEvent model (already has assignedVendors, budget, guests, etc.)
 *   - Lead Routing engine (findBestVendors) for vendor recommendations
 *
 * No new DB tables needed — the ConciergeEvent model already supports
 * assignedVendors (JSON) and status. This service adds intelligence on top.
 */

import { db } from "@/lib/db";
import { findBestVendors } from "@/lib/leads/lead-routing";
import { logger } from "@/lib/logger";

// ── Types ─────────────────────────────────────────────────────────────────

export interface BudgetAllocation {
  category: string;
  label: string;
  icon: string;
  minimum: number;
  recommended: number;
  premium: number;
  percentage: number;
}

export interface TimelineTask {
  phase: string;
  daysBefore: number;
  label: string;
  description: string;
  category?: string;
  status: "pending" | "done";
}

export interface VendorChecklistItem {
  category: string;
  label: string;
  icon: string;
  required: boolean;
  assigned: boolean;
  vendorName?: string;
  vendorId?: string;
  matchScore?: number;
}

export interface EventIntelligence {
  budget: BudgetAllocation[];
  timeline: TimelineTask[];
  vendorChecklist: VendorChecklistItem[];
  crossSellSuggestions: { category: string; label: string; reason: string }[];
  countdown: { daysUntilEvent: number; phase: string };
}

// ── Event type configurations ─────────────────────────────────────────────

const EVENT_CONFIGS: Record<string, {
  vendors: { category: string; label: string; icon: string; required: boolean; percentage: number }[];
  crossSell: { category: string; label: string; reason: string }[];
}> = {
  birthday: {
    vendors: [
      { category: "bakers-bakery", label: "Cake", icon: "🎂", required: true, percentage: 25 },
      { category: "decorators", label: "Decoration", icon: "🎈", required: true, percentage: 20 },
      { category: "caterers", label: "Food & Catering", icon: "🍽️", required: false, percentage: 25 },
      { category: "photographers", label: "Photography", icon: "📸", required: false, percentage: 15 },
      { category: "rental-services", label: "Rentals", icon: "🪑", required: false, percentage: 10 },
      { category: "entertainers", label: "Entertainment", icon: "🎭", required: false, percentage: 5 },
    ],
    crossSell: [
      { category: "decorators", label: "Balloon Decoration", reason: "Birthday parties almost always need balloon decoration" },
      { category: "photographers", label: "Photography", reason: "Capture the special moments" },
      { category: "caterers", label: "Food & Catering", reason: "Feed your guests with professional catering" },
    ],
  },
  wedding: {
    vendors: [
      { category: "bakers-bakery", label: "Wedding Cake", icon: "🎂", required: true, percentage: 10 },
      { category: "decorators", label: "Decoration", icon: "💐", required: true, percentage: 20 },
      { category: "photographers", label: "Photography", icon: "📸", required: true, percentage: 15 },
      { category: "caterers", label: "Catering", icon: "🍽️", required: true, percentage: 30 },
      { category: "venues", label: "Venue", icon: "🏛️", required: true, percentage: 15 },
      { category: "florists", label: "Flowers", icon: "🌸", required: false, percentage: 5 },
      { category: "djs", label: "Music & DJ", icon: "🎵", required: false, percentage: 5 },
    ],
    crossSell: [
      { category: "videographers", label: "Videography", reason: "Wedding videos are treasured forever" },
      { category: "makeup-artists", label: "Bridal Makeup", reason: "Look your best on the big day" },
      { category: "florists", label: "Floral Decoration", reason: "Complete the wedding ambiance" },
    ],
  },
  "baby-shower": {
    vendors: [
      { category: "bakers-bakery", label: "Cake", icon: "🎂", required: true, percentage: 25 },
      { category: "decorators", label: "Decoration", icon: "🎈", required: true, percentage: 30 },
      { category: "photographers", label: "Photography", icon: "📸", required: false, percentage: 15 },
      { category: "caterers", label: "Food", icon: "🍽️", required: false, percentage: 20 },
      { category: "florists", label: "Flowers", icon: "🌸", required: false, percentage: 10 },
    ],
    crossSell: [
      { category: "photographers", label: "Photography", reason: "Capture the precious moments" },
      { category: "caterers", label: "Catering", reason: "Let professionals handle the food" },
    ],
  },
  corporate: {
    vendors: [
      { category: "caterers", label: "Catering", icon: "🍽️", required: true, percentage: 35 },
      { category: "venues", label: "Venue", icon: "🏛️", required: true, percentage: 25 },
      { category: "decorators", label: "Decoration", icon: "🏢", required: false, percentage: 15 },
      { category: "photographers", label: "Photography", icon: "📸", required: false, percentage: 10 },
      { category: "audio-visual-services", label: "AV & Sound", icon: "🔊", required: false, percentage: 10 },
      { category: "djs", label: "Entertainment", icon: "🎵", required: false, percentage: 5 },
    ],
    crossSell: [
      { category: "photographers", label: "Event Photography", reason: "Document your corporate event" },
      { category: "audio-visual-services", label: "AV Equipment", reason: "Professional sound and presentation setup" },
    ],
  },
};

const DEFAULT_CONFIG = EVENT_CONFIGS.birthday;

export function generateBudgetAllocation(totalBudget: number, eventType: string): BudgetAllocation[] {
  const config = EVENT_CONFIGS[eventType?.toLowerCase()] || DEFAULT_CONFIG;
  return config.vendors.map((v) => {
    const recommended = Math.round(totalBudget * (v.percentage / 100));
    return {
      category: v.category, label: v.label, icon: v.icon,
      minimum: Math.round(recommended * 0.7), recommended,
      premium: Math.round(recommended * 1.5), percentage: v.percentage,
    };
  });
}

export function generateEventTimeline(eventDate: string, eventType: string): TimelineTask[] {
  const config = EVENT_CONFIGS[eventType?.toLowerCase()] || DEFAULT_CONFIG;
  const vendorCategories = new Set(config.vendors.map((v) => v.category));

  const phases: { daysBefore: number; phase: string; label: string; description: string; category?: string }[] = [
    { daysBefore: 30, phase: "Planning", label: "Set budget & guest list", description: "Finalize your budget and create a guest list" },
    { daysBefore: 30, phase: "Planning", label: "Book venue", description: "Reserve your venue before it's taken", category: "venues" },
    { daysBefore: 25, phase: "Booking", label: "Book cake vendor", description: "Cakes need advance booking, especially custom designs", category: "bakers-bakery" },
    { daysBefore: 25, phase: "Booking", label: "Book decoration vendor", description: "Reserve your decorator with time for planning", category: "decorators" },
    { daysBefore: 20, phase: "Booking", label: "Book catering", description: "Finalize menu and catering service", category: "caterers" },
    { daysBefore: 20, phase: "Booking", label: "Book photographer", description: "Reserve your photographer for the event date", category: "photographers" },
    { daysBefore: 15, phase: "Planning", label: "Finalize theme & colors", description: "Decide on theme, colors, and style" },
    { daysBefore: 15, phase: "Planning", label: "Send invitations", description: "Send out invitations to all guests" },
    { daysBefore: 7, phase: "Confirmation", label: "Confirm all vendors", description: "Call and confirm all vendor bookings" },
    { daysBefore: 7, phase: "Planning", label: "Plan event schedule", description: "Create a detailed schedule for the event day" },
    { daysBefore: 3, phase: "Confirmation", label: "Confirm delivery times", description: "Confirm delivery/setup times with all vendors" },
    { daysBefore: 3, phase: "Preparation", label: "Buy supplies", description: "Purchase any remaining supplies (candles, plates, etc.)" },
    { daysBefore: 1, phase: "Preparation", label: "Decorate venue (if accessible)", description: "Set up decoration the night before if possible" },
    { daysBefore: 1, phase: "Preparation", label: "Charge devices", description: "Charge cameras, phones, and any AV equipment" },
    { daysBefore: 0, phase: "Event Day", label: "Event day setup", description: "Arrive early, coordinate with vendors, enjoy!" },
    { daysBefore: -1, phase: "Post-Event", label: "Send thank you notes", description: "Thank your vendors and guests" },
    { daysBefore: -3, phase: "Post-Event", label: "Leave reviews", description: "Review your vendors on FindMyBites" },
  ];

  return phases
    .filter((p) => !p.category || vendorCategories.has(p.category))
    .map((p) => ({
      phase: p.phase, daysBefore: p.daysBefore, label: p.label,
      description: p.description, category: p.category, status: "pending" as const,
    }));
}

export function generateVendorChecklist(eventType: string, assignedVendors: string = "[]"): VendorChecklistItem[] {
  const config = EVENT_CONFIGS[eventType?.toLowerCase()] || DEFAULT_CONFIG;
  let assigned: any[] = [];
  try { assigned = JSON.parse(assignedVendors); if (!Array.isArray(assigned)) assigned = []; } catch { assigned = []; }
  const assignedByCategory = new Map(assigned.map((a) => [a.category || a.role, a]));

  return config.vendors.map((v) => {
    const av = assignedByCategory.get(v.category);
    return {
      category: v.category, label: v.label, icon: v.icon, required: v.required,
      assigned: !!av, vendorName: av?.vendorName || av?.name,
      vendorId: av?.vendorId || av?.id, matchScore: av?.matchScore,
    };
  });
}

export function getCrossSellSuggestions(eventType: string) {
  return (EVENT_CONFIGS[eventType?.toLowerCase()] || DEFAULT_CONFIG).crossSell;
}

export function getEventCountdown(eventDate: string): { daysUntilEvent: number; phase: string } {
  const event = new Date(eventDate);
  const now = new Date();
  const daysUntil = Math.ceil((event.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  let phase = "Planning";
  if (daysUntil < 0) phase = "Completed";
  else if (daysUntil === 0) phase = "Event Day";
  else if (daysUntil <= 1) phase = "Final Prep";
  else if (daysUntil <= 3) phase = "Confirmation";
  else if (daysUntil <= 7) phase = "Planning";
  else if (daysUntil <= 15) phase = "Booking";
  return { daysUntilEvent: daysUntil, phase };
}

export async function getEventIntelligence(eventId: string): Promise<EventIntelligence | null> {
  try {
    const event = await db.conciergeEvent.findUnique({ where: { id: eventId } });
    if (!event) return null;
    const budgetNum = parseInt(event.budget?.replace(/[^0-9]/g, "") || "0", 10) || 0;
    return {
      budget: generateBudgetAllocation(budgetNum, event.eventType),
      timeline: generateEventTimeline(event.eventDate, event.eventType),
      vendorChecklist: generateVendorChecklist(event.eventType, event.assignedVendors),
      crossSellSuggestions: getCrossSellSuggestions(event.eventType),
      countdown: getEventCountdown(event.eventDate),
    };
  } catch (error: any) {
    logger.error("event-intelligence", "getEventIntelligence failed", error, { eventId });
    return null;
  }
}

export async function recommendVendorsForEvent(eventId: string, city: string, limitPerCategory: number = 3) {
  try {
    const event = await db.conciergeEvent.findUnique({
      where: { id: eventId },
      select: { eventType: true, eventCity: true, assignedVendors: true },
    });
    if (!event) return [];
    const checklist = generateVendorChecklist(event.eventType, event.assignedVendors);
    const results: { category: string; matches: any[] }[] = [];
    for (const item of checklist) {
      if (!item.assigned) {
        const matches = await findBestVendors({ category: item.category, city: city || event.eventCity }, limitPerCategory);
        if (matches.length > 0) results.push({ category: item.category, matches });
      }
    }
    return results;
  } catch (error: any) {
    logger.error("event-intelligence", "recommendVendorsForEvent failed", error, { eventId });
    return [];
  }
}
