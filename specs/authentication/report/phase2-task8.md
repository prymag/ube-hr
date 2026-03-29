# Report: Phase 2 - Task 8: Auth Routes Layer

## Summary
Implemented the auth Express router using a factory function pattern (`createAuthRouter`). All four authentication routes are defined with correct HTTP methods, public/protected access levels, and a route-level error handler. `index.ts` was updated to export all auth module artifacts. Route integration tests verify routing, middleware enforcement, and error handling.

## Files Modified
- `backend/src/modules/auth/index.ts` — Added exports for `AuthController`, `AuthenticatedRequest`, all validator schemas/types, and `createAuthRouter`

## Files Created
- `backend/src/modules/auth/auth.routes.ts` — Express router factory with 4 routes + error handler
- `backend/src/modules/auth/__tests__/auth.routes.test.ts` — 13 route integration tests
- `package.json` / `package-lock.json` — Added `supertest` and `@types/supertest` dev dependencies

## Implementation Details

### Key Changes

**`auth.routes.ts`** — Factory function `createAuthRouter(controller, authenticate)`:

| Route | Method | Auth Required | Handler |
|-------|--------|--------------|---------|
| `/login` | POST | No | `controller.login` |
| `/refresh` | POST | No | `controller.refresh` |
| `/logout` | POST | Yes | `controller.logout` |
| `/me` | GET | Yes | `controller.getCurrentUser` |

**Design decisions:**
- **Factory function pattern** — `createAuthRouter(controller, authenticate)` accepts middleware as a parameter rather than importing directly from `authenticate.middleware.ts`. This keeps Task 8 independent of Task 9's implementation, enables easy testing with mock middleware, and follows dependency injection principles.
- **Route-level error handler** — `routeErrorHandler` is the last `router.use()` entry; catches any synchronous throws from handlers and returns `500 Internal Server Error`.
- **Validation** — Handled inside each controller method via Zod schemas (no separate validation middleware needed).

**`index.ts` additions:**
- `AuthController`, `AuthenticatedRequest`
- All validator schemas (`loginSchema`, `refreshTokenSchema`, `createUserSchema`, `updateUserSchema`, `RoleEnum`) and inferred types
- `createAuthRouter`

### Dependency added
- `supertest` + `@types/supertest` — HTTP integration testing for Express

## Tests
- **File:** `src/modules/auth/__tests__/auth.routes.test.ts`
- **Tests run:** 13
- **Result:** ✅ All passed

### Test Breakdown
| Describe block | Tests |
|----------------|-------|
| `POST /api/v1/auth/login` | 3 |
| `POST /api/v1/auth/refresh` | 3 |
| `POST /api/v1/auth/logout` | 3 |
| `GET /api/v1/auth/me` | 3 |
| Route-level error handler | 1 |

**Test strategy:**
- `allowAuth` stub (calls `next()`) simulates authenticated requests
- `denyAuth` stub (returns 401) simulates rejected authentication
- Protected routes verify that `denyAuth` blocks controller invocation
- Public routes verify that `denyAuth` does NOT block them (authenticate not applied)
- Wrong HTTP method tests confirm 404 responses

## Verification
- `npx jest src/modules/auth/__tests__/auth.routes.test.ts` → 13/13 passed
- `console.error` in error handler test is expected and confirms the handler fires correctly

## Notes
- The `authenticate` middleware is injected at router creation time — when Task 9 implements `authenticate.middleware.ts`, it is passed in during app bootstrap (Task 15)
- `routeErrorHandler` only catches synchronous throws; async errors in arrow-function handlers are caught internally by the handlers themselves (Task 7 pattern)
