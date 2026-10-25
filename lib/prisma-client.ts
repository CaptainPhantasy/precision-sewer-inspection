import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/** Construct an independently owned client; disconnect also closes its pool. */
export function createPrismaClient(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) throw new Error('DATABASE_URL is required for database access.');
  const adapter = new PrismaPg({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10_000,
    enableChannelBinding: true,
  });
  return new PrismaClient({ adapter });
}
