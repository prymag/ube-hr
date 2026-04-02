# Report: Phase 3 - Task 21: Custom Auth Hook

## Summary
Implemented `useAuth` — the central hook that orchestrates all authentication flows by wiring together `AuthRepository` (API), `AuthManager` (tokens), and `authStore` (state).

## Files Created
- `frontend/src/features/auth/hooks/useAuth.ts` — Custom hook
- `frontend/src/features/auth/__tests__/useAuth.test.tsx` — 13 tests

## Implementation Details

### Data flow
```
Component → useAuth → {
  AuthRepository  (API calls)
  AuthManager     (localStorage token r/w)
  authStore       (Zustand state updates)
  useNavigate     (routing after login/logout)
}
```

### Exported functions

| Function | Description |
|----------|-------------|
| `login(email, password)` | Calls API, stores tokens, sets user in store, navigates to `/` |
| `logout()` | Calls logout API (best-effort), clears tokens, resets store, navigates to `/login` |
| `refreshToken()` | Exchanges refresh token for new pair; returns `boolean` success flag |
| `initialize()` | Called on app mount — restores session from stored tokens; refreshes if access token is expired |

### Error handling
- `login`: any error → `setError(message)` in store; `isLoading` always reset in `finally`
- `logout`: API errors are swallowed — local session is always cleared regardless
- `refreshToken`: on failure → clears tokens + calls `logoutStore()` (no navigation — caller decides)
- `initialize`: on any error → clears tokens + calls `logoutStore()`

### `initialize` sequence
```
1. getAccessToken() → none → return early
2. isTokenExpired? → yes → refreshToken() → fail → return
3. getCurrentUser(token) → setUser + setAccessTokenExpiryTime
4. any error → clearTokens + logout
```

## Tests
- 13 tests across login / logout / refreshToken / initialize scenarios — all pass
- Uses `vi.mock` for `authRepository` and `authManager`; `MemoryRouter` wrapper for `useNavigate`
- Tests verify correct API calls, store mutations, and error propagation

## Verification
```
npm run test:run -- src/features/auth/__tests__/useAuth.test.tsx
Tests: 13 passed
```

## Notes
- `logout` never throws — intentional; always safe to call
- `refreshToken` returns `boolean` so callers (interceptor, initialize) can branch without catching
- All callbacks are `useCallback`-memoized to prevent unnecessary re-renders
