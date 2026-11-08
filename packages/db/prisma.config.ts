import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// One .env at the repo root serves the CLI, the API and the web app.
config({ path: '../../.env' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
