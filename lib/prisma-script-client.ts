// Standalone scripts do not receive Next.js or Prisma CLI environment loading.
import 'dotenv/config';
export { createPrismaClient } from './prisma-client';
