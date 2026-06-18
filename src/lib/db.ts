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

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['error', 'warn'] : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
