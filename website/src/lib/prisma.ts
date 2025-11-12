// Prisma Client Singleton
// Prevents multiple instances in development with hot reload

import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use Prisma Accelerate in production if DATABASE_URL contains 'accelerate'
const useAccelerate = process.env.DATABASE_URL?.includes('accelerate') ?? false;

const prismaClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Only use Accelerate if explicitly enabled and URL contains accelerate
let prisma: PrismaClient;
try {
  if (useAccelerate && process.env.DATABASE_URL?.includes('accelerate')) {
    prisma = prismaClient.$extends(withAccelerate()) as unknown as PrismaClient;
  } else {
    prisma = prismaClient;
  }
} catch (error) {
  // Fallback to regular client if Accelerate fails
  console.warn('[Prisma] Accelerate extension failed, using regular client:', error);
  prisma = prismaClient;
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { prisma };
export default prisma;
