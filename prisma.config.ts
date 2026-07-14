import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node --transpile-only --project prisma/seed/tsconfig.json prisma/seed/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
