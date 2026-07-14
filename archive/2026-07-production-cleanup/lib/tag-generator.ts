/**
 * Archived on 2026-07-14
 * Reason:
 * No verified runtime references found.
 * Preserved for future features.
 *
 * DO NOT IMPORT FROM THIS DIRECTORY.
 */

/**
 * Auto-generate tags from category + subcategory + description.
 */

const CATEGORY_TAGS: Record<string, string[]> = {
  "bakers-bakery": ["cake", "bakery", "custom", "fresh", "dessert"],
  caterers: ["catering", "events", "food", "bulk", "buffet"],
  "chef-staff": ["chef", "private", "fine dining", "professional", "gourmet"],
  "food-trucks": ["food truck", "street food", "mobile", "fresh", "casual"],
  "beverage-specialists": ["coffee", "drinks", "bar", "beverages", "refreshing"],
  "specialty-food": ["specialty", "organic", "healthy", "dietary", "artisan"],
  "event-planners": ["planner", "events", "coordination", "professional", "seamless"],
  decorators: ["decor", "balloons", "floral", "styling", "design"],
  photographers: ["photographer", "photography", "memories", "professional", "candid"],
  videographers: ["videographer", "video", "cinematic", "films", "memories"],
  djs: ["dj", "music", "party", "entertainment", "sound"],
  entertainers: ["entertainment", "performer", "kids", "fun", "magic"],
  venues: ["venue", "space", "location", "hall", "events"],
  florists: ["florist", "flowers", "bouquet", "floral", "wedding"],
  "rental-services": ["rental", "equipment", "furniture", "tents", "setup"],
  "makeup-artists": ["makeup", "beauty", "bridal", "glam", "professional"],
  "beauty-services": ["beauty", "hair", "spa", "mehndi", "grooming"],
  transportation: ["transport", "luxury", "limo", "party bus", "shuttle"],
  "invitation-printing": ["invitations", "cards", "printing", "design", "stationery"],
  "kids-party-services": ["kids", "party", "bounce", "mascot", "fun"],
  "audio-visual-services": ["av", "sound", "lighting", "production", "led"],
};

const STOP_WORDS = new Set([
  "about", "above", "after", "again", "below", "been", "between", "both",
  "during", "each", "from", "have", "into", "more", "other", "some",
  "their", "there", "these", "they", "this", "very", "were", "where",
  "which", "with", "your", "will", "would", "could", "should", "doing",
  "being", "having", "looking", "providing", "offering", "specializing",
]);

export function generateAutoTags(
  category: string,
  subcategory: string | null | undefined,
  description: string
): string[] {
  const tags: string[] = [];
  const catTags = CATEGORY_TAGS[category] ?? [];
  tags.push(...catTags);

  if (subcategory && subcategory.trim() && subcategory !== "Other" && subcategory !== "Custom Vendor Entry") {
    tags.push(subcategory.toLowerCase().trim());
  }

  const keywords = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4 && !STOP_WORDS.has(w));

  tags.push(...keywords.slice(0, 5));
  return [...new Set(tags)].slice(0, 10);
}
