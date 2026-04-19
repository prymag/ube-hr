/**
 * CJS-compatible stub for generated/prisma/client.ts.
 *
 * The real generated client uses `import.meta.url` (ESM-only) which crashes
 * Jest in CommonJS mode. This stub satisfies the `extends PrismaClient` in
 * PrismaService so the module graph loads cleanly. The real PrismaService is
 * always replaced via `useValue` in unit tests, so this class is never
 * instantiated.
 */
export class PrismaClient {}
