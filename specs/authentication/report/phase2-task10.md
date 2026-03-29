# Report: Phase 2 - Task 10: Authorization Middleware (Role-Based Access)

## Summary
Implemented `authorize` middleware factory for role-based access control. The middleware accepts a single role or an array of roles, checks the authenticated user's role from `req.user` (set by `authenticate` middleware), and responds with 401/403 as appropriate. All subtasks including usage documentation (JSDoc) complete.

## Files Modified
- `backend/src/modules/auth/index.ts` — Added `authorize` export

## Files Created
- `backend/src/modules/auth/authorize.middleware.ts` — Role-checking middleware factory
- `backend/src/modules/auth/__tests__/authorize.middleware.test.ts` — 11 unit tests

## Implementation Details

### Key Changes

**`authorize.middleware.ts`**
```ts
export function authorize(requiredRoles: Role | Role[]) {
  const roles: Role[] = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const userRole = req.user.role as Role | undefined;

    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({ error: 'Forbidden: insufficient permissions' });
      return;
    }

    next();
  };
}
```

- Accepts `Role | Role[]` (single string or array) for flexible usage
- Returns 401 if `req.user` is absent (middleware called without `authenticate`)
- Returns 403 if user's role is not in the required roles list
- Calls `next()` only when role check passes
- JSDoc block documents single-role and array-role usage patterns

## Tests
- **Test file:** `__tests__/authorize.middleware.test.ts`
- **Tests run:** 11 / **Passed:** 11 / **Failed:** 0
- Coverage areas:
  - 401 when `req.user` is not set
  - Single role: matching role calls `next()`
  - Single role: non-matching role returns 403
  - SYSTEM_ADMIN required — allows/denies correctly
  - Array roles: matching role calls `next()`
  - Array roles: non-matching role returns 403
  - Missing role field on payload returns 403
  - USER role allowed when listed
  - All three roles allowed when all listed in array

## Verification
- `npx jest --testPathPatterns="authorize.middleware" --no-coverage` → 11/11 pass
- Middleware exported from `modules/auth/index.ts` public API

## Notes
- Middleware must be chained after `authenticate` to have `req.user` populated
- Role values are validated against the `Role` type from `auth.validator.ts` (SYSTEM_ADMIN, ADMIN, USER)
- No runtime Zod parsing needed; role values in the JWT payload are already typed
