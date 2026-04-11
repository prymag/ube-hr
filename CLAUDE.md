This is an NX workspace with a NestJS API (`apps/api`) and a React web app (`apps/web`).

## Running the project

```bash
npm run dev          # starts API (port 3000) + web (port 4200) in parallel
npx nx lint web      # TypeScript/lint check for the frontend
```

Swagger docs: `http://localhost:3000/api/docs`

---

## Library map

| Import alias | Path | Purpose |
|---|---|---|
| `@ube-hr/feature` | `libs/feature/src/` | NestJS feature modules (auth, users, teams, permissions) |
| `@ube-hr/backend` | `libs/backend/src/` | PrismaModule, AppConfigModule, secrets (Argon2) |
| `@ube-hr/shared` | `libs/shared/src/` | Framework-agnostic: PERMISSIONS constants, Permission type, wire types shared between API and frontend |
| `@ube-hr/ui` | `libs/ui/src/` | Radix UI + Tailwind components (Button, Input, Table, Dialog, Badge, Select, Card) |

---

## Key files by concern

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

---

## Adding a new feature

### Shared types checklist (`libs/shared`)

Do this **before** writing the controller or any frontend code — both layers import from here.

1. Add wire types to `libs/shared/src/models.ts`:
   - `<Entity>Response` — shape returned by GET endpoints (plain string unions, no Prisma enums).
   - `<Entity>ListParams` — query-string params for the list endpoint (`search?`, `sortField?`, `sortDir?`, `page?`, `pageSize?`).
   - Any sub-shapes the response embeds (e.g. `<Entity>Member`).
2. `libs/shared/src/index.ts` already re-exports `./models` — no change needed unless you add a new file.

### Backend checklist

1. Add model to `prisma/schema.prisma`, run migration.
2. Create `libs/feature/src/<entity>/` with: `<entity>.module.ts`, `<entity>.service.ts`.
3. Add new permission strings to `libs/shared/src/permissions.ts` and update `DEFAULT_ROLE_PERMISSIONS`.
4. Add a controller at `apps/api/src/app/<entity>.controller.ts` with a `dto/` subfolder; protect routes with `@RequirePermission()`.
   - Map DTO → plain type before passing to the service.
   - Map service output → `<Entity>Response` (from `@ube-hr/shared`) before returning.
5. Import the new module in `apps/api/src/app/app.module.ts`.
6. Export from `libs/feature/src/index.ts`.

### Frontend checklist

1. Create `apps/web/src/features/<entity>/` with the files below.
   - Import `<Entity>Response`, `<Entity>ListParams`, etc. directly from `@ube-hr/shared` — do not redefine them locally.
2. Add pages under `apps/web/src/pages/<entity>/`.
3. Register routes in `apps/web/src/app/app.tsx` inside a `<RequirePermission>` wrapper.
4. Add nav link in `apps/web/src/layouts/AuthLayout.tsx`.

---

## Backend library structure (`libs/feature`)

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

**Module dependency rule**: Use relative imports between modules inside `libs/feature`. Use `@ube-hr/feature` only from outside (e.g., `apps/api`).

---

## DTO and type boundaries

DTOs (`class-validator` + `@ApiProperty` decorators) are HTTP-layer concerns — they belong in `apps/api/src/app/<entity>/dto/`, co-located with the controller that uses them. They must **never** live in `libs/feature` or `libs/shared`.

NX enforces this automatically: `libs/` cannot import from `apps/`, so placing DTOs in `apps/` makes it physically impossible for services to depend on them.

Type ownership by layer:

| Layer | What lives here | Example |
|---|---|---|
| `apps/api/.../dto/` | DTOs (class-validator, @ApiProperty) | `CreateUserDto` |
| `libs/feature/src/` | Internal service interfaces, Prisma-adjacent types | service method params |
| `libs/shared/src/` | Wire types shared between controller and frontend (plain strings, no Prisma enums) | `UserResponse`, `UsersListParams` |

**Services never receive or return DTOs.** The controller maps DTO → plain type before calling the service, and maps service output → response shape before returning.

**Shared wire types (`libs/shared`)**: Because Prisma enums are backend-only, `libs/shared` uses plain string unions (e.g. `role: 'USER' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN'`) that match what crosses the HTTP boundary. The controller is responsible for mapping service output (which uses Prisma enums) to these shared types. The frontend imports directly from `@ube-hr/shared` instead of duplicating type definitions locally.

```
libs/feature/src/users/users.service.ts  →  UserRecord { role: Role }         (Prisma enum, backend only)
libs/shared/src/models/user.ts           →  UserResponse { role: 'USER'|... }  (plain string, shared)
apps/web/src/features/users/             →  import { UserResponse } from '@ube-hr/shared'
```

The trade-off: string union types in `libs/shared` must be kept in sync with the Prisma schema manually when roles or enum values change.

**Import discipline**: Use type names as defined in `libs/shared` — never alias them at the import site (no `import { UserResponse as User }`). Do not create intermediate re-export files (e.g. `user.types.ts`) just to rename or re-expose shared types; that is pointless indirection. Import from `@ube-hr/shared` directly.

---

## Frontend feature structure

Each `features/<entity>/` folder contains:
- **`<entity>.api.ts`** — raw Axios calls
- **`<entity>.queries.ts`** — React Query hooks
- **`index.ts`** — re-exports everything
- **`components/`** — all UI components for the feature:
  - **`<Entity>Table.tsx`** — table/list component
  - **`Delete<Entity>Dialog.tsx`** — delete confirmation dialog; owns its delete mutation

---

## Frontend CRUD navigation pattern

**Never use modals for create, read, or update operations.** Use dedicated pages instead:

- **Create** — `/new` route (e.g. `/users/new`) with a `Create<Entity>Page` that owns form state and the create mutation.
- **Read/Update** — `/:id` route (e.g. `/users/:id`) with a `<Entity>DetailPage`. Loads the entity, presents a pre-filled editable form, Save button calls the update mutation. Read and update share the same page.
- **Delete** — the only operation that may use a dialog/modal for confirmation.

Pages own form state and mutation. They pass values, change handlers, `onSubmit`, `isPending`, and `error` down to the form component.

---

## Form design

Forms are presentational — they receive values, change handlers, `onSubmit`, `isPending`, and `error` as props. No internal state, no mutations. The parent page or dialog owns everything.

---

## Managing complexity

When a page or component has multiple queries, non-trivial derived state, or compound side effects, extract a `use<Page|Feature>` hook. Keep components focused on rendering.

---

## React Query patterns

- **Dependent queries** (waiting for a value): use `skipToken` from `@tanstack/react-query`
- **Lazy queries** (manually triggered via `refetch()`): use `enabled: false`
- Query keys follow `['entity', 'list']` / `['entity', id]` pattern.
- Mutations invalidate related query keys on success.

---

## Server-side list tables (search / filter / sort / pagination)

List endpoints return a paginated envelope — **never a raw array**:
```ts
{ data: T[], total: number, page: number, pageSize: number, pageCount: number }
```
The `PaginatedResponse<T>` type lives in `libs/shared/src/models.ts` and is imported from `@ube-hr/shared`.

Each list feature has a **`use<Entity>Table` hook** (`features/<entity>/use<Entity>Table.ts`) that:
- Owns all control state: raw search input, debounced search (300ms), filters, sort field/dir, page
- Builds and exposes a `params` object passed directly to `useUsers(params)` / `useTeams(params)`
- Does **no** client-side filtering or sorting — all processing is server-side

React Query key for list queries includes `params` so refetches happen automatically when controls change. Existing mutation invalidations still work because they invalidate by list-key prefix.

**Dropdown / internal lookups** that need all items (e.g. "add member" selects) call `useUsers({ pageSize: 1000 })` or `useTeams({ pageSize: 1000 })` and access `.data.data`. For single-entity lookups use `useUser(id)`, not the list hook.

**Role filter dropdowns** must only show roles the current user can manage (`ROLE_RANK[r] <= callerRank`), matching the backend's `visibleRoles()` logic.

**Backend list convention** (no `class-transformer` installed): controllers accept individual `@Query('param') param?: string` decorators and forward raw strings to the service. The service parses numbers with `parseInt`, whitelists sort fields against a `const` array, and validates enums with `Object.values(EnumType).includes(...)`. Page sizes are clamped to max 100.

---

## Auth & permission system

**JWT payload fields**: `sub` (user id), `email`, `role`, `impersonatedBy?`

**Permission guard usage**:
```ts
@RequirePermission(PERMISSIONS.USERS_READ)
@Get()
findAll() { ... }
```

**Permission constants** live in `@ube-hr/shared`. Default role assignments are in `libs/shared/src/permissions.ts`.

**Role hierarchy** (for "can X manage Y" checks): `USER (0) < MANAGER (1) < ADMIN (2) < SUPER_ADMIN (3)`. A user cannot manage another user of equal or higher rank.

**Impersonation**: 30-minute tokens; requires `auth:impersonate` permission; token carries `impersonatedBy: adminId`.

---

## Database patterns

- ORM: Prisma with MariaDB adapter (`generated/prisma` client).
- Soft deletes: `deletedAt` timestamp on User and Team. Always filter `deletedAt: null`.
- Deleted user emails are anonymized: `deleted.{timestamp}.{original_email}`.
- Refresh token reuse detection: `refreshTokenVersion` increments on each refresh; reuse throws 401 and invalidates all sessions.
