# Report: Phase 2 - Task 7: Auth Controller Layer

## Summary
Implemented `AuthController` class with four endpoint handlers for login, token refresh, logout, and current-user retrieval. All handlers validate inputs via Zod schemas before delegating to `AuthService`. Comprehensive error handling maps service errors to appropriate HTTP status codes.

## Files Modified
_(none)_

## Files Created
- `backend/src/modules/auth/auth.controller.ts` — AuthController class with 4 handlers
- `backend/src/modules/auth/__tests__/auth.controller.test.ts` — 20 unit tests

## Implementation Details

### Key Changes

**`auth.controller.ts`** exports:

| Export | Description |
|--------|-------------|
| `AuthenticatedRequest` | Express `Request` extended with `user?: TokenPayload` |
| `AuthController` | Class with `login`, `refresh`, `logout`, `getCurrentUser` |

**Handler overview:**

| Handler | Route | Validation | Success | Error codes |
|---------|-------|------------|---------|-------------|
| `login` | `POST /auth/login` | `loginSchema` | 200 + user + tokens | 400 validation, 401 bad creds, 500 server |
| `refresh` | `POST /auth/refresh` | `refreshTokenSchema` | 200 + tokens | 400 validation, 401 expired/invalid/invalidated, 500 server |
| `logout` | `POST /auth/logout` | `refreshTokenSchema` | 200 + message | 400 validation, 500 server |
| `getCurrentUser` | `GET /auth/me` | `req.user` presence | 200 + user payload | 401 unauthenticated |

**Error mapping (`refresh`):**
Errors containing `expired`, `invalid`, `invalidated`, `Invalid`, or `not found` map to 401; all others to 500.

**`AuthenticatedRequest` interface:**
Extends Express `Request` so that the authenticate middleware (Task 9) can attach `req.user: TokenPayload`. Used by `getCurrentUser`.

### Architecture
- Controller depends on `AuthService` via constructor injection (testable)
- Arrow-function methods (`login = async (req, res) =>`) preserve `this` context when passed to Express router

## Tests
- **File:** `src/modules/auth/__tests__/auth.controller.test.ts`
- **Tests run:** 20
- **Result:** ✅ All passed

### Test Breakdown
| Describe block | Tests |
|----------------|-------|
| `AuthController.login` | 7 |
| `AuthController.refresh` | 7 |
| `AuthController.logout` | 4 |
| `AuthController.getCurrentUser` | 2 |

**Patterns used:**
- `jest.fn()` mock service with `mockResolvedValue` / `mockRejectedValue`
- `res.status.mockReturnValue(res)` enables chaining assertions
- All error paths (validation, auth errors, unexpected errors) covered

## Verification
- `npx jest src/modules/auth/__tests__/auth.controller.test.ts` → 20/20 passed
- TypeScript compiles cleanly (arrow methods, `AuthenticatedRequest` extension)

## Notes
- `getCurrentUser` returns the `TokenPayload` from the JWT rather than fetching from DB — sufficient for stateless auth; a DB fetch can be added later if full profile is needed
- `logout` validates `refreshToken` presence; the authenticate middleware is not required for logout (user may already have an expired access token)
