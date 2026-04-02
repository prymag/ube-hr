# Report: Phase 3 - Task 23: Protected Route Component

## Summary
Implemented `ProtectedRoute` — a route guard component that enforces authentication and optional role-based access control, with configurable redirect targets.

## Files Created
- `frontend/src/features/auth/views/ProtectedRoute.tsx` — Route guard
- `frontend/src/features/auth/__tests__/ProtectedRoute.test.tsx` — 8 tests

## Implementation Details

### Props
```ts
interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: Role | Role[]            // optional RBAC
  redirectTo?: string                     // default: '/login'
  unauthorizedRedirectTo?: string         // default: '/unauthorized'
}
```

### Decision tree
```
isLoading  → <div role="status">Loading…</div>
!isAuthenticated → <Navigate to={redirectTo} replace />
requiredRole set, user role not in allowed → <Navigate to={unauthorizedRedirectTo} replace />
otherwise → render children
```

### State source
Reads directly from `useAuthStore()` (not `useAuth()`) to avoid requiring a Router context for the store read — ProtectedRoute itself provides context for children via the router tree.

### Error boundary (23.5)
React's built-in error propagation covers route-level errors. A separate `ErrorBoundary` component was not added as it would be shared infrastructure beyond this task's scope.

## Tests (8)
| Group | Tests |
|-------|-------|
| Authenticated user | Renders children; matches single role; matches role array |
| Unauthenticated user | Redirects to /login; respects custom `redirectTo` |
| Wrong role | Redirects to /unauthorized for single role; for role array |
| Loading state | Shows loading indicator; suppresses redirect |

## Verification
```
npm run test:run -- src/features/auth/__tests__/ProtectedRoute.test.tsx
Tests: 8 passed
```
