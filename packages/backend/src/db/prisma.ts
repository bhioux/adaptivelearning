import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton. Use `prisma.$transaction([...])` for multi-step
 * mutations. Connect happens lazily on first query.
 */
export const prisma = new PrismaClient();

export async function connectDb(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;
