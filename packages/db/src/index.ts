import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

export * from './generated/prisma/client.js';

/**
 * Each PrismaClient owns a connection pool, so create one per process
 * and share it (the API does this in PrismaService).
 */
export function createPrismaClient(connectionString: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}
export { PrismaPg } from '@prisma/adapter-pg';
