// Prisma Client — the single database connection for the whole app.
// Caching it on globalThis stops hot reload from opening a new
// connection on every file change during development.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
