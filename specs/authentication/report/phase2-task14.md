# Report: Phase 2 - Task 14: User Management Routes Layer

## Summary
Implemented `createUsersRouter` with four routes, each protected by injectable `authenticate` and `authorize` middleware. All routes follow the established auth module pattern. Route-level error handler catches synchronous throws. Module `index.ts` updated with all public exports.

## Files Created
- `backend/src/modules/users/users.routes.ts` — createUsersRouter factory
- `backend/src/modules/users/__tests__/users.routes.test.ts` — 17 integration tests

## Files Modified
- `backend/src/modules/users/index.ts` — Added `UsersController` and `createUsersRouter` exports
- `specs/authentication/tasks.md` — Task 14 marked ✅ DONE

## Implementation Details

### Routes

| Method | Path | Middleware | Handler |
|--------|------|------------|---------|
| POST | `/api/v1/users` | authenticate → authorize | `controller.createUser` |
| GET | `/api/v1/users` | authenticate → authorize | `controller.listUsers` |
| PATCH | `/api/v1/users/:userId` | authenticate → authorize | `controller.updateUser` |
| DELETE | `/api/v1/users/:userId` | authenticate → authorize | `controller.deleteUser` |

### Router factory signature
```ts
export function createUsersRouter(
  controller: UsersController,
  authenticate: RequestHandler,  // JWT verification
  authorize: RequestHandler,     // role check — caller pre-configures for ADMIN/SYSTEM_ADMIN
): Router
```

The `authorize` parameter is injected pre-configured (e.g. `authorize(['ADMIN', 'SYSTEM_ADMIN'])`) by the app composition root, keeping the router independent of role configuration.

### Route-level error handler
Same pattern as `auth.routes.ts` — catches unhandled synchronous throws from handlers and returns `{ error: 'Internal server error' }` with status 500.

## Tests
- **File:** `__tests__/users.routes.test.ts`
- **Tests:** 17 / **Passed:** 17 / **Failed:** 0

| Suite | Tests |
|-------|-------|
| POST /api/v1/users | 4 (routes to controller, 401 no auth, 403 no authz, GET still hits listUsers) |
| GET /api/v1/users | 5 (routes to controller, passes query params, 401, 403, 404 unknown method) |
| PATCH /api/v1/users/:userId | 4 (routes to controller, 401, 403, 404 wrong method) |
| DELETE /api/v1/users/:userId | 3 (routes to controller, 401, 403) |
| Route error handler | 1 (synchronous throw → 500 Internal server error) |

## Verification
- `npx jest --testPathPatterns="users.routes" --no-coverage` → 17/17 pass

## Notes
- The `console.error` output in the error-handler test is expected and confirms the handler is firing correctly.
- `authorize` is accepted as an opaque `RequestHandler` — the router does not import `authorize` from the auth module. This keeps the users module loosely coupled.
