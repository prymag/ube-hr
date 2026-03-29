# Report: Phase 2 - Task 9: Authentication Middleware

## Summary
Implemented the `authenticate` Express middleware that verifies JWT access tokens from the `Authorization` header and attaches the decoded user payload to `req.user`. All 8 unit tests pass.

## Files Modified
- `backend/src/modules/auth/index.ts` — Added export for `authenticate`

## Files Created
- `backend/src/modules/auth/authenticate.middleware.ts` — JWT authentication middleware
- `backend/src/modules/auth/__tests__/authenticate.middleware.test.ts` — 8 unit tests

## Implementation Details

### Key Changes

**`authenticate.middleware.ts`**

The middleware is exported as a factory function `authenticate(authService?)` that returns an Express `RequestHandler`. This allows injecting a custom `AuthService` instance (e.g., during tests) while defaulting to a module-level singleton.

Flow:
1. Read the `Authorization` header.
2. Reject (401) if missing or not prefixed with `Bearer `.
3. Extract the token (strip the 7-char `"Bearer "` prefix).
4. Reject (401) if the token string is empty.
5. Call `authService.verifyAccessToken(token)`.
6. On success: assign payload to `req.user` and call `next()`.
7. On error: return 401 with `"Token has expired"` if the message contains "expired", otherwise `"Invalid token"`.

```typescript
export function authenticate(authService: AuthService = defaultAuthService) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header missing or malformed' });
      return;
    }
    const token = authHeader.slice(7);
    if (!token) {
      res.status(401).json({ error: 'Token is missing' });
      return;
    }
    try {
      const payload = await authService.verifyAccessToken(token);
      req.user = payload;
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      const isExpired = message.includes('expired');
      res.status(401).json({ error: isExpired ? 'Token has expired' : 'Invalid token' });
    }
  };
}
```

## Tests
- **File:** `__tests__/authenticate.middleware.test.ts`
- **Suite:** `authenticate middleware` — **8 tests, all passing**

| Test | Result |
|---|---|
| calls next() and sets req.user on valid token | ✅ |
| returns 401 when Authorization header is missing | ✅ |
| returns 401 when Authorization header does not start with Bearer | ✅ |
| returns 401 when Bearer token is empty | ✅ |
| returns 401 with "Token has expired" for expired token | ✅ |
| returns 401 with "Invalid token" for bad signature | ✅ |
| returns 401 with "Invalid token" on unexpected error | ✅ |
| attaches full payload (userId, email, role) to req.user | ✅ |

```
Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

## Verification
- Ran `npx jest --testPathPatterns="authenticate.middleware" --no-coverage` — all 8 tests pass.
- `AuthService.verifyAccessToken` is injected via constructor for full testability without mocking modules.

## Notes
- The middleware reuses `AuthenticatedRequest` (defined in `auth.controller.ts`) to type `req.user`, avoiding duplicate interface definitions.
- A module-level `defaultAuthService` instance is created once and shared for production use — no per-request instantiation overhead.
- Error discrimination (expired vs. invalid) mirrors the error messages thrown by `AuthService.verifyAccessToken`.
