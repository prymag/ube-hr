# UBE-HR Agent Guidelines

This repository is an Nx monorepo with a NestJS API (`apps/api`) and a React web app (`apps/web`).

## Project Structure & Commands

| Project     | Root           | Tech Stack              | Main Commands                                            |
| ----------- | -------------- | ----------------------- | -------------------------------------------------------- |
| **API**     | `apps/api`     | NestJS, Prisma, Webpack | `npx nx build api`, `npx nx test api`, `npx nx lint api` |
| **Web**     | `apps/web`     | React, Vite, Tailwind   | `npx nx build web`, `npx nx test web`, `npx nx lint web` |
| **Feature** | `libs/feature` | NestJS Services         | `npx nx test feature`                                    |
| **Shared**  | `libs/shared`  | TypeScript (Wire Types) | `npx nx test shared`                                     |
| **UI**      | `libs/ui`      | Radix UI, Tailwind      | `npx nx test ui`                                         |
| **Backend** | `libs/backend` | Prisma Service, Config  | `npx nx test backend`                                    |

### Key Development Commands

- **Start All**: `npm run dev` (Starts API on 3000, Web on 4200, and Docker DB)
- **Single Test**: `npx nx test <project> --testFile=<path>`
- **Type Check**: `npx nx run-many -t typecheck` (web) or `npx nx lint`
- **Swagger Docs**: `http://localhost:3000/api/docs`

## Library Architecture

| Import Alias      | Path                | Purpose                                                  |
| ----------------- | ------------------- | -------------------------------------------------------- |
| `@ube-hr/feature` | `libs/feature/src/` | Business logic, services, modules, guards.               |
| `@ube-hr/shared`  | `libs/shared/src/`  | Wire types, permissions, constants (framework-agnostic). |
| `@ube-hr/backend` | `libs/backend/src/` | `PrismaService`, `AppConfigModule`, low-level utils.     |
| `@ube-hr/ui`      | `libs/ui/src/`      | Radix UI + Tailwind design system components.            |

- **Strict Dependency Rule**: `libs/` **cannot** import from `apps/`.
- **Feature Rule**: Use relative imports between sibling modules within `libs/feature`. Use the alias only from outside.

## Key Files by Concern

### Backend

| Concern | File |
|---|---|
| Server bootstrap | `apps/api/src/main.ts` |
| Root module (middleware, imports) | `apps/api/src/app/app.module.ts` |
| Controllers | `apps/api/src/app/<entity>.controller.ts` |
| Auth service (login, refresh, impersonate) | `libs/feature/src/auth/auth.service.ts` |
| Auth middleware (JWT validation, global) | `libs/feature/src/auth/middleware/auth.middleware.ts` |
| Permission guard | `libs/feature/src/auth/guards/permission.guard.ts` |
| `@RequirePermission()` decorator | `libs/feature/src/auth/decorators/require-permission.decorator.ts` |
| Permission cache service | `libs/feature/src/permissions/permissions.service.ts` |
| Users service | `libs/feature/src/users/users.service.ts` |
| Teams service | `libs/feature/src/teams/teams.service.ts` |
| Database schema | `prisma/schema.prisma` |
| Prisma service | `libs/backend/src/prisma/prisma.service.ts` |
| Permission constants + defaults | `libs/shared/src/permissions.ts` |

### Frontend

| Concern | File |
|---|---|
| React entry point | `apps/web/src/main.tsx` |
| Routes + route guards | `apps/web/src/app/app.tsx` |
| Auth state (token, user, cross-tab sync) | `apps/web/src/store/AuthContext.tsx` |
| Axios instance (interceptors, auto-refresh) | `apps/web/src/services/axios.ts` |
| Role rank / badge config | `apps/web/src/config/roles.ts` |
| Sidebar + nav layout | `apps/web/src/layouts/AuthLayout.tsx` |

## Backend Guidelines (NestJS)

### `libs/feature` Directory Structure

```
libs/feature/src/
├── auth/
│   ├── auth.module.ts         (Global module, imports UsersModule)
│   ├── auth.service.ts
│   ├── strategies/            (local.strategy.ts, jwt.strategy.ts)
│   ├── guards/                (jwt-auth, local-auth, permission)
│   ├── middleware/            (auth.middleware.ts — applied globally in app.module)
│   └── decorators/            (@RequirePermission)
├── users/
│   ├── users.module.ts
│   └── users.service.ts       (CRUD, Argon2 hashing, soft deletes, role hierarchy)
├── teams/
│   ├── teams.module.ts
│   └── teams.service.ts       (CRUD, membership, role hierarchy checks)
├── permissions/
│   ├── permissions.module.ts
│   └── permissions.service.ts (in-memory cache, reloads after grant/revoke)
└── index.ts

apps/api/src/app/
├── <entity>.controller.ts
└── <entity>/dto/              (DTOs live here, not in libs/feature)
    ├── create-<entity>.dto.ts
    └── update-<entity>.dto.ts
```

### Layered Responsibility & Boundaries

- **Controllers**: `apps/api/src/app/`. Map DTOs $\rightarrow$ Service Inputs and Service Outputs $\rightarrow$ Shared Wire Types.
- **DTOs**: `apps/api/src/app/<entity>/dto/`. Use `class-validator` and `@nestjs/swagger`. DTOs **never** leave the API app.
- **Services**: `libs/feature/src/<entity>/`. Handle business logic and Prisma calls.
- **The Golden Rule**: Services **never** receive or return DTOs. The controller is the only place where DTO $\leftrightarrow$ Internal Type mapping occurs.

| Layer               | What lives here                                                   | Example               |
| ------------------- | ----------------------------------------------------------------- | --------------------- |
| `apps/api/.../dto/` | DTOs (class-validator, @ApiProperty)                              | `CreateUserDto`       |
| `libs/feature/src/` | Internal service interfaces, Prisma-adjacent types                | service method params |
| `libs/shared/src/`  | Wire types shared between controller and frontend (plain strings) | `UserResponse`        |

### Auth & Permission System

- **Permissions**: Use `@RequirePermission(PERMISSIONS.XXX)` on controller methods.
- **Constants**: Permission constants live in `@ube-hr/shared`.
- **Role Hierarchy**: `USER (0) < MANAGER (1) < ADMIN (2) < SUPER_ADMIN (3)`. A user cannot manage others of equal or higher rank.
- **Impersonation**: 30-minute tokens; requires `auth:impersonate` permission; token carries `impersonatedBy: adminId`.
- **JWT Payload**: `sub` (user id), `email`, `role`, `impersonatedBy?`.

### Database & Error Handling

- **Soft Deletes**: Always filter for `deletedAt: null`.
- **Anonymization**: Deleted user emails are prefixed: `deleted.{timestamp}.{email}`.
- **Exceptions**: Use standard NestJS `HttpException` (e.g., `NotFoundException`, `ConflictException`).
- **ORM**: Prisma with MariaDB adapter.

- **Session Security**: `refreshTokenVersion` increments on each refresh; reuse throws 401 and invalidates all sessions.

## Testing (`libs/feature`)

Unit tests live next to the service they test: `<service>.service.spec.ts`. Run with `npx nx test feature`.

### Infrastructure

| File                                       | Purpose                                                                                                              |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `libs/feature/jest.config.cts`             | Jest config; includes `moduleNameMapper` to redirect `@ube-hr/backend`                                               |
| `libs/feature/tsconfig.spec.json`          | Spec tsconfig; includes `src/testing/**/*.ts` so helpers see Jest globals                                            |
| `libs/feature/tsconfig.lib.json`           | Excludes `src/testing/**/*.ts` so VS Code uses the spec tsconfig for those files                                     |
| `libs/feature/src/testing/prisma.mock.ts`  | `createPrismaMock()` — returns an object of `jest.fn()` stubs matching the Prisma model API                          |
| `libs/feature/src/testing/backend.mock.ts` | Manual mock for `@ube-hr/backend`; avoids the generated Prisma client (ESM/`import.meta` incompatible with Jest CJS) |

### Why `@ube-hr/backend` is mocked at the module level

The generated Prisma client (`generated/prisma/client.ts`) uses `import.meta.url` which is ESM-only and crashes Jest in CommonJS mode. `moduleNameMapper` in `jest.config.cts` redirects `@ube-hr/backend` to `backend.mock.ts`, which re-exports `Role`, `UserStatus`, a stub `PrismaService` class, and a spyable `secrets` object — everything the services need at runtime, without touching the Prisma client.

### Pattern for a new service spec

```ts
import { Test } from '@nestjs/testing';
import { PrismaService } from '@ube-hr/backend'; // resolves to backend.mock.ts
import { createPrismaMock, PrismaMock } from '../testing/prisma.mock';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module = await Test.createTestingModule({
      providers: [MyService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(MyService);
  });

  afterEach(() => jest.clearAllMocks());
});
```

Spy on `secrets` methods via `jest.spyOn(backendMock.secrets, 'hash').mockResolvedValue(...)` where `backendMock` is `import * as backendMock from '@ube-hr/backend'`.

Services that depend on other services (e.g. `AuthService` → `UsersService`) use `jest.Mocked<Pick<...>>` to mock only the methods the service under test calls:

```ts
const usersService: jest.Mocked<
  Pick<UsersService, 'findById' | 'incrementTokenVersion'>
> = {
  findById: jest.fn(),
  incrementTokenVersion: jest.fn(),
};
```

## Frontend Guidelines (React)

### Feature Structure (`apps/web/src/features/<entity>/`)

- **`<entity>.api.ts`**: Raw Axios calls using the shared `api` instance.
- **`<entity>.queries.ts`**: React Query hooks with standard keys `['entity', 'list']` / `['entity', id]`.
- **`use<Entity>Table.ts`**: Hook for server-side list state (search, sort, pagination).
- **`components/`**: Feature-specific UI (e.g., `Delete<Entity>Dialog.tsx`).
- **`index.ts`**: Re-exports all feature files.

### Navigation & Forms

- **No Modals for CRUD**: Use dedicated pages for Create (`/new`) and Update (`/:id`).
- **Modals**: Only for Delete confirmation or simple single-field actions.
- **Form Components**: Presentational only. Props: `values`, `onChange`, `onSubmit`, `isPending`, `error`. Parent page owns state/mutations.

### State Management & Data Flow

- **Auth**: `AuthContext.tsx` handles JWT, user state, and cross-tab sync.
- **Axios**: Interceptors handle automatic token refresh via `refreshTokenVersion`.
- **React Query Patterns**:
  - **Dependent queries**: Use `skipToken` from `@tanstack/react-query`.
  - **Lazy queries**: Use `enabled: false` and trigger via `refetch()`.
  - Mutations must invalidate related query keys on success.

### Server-side List Tables

- **Paginated Response**: List endpoints must return a `PaginatedResponse<T>`: `{ data: T[], total: number, page: number, pageSize: number, pageCount: number }`.
- **`use<Entity>Table` Hook**:
  - Owns all control state (raw search, debounced search (300ms), filters, sort, page).
  - Builds `params` object for queries.
  - No client-side filtering/sorting; all processing is server-side.
- **Role Filters**: Only show roles the current user can manage (`ROLE_RANK[r] <= callerRank`), matching the backend's `visibleRoles()` logic.
- **Dropdown / internal lookups** that need all items (e.g. "add member" selects) call `useUsers({ pageSize: 1000 })` or `useTeams({ pageSize: 1000 })` and access `.data.data`. For single-entity lookups use `useUser(id)`, not the list hook.
- **Backend list convention** (`class-transformer` is NOT installed): controllers accept individual `@Query('param') param?: string` decorators and forward raw strings to the service. The service parses numbers with `parseInt`, whitelists sort fields against a `const` array, and validates enums with `Object.values(EnumType).includes(...)`. Page sizes are clamped to max 100.

### Managing Complexity

- When a page has multiple queries or compound side effects, extract a `use<Page|Feature>` hook. Keep components focused on rendering.

## Typing & Data Flow

- **Wire Types**: Defined in `libs/shared/src/models.ts`. `libs/shared/src/index.ts` already re-exports `./models` — no change needed unless you add a new file.
- **Enums**: Use plain string unions in `libs/shared` (e.g., `'ACTIVE' | 'BLOCKED'`) to match JSON. Prisma enums are backend-only.
- **Type Layer Mapping**:
  ```
  libs/feature/src/users/users.service.ts  →  UserRecord { role: Role }         (Prisma enum, backend only)
  libs/shared/src/models.ts                →  UserResponse { role: 'USER'|... }  (plain string, shared)
  apps/web/src/features/users/             →  import { UserResponse } from '@ube-hr/shared'
  ```
- **Naming Conventions**:
  - `UserResponse`, `UsersListParams` (Wire types)
  - `create-user.dto.ts` (DTO filenames)
  - `toUserResponse()` (Mapper functions in controllers)
- **Import Discipline**: Import from `@ube-hr/shared` directly. Never alias shared types at the import site.

## Implementation Workflow

### 1. Shared Types (`libs/shared`)

_Do this before writing controllers or frontend code._

- Add wire types to `libs/shared/src/models.ts` (`<Entity>Response`, `<Entity>ListParams`).
- Ensure plain string unions are used instead of Prisma enums.

### 2. Backend Implementation

- Add model to `prisma/schema.prisma` and run migration.
- Create `libs/feature/src/<entity>/` with `.module.ts` and `.service.ts`.
- Add permissions to `libs/shared/src/permissions.ts` and update `DEFAULT_ROLE_PERMISSIONS`.
- Create controller at `apps/api/src/app/<entity>.controller.ts` with `dto/` subfolder.
- Protect routes with `@RequirePermission()`.
- Implement DTO $\rightarrow$ Service and Service $\rightarrow$ Response mapping in the controller.
- Export module from `libs/feature/src/index.ts` and import in `app.module.ts`.

### 3. Frontend Implementation

- Create `apps/web/src/features/<entity>/` with `.api.ts` and `.queries.ts`.
- Create pages under `apps/web/src/pages/<entity>/`.
- Register routes in `apps/web/src/app/app.tsx` inside `<RequirePermission>` wrapper.
- Add nav link in `apps/web/src/layouts/AuthLayout.tsx`.

## Verification Checklist

1. **Lint & Typecheck**: `npx nx lint <project>` and `npx nx run-many -t typecheck`.
2. **Build**: `npx nx build <project>` (Ensure no production build errors).
3. **Tests**: Run affected tests or specific file tests.
4. **Prisma**: If schema changes, run migration and verify `deletedAt` filters.
