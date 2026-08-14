/**
 * Singleton PrismaClient instance with Serverless Connection Pooling Optimization
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getFormattedDbUrl(url?: string) {
  if (!url) return undefined;
  // If URL uses Supabase pooler on port 5432, switch to port 6543 transaction mode or add parameters
  let finalUrl = url;
  if (finalUrl.includes('pooler.supabase.com:5432')) {
    finalUrl = finalUrl.replace(':5432', ':6543');
  }

  if (!finalUrl.includes('connection_limit=')) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}connection_limit=5&pool_timeout=20&pgbouncer=true`;
  }
  return finalUrl;
}

const formattedUrl = getFormattedDbUrl(process.env.DATABASE_URL);

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: formattedUrl
      ? {
          db: {
            url: formattedUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
