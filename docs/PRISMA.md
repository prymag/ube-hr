# Prisma Setup and Configuration

## Overview

This project uses [Prisma ORM](https://www.prisma.io/) (v7) with a **MariaDB adapter** (`@prisma/adapter-mariadb`) targeting a MySQL-compatible database. The Prisma client is generated into `generated/prisma/` (not the default `node_modules/@prisma/client`) so the output lives in the repo and is portable across the monorepo.

---

## Files

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Data models, enums, datasource, and generator config |
| `prisma/seed.ts` | Seeds one user per role and all default role permissions |
| `prisma/tsconfig.json` | TypeScript config for the `prisma/` folder (includes monorepo path aliases) |
| `prisma/migrations/` | Versioned SQL migration history |
| `libs/backend/src/prisma/prisma.service.ts` | NestJS service that wraps `PrismaClient` |
| `libs/backend/src/prisma/prisma.module.ts` | Global NestJS module that provides and exports `PrismaService` |

---

## Schema

**`prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"   // generated into repo root, not node_modules
}

datasource db {
  provider = "mysql"                 // MariaDB is MySQL-compatible
}
```

### Models

| Model | Key fields | Notes |
|---|---|---|
| `User` | `id`, `email` (unique), `password`, `name`, `role`, `status`, `deletedAt`, `refreshTokenVersion` | Soft-deleted via `deletedAt`; email anonymized on delete |
| `Team` | `id`, `name` (unique), `ownerId`, `deletedAt` | Soft-deleted; owner FK to `User` |
| `Membership` | `userId`, `teamId` (composite PK) | Join table; cascades delete from both sides |
| `RolePermission` | `role`, `permission` (composite PK) | Stores granted permissions per role |

### Enums

```prisma
enum Role {
  USER        // rank 0
  MANAGER     // rank 1
  ADMIN       // rank 2
  SUPER_ADMIN // rank 3
}
// Declaration order = rank. Do not reorder.

enum UserStatus {
  ACTIVE
  BLOCKED
}
```

> **Important**: Role rank is derived from declaration order in the schema. Inserting a new role at the wrong position changes the rank of all roles below it.

---

## Generating the client

After any schema change, regenerate the client:

```bash
npx prisma generate
```

The generated client lands in `generated/prisma/`. Services import directly from there:

```ts
import { PrismaClient } from '../../../../generated/prisma/client';
```

---

## Running migrations

```bash
# Create and apply a new migration
npx prisma migrate dev --name <migration-name>

# Apply existing migrations (CI / production)
npx prisma migrate deploy
```

Migrations are stored in `prisma/migrations/` and committed to the repo. The migration lock file (`prisma/migrations/migration_lock.toml`) records the provider.

---

## PrismaService (`libs/backend/src/prisma/`)

`PrismaService` extends `PrismaClient` and is the single point of database access in the NestJS app.

### Connection

The MariaDB adapter is instantiated with environment variables resolved via NestJS `ConfigService`. All five variables are **required** — the service throws at startup if any are missing.

| Env variable | Description |
|---|---|
| `MYSQL_HOST` | Database hostname |
| `MYSQL_PORT` | Database port (number) |
| `MYSQL_USER` | Database user |
| `MYSQL_PASSWORD` | Database password |
| `MYSQL_DATABASE` | Database name |

```ts
const adapter = new PrismaMariaDb({
  host: config.getOrThrow('MYSQL_HOST'),
  port: config.getOrThrow('MYSQL_PORT'),
  user: config.getOrThrow('MYSQL_USER'),
  password: config.getOrThrow('MYSQL_PASSWORD'),
  database: config.getOrThrow('MYSQL_DATABASE'),
  connectionLimit: 5,
});
super({ adapter });
```

### Startup retry

`onModuleInit` attempts `$connect()` up to **10 times** with a **3-second delay** between attempts. This handles race conditions when the database container is still starting (e.g. during `docker compose up`).

### PrismaModule

`PrismaModule` is decorated with `@Global()`, so importing it once in the root `AppModule` makes `PrismaService` available throughout the entire application without additional imports.

```ts
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

## Seeding

```bash
npx prisma db seed
```

The seed script (`prisma/seed.ts`) runs with `tsx` and:

1. Creates (or upserts) one `User` per `Role` value with email `<role>@example.com` and password `password123` (Argon2-hashed via `@ube-hr/backend` secrets).
2. Upserts all default `RolePermission` rows from `DEFAULT_ROLE_PERMISSIONS` in `@ube-hr/shared`.

Seeded accounts:

| Email | Role | Password |
|---|---|---|
| `user@example.com` | USER | `password123` |
| `manager@example.com` | MANAGER | `password123` |
| `admin@example.com` | ADMIN | `password123` |
| `super.admin@example.com` | SUPER_ADMIN | `password123` |

The seed script connects using the same env variables as `PrismaService`, falling back to `localhost:3306` defaults for local development.

---

## Soft deletes

`User` and `Team` both have a `deletedAt: DateTime?` field. All queries **must** filter `deletedAt: null` to exclude deleted records — Prisma does not apply this filter automatically.

When a user is soft-deleted their email is anonymized to `deleted.{timestamp}.{original_email}` to free the unique constraint for re-registration.

---

## Database patterns

- **Auto-increment integer PKs** on `User` and `Team`.
- **Composite PKs** on `Membership` (`userId + teamId`) and `RolePermission` (`role + permission`).
- **Cascade deletes** on `Membership` when either the `User` or `Team` is hard-deleted.
- **`refreshTokenVersion`** on `User` increments on every token refresh; reuse of a previous refresh token throws 401 and invalidates all sessions.
