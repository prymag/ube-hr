import { PrismaClient } from '@/generated/prisma/client';

/**
 * Database client factory.
 *
 * Prisma 7 requires a driver adapter for direct database connections.
 * For MySQL/MariaDB, install and configure `@prisma/adapter-mariadb`:
 *
 * ```ts
 * import { createPool } from 'mysql2/promise';
 * import { PrismaMariaDb } from '@prisma/adapter-mariadb';
 *
 * const pool = createPool({ uri: process.env.DATABASE_URL });
 * const adapter = new PrismaMariaDb(pool);
 * return new PrismaClient({ adapter });
 * ```
 *
 * Until the adapter is configured, this factory creates a client instance
 * using a datasource URL. Replace with the adapter-based approach before
 * running in production.
 */
export function createPrismaClient(): PrismaClient {
  // Type assertion required: Prisma 7 TS types mandate adapter/accelerateUrl,
  // but the runtime can still accept datasourceUrl for local development.
  // Replace with a proper adapter before production deployment.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (PrismaClient as unknown as new (opts: Record<string, unknown>) => PrismaClient)({
    datasourceUrl: process.env.DATABASE_URL,
  });
}
