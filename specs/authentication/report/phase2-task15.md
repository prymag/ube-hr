# Phase 2 — Task 15: Backend Integration & API Documentation

**Status:** ✅ DONE
**Date:** 2026-03-29

---

## Summary

Task 15 completed full backend integration by wiring all modules into a single Express app, adding E2E test coverage for both auth and user management flows, and producing a complete documentation suite.

---

## 15.1 — App factory and module wiring (`src/app.ts`)

Refactored `src/app.ts` from a singleton module export to a `createApp(prisma: PrismaClient)` factory function. This enables dependency injection in tests without Jest module mocking.

**Wiring order inside `createApp`:**
1. Instantiate `AuthRepository(prisma)` and `AuthService(secrets, expiries)`
2. Build `authenticate` and `authorize(['ADMIN', 'SYSTEM_ADMIN'])` middleware
3. Instantiate `UsersRepository(prisma)`, `UsersService(repo, authService)`, `UsersController`
4. Mount routers:
   - `POST|GET /api/v1/auth/*` → `createAuthRouter(authController, authenticate)`
   - `POST|GET|PATCH|DELETE /api/v1/users/*` → `createUsersRouter(usersController, authenticate, authorize)`

**Database provider (`src/providers/database.ts`):**

Created a `createPrismaClient()` factory that works without the optional Prisma 7 driver adapter (which requires `@prisma/adapter-mariadb`). Uses a type cast to satisfy the TypeScript constructor signature while passing `datasourceUrl` directly. The setup guide documents how to add the MariaDB adapter for production.

**`src/server.ts`:** Updated to call `createPrismaClient()` then `createApp(prisma)`.

---

## 15.2–15.3 — End-to-end tests

### `src/__tests__/auth.e2e.test.ts` — 19 tests

Tests cover the full auth lifecycle against a mocked PrismaClient passed to `createApp`:

| Scenario | Result |
|----------|--------|
| `POST /auth/login` — valid credentials | 200 + token pair |
| `POST /auth/login` — wrong password | 401 |
| `POST /auth/login` — unknown email | 401 |
| `POST /auth/login` — validation errors | 400 |
| `GET /auth/me` — valid token | 200 + user object |
| `GET /auth/me` — missing token | 401 |
| `GET /auth/me` — expired/invalid token | 401 |
| `POST /auth/refresh` — valid token | 200 + new token pair |
| `POST /auth/refresh` — invalidated token | 401 |
| `POST /auth/refresh` — malformed token | 401 |
| `POST /auth/logout` — valid | 200 |
| `POST /auth/logout` — missing auth | 401 |
| Token reuse blocked after logout | 401 |
| Token reuse blocked after rotation | 401 |

**Key implementation detail:** bcrypt hash computed once in `beforeAll` to avoid per-test latency. JWT tokens for authenticated requests signed directly with the dev secret (`'dev-access-secret'`).

### `src/__tests__/users.e2e.test.ts` — 21 tests

Tests cover the full CRUD lifecycle for `/api/v1/users` with role-specific scenarios:

| Scenario | Result |
|----------|--------|
| `POST /users` as SYSTEM_ADMIN | 201 |
| `POST /users` as ADMIN | 201 |
| `POST /users` as USER | 403 |
| `POST /users` as ADMIN assigning ADMIN role | 403 |
| `POST /users` — duplicate email | 409 |
| `POST /users` — weak password | 400 |
| `GET /users` as ADMIN | 200 + paginated list |
| `GET /users` as USER | 403 |
| `GET /users` — unauthenticated | 401 |
| `PATCH /users/:id` as SYSTEM_ADMIN | 200 |
| `PATCH /users/:id` as ADMIN on SYSTEM_ADMIN | 403 |
| `PATCH /users/:id` — not found | 404 |
| `DELETE /users/:id` as SYSTEM_ADMIN | 204 |
| `DELETE /users/:id` as ADMIN | 204 |
| `DELETE /users/:id` — SYSTEM_ADMIN target | 403 |
| `DELETE /users/:id` — not found | 404 |

**`makeToken(role)` helper:** Signs a minimal JWT payload with the dev secret, used to inject any role into E2E requests without hitting the real login flow.

---

## 15.4 — OpenAPI 3.0 specification (`docs/api.yaml`)

Complete spec covering all 8 endpoints:

| Endpoint | Method | Auth | Roles |
|----------|--------|------|-------|
| `/auth/login` | POST | — | — |
| `/auth/refresh` | POST | — | — |
| `/auth/logout` | POST | Bearer | any authenticated |
| `/auth/me` | GET | Bearer | any authenticated |
| `/users` | POST | Bearer | ADMIN, SYSTEM_ADMIN |
| `/users` | GET | Bearer | ADMIN, SYSTEM_ADMIN |
| `/users/{id}` | PATCH | Bearer | ADMIN, SYSTEM_ADMIN |
| `/users/{id}` | DELETE | Bearer | ADMIN, SYSTEM_ADMIN |

Includes: request/response schemas, error response schemas, security scheme definitions, pagination query parameters, and all relevant HTTP status codes.

---

## 15.5 — Developer setup guide (`docs/auth-setup-guide.md`)

Step-by-step guide covering:
1. Clone and install
2. Environment variable configuration (JWT secrets, database URL)
3. Docker Compose startup (MySQL + phpMyAdmin + MailHog)
4. Prisma 7 MariaDB adapter setup
5. Database migration and seed
6. Dev server startup and smoke test
7. Manual cURL examples for all auth flows
8. Running the test suite
9. Link to OpenAPI spec

---

## 15.6 — Troubleshooting guide (`docs/auth-troubleshooting.md`)

13 documented issues with causes and fixes:
- `401` authorization header errors
- Token expiry and refresh flows
- Invalidated/reused token handling
- `403` RBAC errors (insufficient permissions, role escalation)
- `409` duplicate email
- `400` validation failures (login schema, password complexity)
- Database connection errors
- Jest `Cannot find module` for path aliases
- JWT secret mismatch between environments

Includes a diagnostic checklist for quick triage.

---

## 15.7 — Token strategy documentation (`docs/token-strategy.md`)

Documents the dual-token design:
- Access token (15 min, stateless, memory storage)
- Refresh token (7 days, in-memory invalidation Set, rotation on every use)
- ASCII lifecycle diagrams
- Trade-offs: stateless access = no revocation; short expiry mitigates stolen tokens
- Redis-backed invalidation example for production
- Client-side pseudocode (`AuthClient` class with auto-refresh on 401)
- Expiry configuration table (dev / prod / high-security / long-session)
- Security checklist

---

## Test counts at task completion

| Suite | Tests |
|-------|-------|
| auth.e2e | 19 |
| users.e2e | 21 |
| auth.routes | 15 |
| users.routes | 17 |
| auth.controller | 18 |
| users.controller | 25 |
| auth.service | 27 |
| users.service | 32 |
| auth.repository | 10 |
| users.repository | 21 |
| authenticate.middleware | 12 |
| authorize.middleware | 11 |
| password.validator | 16 |
| auth.schemas | 18 |
| users.schemas | 22 |
| **Total** | **284** |

All 284 tests passed. (Additional tests added in Task 16 brought the final total to 292.)
