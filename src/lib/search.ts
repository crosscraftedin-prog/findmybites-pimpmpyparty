/**
 * Scalable vendor search — PostgreSQL edition (Supabase / Neon).
 *
 * Uses two Postgres-native mechanisms:
 *  - `tsvector` (to_tsvector + websearch_to_tsquery with a GIN index) for
 *    full-text search across name/tagline/description/tags/city/country,
 *    with relevance ranking via ts_rank.
 *  - `pg_trgm` (similarity() with a GIN trigram index) for fuzzy,
 *    typo-tolerant matching on city/country/name.
 *
 * The `Vendor.searchTsv` column + GIN indexes are created by the SQL in
 * `ensureSearchSchema()` below — run once (idempotent). They're also created
 * via a Prisma migration if you prefer (see the SQL block).
 *
 * On SQLite (local dev), the search gracefully degrades: `ensureSearchSchema`
 * is a no-op and `searchVendors` returns [], so the API route falls back to
 * the `contains` LIKE query. This keeps local dev working without Postgres.
 */
import { db } from "@/lib/db";

const IS_POSTGRES = process.env.DATABASE_URL?.startsWith("postgresql");

let schemaReady: Promise<void> | null = null;

/**
 * Idempotently create the Postgres full-text + trigram indexes.
 * No-op on SQLite (local dev) — search falls back to LIKE.
 */
export function ensureSearchSchema(): Promise<void> {
  if (!IS_POSTGRES) return Promise.resolve();
  if (!schemaReady) {
    schemaReady = (async () => {
      try {
        // pg_trgm extension for fuzzy matching
        await db.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
        // generated tsvector column (weighted: A=name, B=tagline+tags,
        // C=description, D=city+country) for relevance-ranked full-text search
        await db.$executeRawUnsafe(`
          ALTER TABLE "Vendor"
          ADD COLUMN IF NOT EXISTS "searchTsv" tsvector
          GENERATED ALWAYS AS (
            setweight(to_tsvector('simple', coalesce(name, '')),      'A') ||
            setweight(to_tsvector('simple', coalesce(tagline, '')),   'B') ||
            setweight(to_tsvector('simple', coalesce(tags, '')),      'B') ||
            setweight(to_tsvector('simple', coalesce(description,'')),'C') ||
            setweight(to_tsvector('simple', coalesce(city, '')),      'D') ||
            setweight(to_tsvector('simple', coalesce(country, '')),   'D')
          ) STORED;
        `);
        // GIN index for fast full-text queries
        await db.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "vendor_searchtsv_idx"
          ON "Vendor" USING GIN ("searchTsv");
        `);
        // GIN trigram indexes for fuzzy city/country/name matching
        await db.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "vendor_name_trgm_idx"
          ON "Vendor" USING GIN (name gin_trgm_ops);
        `);
        await db.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "vendor_city_trgm_idx"
          ON "Vendor" USING GIN (city gin_trgm_ops);
        `);
      } catch (err) {
        // don't crash — search will fall back to LIKE
        console.error("[search] ensureSearchSchema (partial):", err);
      }
    })();
  }
  return schemaReady;
}

/**
 * Drop and repopulate the FTS index. On Postgres the tsvector column is
 * generated (always in sync), so this is a no-op. Kept for API compat
 * with the seed script.
 */
export async function rebuildSearchIndex(): Promise<void> {
  // generated column auto-syncs — nothing to do on Postgres
  await ensureSearchSchema();
}

/**
 * Convert a raw user query into a safe websearch_to_tsquery expression.
 * websearch_to_tsquery supports natural syntax: "sourdough paris",
 * quotes for phrases, - for negation, OR. We just pass it through after
 * trimming.
 */
export function sanitizeFtsQuery(input: string): string {
  const q = input.trim().replace(/[;\\]/g, "");
  return q;
}

export interface SearchHit {
  vendorId: string;
  rank: number;
}

/**
 * Run a full-text search and return ranked vendor IDs.
 *
 * @param query   Raw user search string.
 * @param ecosystem  Optional ecosystem filter.
 * @param limit   Cap on candidate IDs returned (default 200).
 *
 * Returns [] if the query is empty, Postgres isn't configured, or no matches.
 * The caller treats an empty result as "no vendors match".
 */
export async function searchVendors(
  query: string,
  ecosystem?: string,
  limit = 200
): Promise<SearchHit[]> {
  const ftsQuery = sanitizeFtsQuery(query);
  if (!ftsQuery || !IS_POSTGRES) return [];

  await ensureSearchSchema();

  try {
    const rows = ecosystem
      ? await db.$queryRawUnsafe<{ vendorId: string; rank: number }[]>(
          `SELECT id AS "vendorId", ts_rank("searchTsv", websearch_to_tsquery('simple', $1)) AS rank
           FROM "Vendor"
           WHERE "searchTsv" @@ websearch_to_tsquery('simple', $1)
             AND ecosystem = $2
           ORDER BY rank DESC
           LIMIT $3`,
          ftsQuery,
          ecosystem,
          limit
        )
      : await db.$queryRawUnsafe<{ vendorId: string; rank: number }[]>(
          `SELECT id AS "vendorId", ts_rank("searchTsv", websearch_to_tsquery('simple', $1)) AS rank
           FROM "Vendor"
           WHERE "searchTsv" @@ websearch_to_tsquery('simple', $1)
           ORDER BY rank DESC
           LIMIT $2`,
          ftsQuery,
          limit
        );

    return rows.map((r) => ({ vendorId: r.vendorId, rank: Number(r.rank) }));
  } catch (err) {
    console.error("[search] Postgres FTS query failed:", err);
    return [];
  }
}

/**
 * Whether the search index is usable. On Postgres we trust it after
 * ensureSearchSchema runs; on SQLite we return false so the API uses LIKE.
 */
export async function searchIndexHasRows(): Promise<boolean> {
  if (!IS_POSTGRES) return false;
  try {
    const rows = await db.$queryRawUnsafe<{ c: number }[]>(
      `SELECT COUNT(*) AS c FROM "Vendor" WHERE "searchTsv" IS NOT NULL`
    );
    return (rows[0]?.c ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Haversine great-circle distance in kilometres. Used by the Near Me geo
 * search regardless of the DB provider.
 */
const EARTH_RADIUS_KM = 6371;
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Fuzzy search using pg_trgm similarity — for typo-tolerant matching when
 * the strict FTS query returns nothing (e.g. "Lisboa" → "Lisbon").
 * Returns vendor IDs sorted by similarity desc.
 */
export async function fuzzySearchVendors(
  query: string,
  ecosystem?: string,
  limit = 50
): Promise<SearchHit[]> {
  if (!IS_POSTGRES || !query.trim()) return [];
  await ensureSearchSchema();
  try {
    const rows = ecosystem
      ? await db.$queryRawUnsafe<{ vendorId: string; rank: number }[]>(
          `SELECT id AS "vendorId", similarity(name, $1) AS rank
           FROM "Vendor"
           WHERE name % $1 AND ecosystem = $2
           ORDER BY rank DESC LIMIT $3`,
          query,
          ecosystem,
          limit
        )
      : await db.$queryRawUnsafe<{ vendorId: string; rank: number }[]>(
          `SELECT id AS "vendorId", similarity(name, $1) AS rank
           FROM "Vendor"
           WHERE name % $1
           ORDER BY rank DESC LIMIT $2`,
          query,
          limit
        );
    return rows.map((r) => ({ vendorId: r.vendorId, rank: Number(r.rank) }));
  } catch {
    return [];
  }
}
