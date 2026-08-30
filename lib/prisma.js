// Prisma Client — the single database connection for the whole app.
// Caching it on globalThis stops hot reload from opening a new
// connection on every file change during development.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// How many connections to open at start-up. The dashboard is the widest page
// and issues four queries at once, so four is enough — measured, eight was no
// faster.
const WARMUP_CONNECTIONS = 4;

/**
 * Opens the connection pool at start-up instead of on the first query.
 *
 * Neon runs in ap-southeast-1 and every connection costs a full TLS handshake
 * from India. Left lazy, the first person to open the dashboard pays for all
 * of them and the page just sits there. Measured on this laptop, first
 * dashboard load:
 *
 *   no warm-up ............................ 2004ms
 *   $connect() only ....................... 1243ms   (opens one connection)
 *   $connect() + 4 parallel queries ......... 460ms
 *
 * $connect() alone is not enough: it opens a single connection, so a page
 * running four queries in parallel still opens the other three while the user
 * waits. The throwaway SELECTs force the pool to fill up front.
 *
 * Fire-and-forget on purpose. If warming fails, normal queries will reconnect
 * and surface the real error themselves — there is nothing useful to do here
 * beyond keeping the rejection from taking down the process.
 */
if (!globalForPrisma.prismaWarmup) {
  globalForPrisma.prismaWarmup = prisma
    .$connect()
    .then(() =>
      Promise.all(
        Array.from({ length: WARMUP_CONNECTIONS }, () => prisma.$queryRaw`SELECT 1`)
      )
    )
    .catch((err) => {
      console.error("Prisma warm-up failed:", err.message);
    });
}
