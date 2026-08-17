// 🗄️ Prisma Client — Database se baat karne ka single connection
// Ye file ensure karti hai ki development mein baar baar 
// naya connection na bane (hot reload ki wajah se)

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
