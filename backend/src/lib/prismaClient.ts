/**
 * Singleton PrismaClient instance
 * 
 * Prevents connection pool exhaustion from creating new PrismaClient instances
 * in every controller (critical for serverless environments like Vercel).
 */
import { PrismaClient } from '@prisma/client';

// Use a global variable to persist the client across hot-reloads in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

globalForPrisma.prisma = prisma;

export default prisma;
