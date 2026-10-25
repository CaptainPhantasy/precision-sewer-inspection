import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { seed: 'tsx --require dotenv/config scripts/safe-seed.ts' },
  // Generation during npm ci does not require database credentials.
  datasource: { url: process.env.DATABASE_URL },
});
