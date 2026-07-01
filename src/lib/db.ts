import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Production Prisma client — DATABASE-ONLY, no fallbacks.
 *
 * The previous version wrapped PrismaClient in a Proxy that swallowed
 * PrismaClientInitializationError and returned empty results (null, [], 0).
 * That caused ConversationState to be silently lost on every request.
 *
 * This version uses a direct PrismaClient. All errors propagate to the
 * caller, which must log them with structured detail (error code, message,
 * stack trace) — never swallow them.
 */
const client =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
    ],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client

export const db = client
