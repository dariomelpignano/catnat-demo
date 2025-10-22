import { PrismaClient } from '@prisma/client';

// Singleton Prisma client with optional initialization
let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient | null {
  // If DATABASE_URL not set, return null (cache disabled)
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set - caching disabled');
    return null;
  }

  if (!prisma) {
    try {
      prisma = new PrismaClient();
    } catch (error) {
      console.error('Failed to initialize Prisma:', error);
      return null;
    }
  }

  return prisma;
}

export { prisma };
