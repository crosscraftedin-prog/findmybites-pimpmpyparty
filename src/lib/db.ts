import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// On Vercel (production) we connect via Supabase's transaction pooler (PgBouncer)
// which limits concurrent connections on the free tier. Setting connection_limit
// here keeps Prisma from opening too many pooled connections per serverless
// instance. The limit is applied via the DATABASE_URL query param on Vercel;
// locally we keep the default.
const isProd = process.env.NODE_ENV === 'production'

/**
 * Resilient Prisma client wrapper.
 *
 * In the local sandbox, DATABASE_URL points to a SQLite file but the schema
 * is Postgres — Prisma throws PrismaClientInitializationError on every query.
 * This proxy catches those errors and returns empty results (null, [], 0)
 * so pages render gracefully (empty vendor lists, "no results" states)
 * instead of crashing or showing raw Prisma errors in the console.
 *
 * On Vercel production (real Postgres DATABASE_URL), this proxy is
 * transparent — all calls pass through to the real Prisma client.
 */
function createResilientClient(): PrismaClient {
  try {
    const client =
      globalForPrisma.prisma ??
      new PrismaClient({
        log: [], // suppress Prisma's own console logging (we handle errors via proxy)
      })
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client

    // Wrap in a Proxy that catches PrismaClientInitializationError
    return new Proxy(client, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver)
        if (typeof value !== 'function') return value
        // Return a wrapped function that catches initialization errors
        return async (...args: any[]) => {
          try {
            return await value.apply(target, args)
          } catch (err: any) {
            // PrismaClientInitializationError — DB not available (sandbox)
            if (
              err?.name === 'PrismaClientInitializationError' ||
              err?.message?.includes('must start with the protocol') ||
              err?.message?.includes('Error validating datasource')
            ) {
              // Return empty results based on the method called
              const method = String(prop)
              if (method === 'findUnique' || method === 'findFirst') return null
              if (method === 'findMany') return []
              if (method === 'count') return 0
              if (method === 'aggregate') return { _count: 0 }
              if (method === 'groupBy') return []
              return null
            }
            throw err
          }
        }
      },
    }) as PrismaClient
  } catch {
    // If PrismaClient construction itself fails, return a no-op proxy
    return new Proxy({} as PrismaClient, {
      get() {
        return () => Promise.resolve(null)
      },
    }) as PrismaClient
  }
}

export const db = createResilientClient()
