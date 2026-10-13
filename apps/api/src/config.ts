import { fileURLToPath } from 'node:url';

export const config = {
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://yratech:yratech@localhost:5432/yratech',
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  contentDir: process.env.CONTENT_DIR ?? fileURLToPath(new URL('../../../content', import.meta.url)),
  migrationsDir: fileURLToPath(new URL('../migrations', import.meta.url)),
};
