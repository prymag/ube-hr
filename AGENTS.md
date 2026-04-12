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

## Backend Guidelines (NestJS)

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
- **Role Filters**: Only show roles the current user can manage (`ROLE_RANK[r] <= callerRank`).

### Managing Complexity

- When a page has multiple queries or compound side effects, extract a `use<Page|Feature>` hook. Keep components focused on rendering.

## Typing & Data Flow

- **Wire Types**: Defined in `libs/shared/src/models.ts`.
- **Enums**: Use plain string unions in `libs/shared` (e.g., `'ACTIVE' | 'BLOCKED'`) to match JSON. Prisma enums are backend-only.
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
