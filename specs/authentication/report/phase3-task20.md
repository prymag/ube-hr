# Report: Phase 3 - Task 20: Auth State Management (Zustand Store)

## Summary
Implemented the Zustand auth store with `persist` middleware for session restoration across page reloads. Only `user` and `isAuthenticated` are persisted; transient states (`isLoading`, `error`, `accessTokenExpiryTime`) reset on reload.

## Files Created
- `frontend/src/features/auth/store/authStore.ts` — Zustand store with persist
- `frontend/src/features/auth/__tests__/authStore.test.ts` — 9 action tests

## Implementation Details

### State shape
```ts
user: User | null               // authenticated user object
isAuthenticated: boolean        // derived from user !== null
isLoading: boolean              // async operation in progress
error: string | null            // last error message
accessTokenExpiryTime: number | null  // ms epoch, for UI indicators
```

### Actions
| Action | Effect |
|--------|--------|
| `setUser(user)` | Sets user; `isAuthenticated` = `user !== null` |
| `setLoading(bool)` | Toggles loading state |
| `setError(string\|null)` | Sets/clears error message |
| `setAccessTokenExpiryTime(ms\|null)` | Stores token expiry for UI |
| `logout()` | Clears user, isAuthenticated, error, accessTokenExpiryTime |

### Persistence
- Uses `zustand/middleware` `persist` + `createJSONStorage(() => localStorage)`
- Storage key: `ube-hr-auth`
- `partialize` only persists `{ user, isAuthenticated }` — loading/error states never survive reload

## Tests
- 9 tests — all pass
- Used `vi.mock('zustand/middleware', ...)` to make `persist` a pass-through (jsdom localStorage doesn't support Zustand's internal storage API in this Vitest version)
- Tests cover all state transitions including `logout` and edge cases

## Verification
```
npm run test:run -- src/features/auth/__tests__/authStore.test.ts
Tests: 9 passed
```
