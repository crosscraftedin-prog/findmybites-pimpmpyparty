/**
 * Scalable vendor search.
 *
 * Today (SQLite): uses FTS5 — SQLite's native full-text search engine.
 *   - Inverted index, ~100x faster than `LIKE '%q%'` at tens of thousands of rows.
 *   - porter + unicode61 tokenizer with diacritic removal (so "café" matches "cafe").
 *   - Prefix matching per token (user types "sour" → matches "sourdough").
 *   - Relevance ranking via FTS5's built-in bm25 `rank`.
 *
 * Tomorrow (Supabase/Neon Postgres): swap `searchVendors()` to use
 *   `tsvector` (to_tsvector + to_tsquery with GIN index) for full-text AND
 *   `pg_trgm` (similarity() / %> operator with GIN trigram index) for fuzzy
 *   typo-tolerant matching on city/country. The Postgres branch is sketched
 *   at the bottom of this file. The API route only depends on `searchVendors()`,
 *   so the migration is a single-file change.
 *
 * The FTS index is kept in sync with the `Vendor` table via SQL triggers
 * (see SCHEMA_STATEMENTS), so inserts/updates/deletes propagate automatically.
 */
import { db } from "@/lib/db";

const FTS_TABLE = "vendor_fts";

/**
 * One statement per array entry (trigger bodies contain `;` so we cannot
 * naively split a multi-statement blob). Each is idempotent (IF NOT EXISTS).
 */
const SCHEMA_STATEMENTS: string[] = [
  `CREATE VIRTUAL TABLE IF NOT EXISTS ${FTS_TABLE} USING fts5(
     vendorId UNINDEXED,
     ecosystem UNINDEXED,
     name,
     tagline,
     description,
     city,
     country,
     tags,
     tokenize = 'porter unicode61 remove_diacritics 2'
   )`,
  `CREATE TRIGGER IF NOT EXISTS vendor_ai_fts AFTER INSERT ON Vendor BEGIN
     INSERT INTO ${FTS_TABLE}(vendorId, ecosystem, name, tagline, description, city, country, tags)
     VALUES (NEW.id, NEW.ecosystem, NEW.name, NEW.tagline, NEW.description, NEW.city, NEW.country, NEW.tags);
   END`,
  `CREATE TRIGGER IF NOT EXISTS vendor_ad_fts AFTER DELETE ON Vendor BEGIN
     DELETE FROM ${FTS_TABLE} WHERE vendorId = OLD.id;
   END`,
  `CREATE TRIGGER IF NOT EXISTS vendor_au_fts AFTER UPDATE ON Vendor BEGIN
     DELETE FROM ${FTS_TABLE} WHERE vendorId = OLD.id;
     INSERT INTO ${FTS_TABLE}(vendorId, ecosystem, name, tagline, description, city, country, tags)
     VALUES (NEW.id, NEW.ecosystem, NEW.name, NEW.tagline, NEW.description, NEW.city, NEW.country, NEW.tags);
   END`,
];

let schemaReady: Promise<void> | null = null;

/**
 * Idempotently create the FTS5 table + sync triggers. Cached so repeated
 * calls in the same process are free.
 */
export function ensureSearchSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      for (const stmt of SCHEMA_STATEMENTS) {
        await db.$executeRawUnsafe(stmt);
      }
    })();
  }
  return schemaReady;
}

/**
 * Drop and repopulate the FTS index from the current Vendor rows.
 * Run after bulk seeds/imports. Normal writes are handled by triggers.
 */
export async function rebuildSearchIndex(): Promise<void> {
  await ensureSearchSchema();
  await db.$executeRawUnsafe(`DELETE FROM ${FTS_TABLE}`);
  await db.$executeRawUnsafe(
    `INSERT INTO ${FTS_TABLE}(vendorId, ecosystem, name, tagline, description, city, country, tags)
     SELECT id, ecosystem, name, tagline, description, city, country, tags FROM Vendor`
  );
}

/**
 * Convert a raw user query into a safe FTS5 MATCH expression.
 *
 * - Strips everything except letters/numbers/spaces (FTS5 query syntax like
 *   `"`, `*`, `:` NEAR etc. would otherwise throw or behave unexpectedly).
 * - Lowercases + splits on whitespace.
 * - Drops 1-char tokens (too noisy).
 * - Appends `*` to each token → prefix matching ("paris" matches "Parisian").
 * - Tokens are implicitly AND-ed by FTS5, which matches user intent for search.
 *
 * Examples:
 *   "sourdough paris"      -> "sourdough* paris*"
 *   "DJ (Amsterdam)"       -> "dj amsterdam*"
 *   "café"                  -> "cafe*"
 *   ""                      -> ""  (caller treats as "no search")
 */
export function sanitizeFtsQuery(input: string): string {
  const tokens = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return "";
  return tokens.map((t) => `${t}*`).join(" ");
}

export interface SearchHit {
  vendorId: string;
  rank: number; // FTS5 bm25 rank — lower is more relevant
}

/**
 * Run a full-text search and return ranked vendor IDs.
 *
 * @param query   Raw user search string.
 * @param ecosystem  Optional ecosystem filter pushed into the FTS query for speed.
 * @param limit   Cap on candidate IDs returned (default 200). The API route
 *                applies structured filters + final sort/limit on top.
 *
 * Returns [] if the query is empty or matches nothing. The caller should
 * treat an empty result as "no vendors match the search".
 */
export async function searchVendors(
  query: string,
  ecosystem?: string,
  limit = 200
): Promise<SearchHit[]> {
  const ftsQuery = sanitizeFtsQuery(query);
  if (!ftsQuery) return [];

  await ensureSearchSchema();

  try {
    const sql = ecosystem
      ? `SELECT vendorId, rank FROM ${FTS_TABLE}
         WHERE ${FTS_TABLE} MATCH ? AND ecosystem = ?
         ORDER BY rank LIMIT ?`
      : `SELECT vendorId, rank FROM ${FTS_TABLE}
         WHERE ${FTS_TABLE} MATCH ?
         ORDER BY rank LIMIT ?`;

    const rows = ecosystem
      ? await db.$queryRawUnsafe<{ vendorId: string; rank: number }[]>(
          sql,
          ftsQuery,
          ecosystem,
          limit
        )
      : await db.$queryRawUnsafe<{ vendorId: string; rank: number }[]>(
          sql,
          ftsQuery,
          limit
        );

    return rows.map((r) => ({
      vendorId: r.vendorId,
      rank: Number(r.rank),
    }));
  } catch (err) {
    // FTS table may not exist yet (e.g. before first seed). Fail safe so the
    // API route can fall back to a structured-only query instead of 500ing.
    console.error("[search] FTS query failed:", err);
    return [];
  }
}

/**
 * Whether the FTS index currently holds any rows. Used by the API route to
 * decide whether to trust the empty-result signal from `searchVendors`
 * (index missing → fall back to LIKE) vs. honour it (index present → really
 * no matches). Cheap COUNT(*) on the FTS table.
 */
export async function searchIndexHasRows(): Promise<boolean> {
  try {
    const rows = await db.$queryRawUnsafe<{ c: number }[]>(
      `SELECT COUNT(*) AS c FROM ${FTS_TABLE}`
    );
    return (rows[0]?.c ?? 0) > 0;
  } catch {
    return false;
  }
}

/*
 * ────────────────────────────────────────────────────────────────────────────
 * POSTGRES MIGRATION PATH (Supabase / Neon)
 * ────────────────────────────────────────────────────────────────────────────
 * When you move off SQLite, replace the FTS5 table with Postgres generated
 * columns + GIN indexes. Schema (run once via `prisma db push` after switching
 * the datasource provider to `postgresql`):
 *
 *   -- full-text search column + GIN index
 *   ALTER TABLE "Vendor"
 *     ADD COLUMN search_tsv tsvector
 *     GENERATED ALWAYS AS (
 *       setweight(to_tsvector('simple', coalesce(name, '')),      'A') ||
 *       setweight(to_tsvector('simple', coalesce(tagline, '')),   'B') ||
 *       setweight(to_tsvector('simple', coalesce(tags, '')),      'B') ||
 *       setweight(to_tsvector('simple', coalesce(description,'')),'C') ||
 *       setweight(to_tsvector('simple', coalesce(city, '')),      'D') ||
 *       setweight(to_tsvector('simple', coalesce(country, '')),   'D')
 *     ) STORED;
 *   CREATE INDEX vendor_search_tsv_idx ON "Vendor" USING GIN (search_tsv);
 *
 *   -- trigram fuzzy index for typo-tolerant city/country/name matching
 *   CREATE EXTENSION IF NOT EXISTS pg_trgm;
 *   CREATE INDEX vendor_name_trgm_idx   ON "Vendor" USING GIN (name    gin_trgm_ops);
 *   CREATE INDEX vendor_city_trgm_idx   ON "Vendor" USING GIN (city    gin_trgm_ops);
 *   CREATE INDEX vendor_country_trgm_idx ON "Vendor" USING GIN (country gin_trgm_ops);
 *
 * Then `searchVendors()` becomes:
 *
 *   SELECT id, ts_rank(search_tsv, q) AS rank
 *   FROM "Vendor", websearch_to_tsquery('simple', $1) q
 *   WHERE search_tsv @@ q AND ($2::text IS NULL OR ecosystem = $2)
 *   ORDER BY rank LIMIT $3
 *
 * And for fuzzy fallback (typos): `WHERE name % $1 OR city % $1` (pg_trgm).
 * The API route does not change at all — only this file.
 * ────────────────────────────────────────────────────────────────────────────
 */
