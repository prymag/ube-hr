# Report: Phase 3 - Task 24: Frontend Integration with Backend

## Summary
Wired all auth components into a working application: routing, session initialization on mount, automatic 401→refresh→retry interceptor, and full integration tests covering the login/logout/protected-route flows.

## Files Modified
- `frontend/src/app/App.jsx` — Added `BrowserRouter`, `AuthProvider`, `AppRoutes`
- `frontend/src/features/auth/index.ts` — Added all new exports (AuthManager, useAuthStore, useAuth, views)

## Files Created
- `frontend/src/app/providers/AuthProvider.tsx` — Initialization + 401 interceptor
- `frontend/src/app/routes/index.tsx` — Route definitions
- `frontend/src/features/auth/__tests__/integration.test.tsx` — 8 integration tests

## Implementation Details

### `AuthProvider`
Runs two effects on mount:
1. **Token refresh interceptor** — attached to `authRepository.http` via `addResponseInterceptor`:
   - Catches 401 responses
   - Reads stored refresh token from `authManager`
   - Calls `authRepository.refresh()` and stores new tokens
   - Retries the original request with the new `Authorization` header
   - On refresh failure: clears tokens + calls `logoutStore()`
   - Uses a `_retried` flag to prevent infinite retry loops
   - Interceptor is ejected on unmount via cleanup function

2. **Session initialization** — calls `useAuth().initialize()` to restore an existing session from stored tokens (handles expired-but-refreshable access tokens)

### `AppRoutes`
| Path | Component | Protection |
|------|-----------|------------|
| `/login` | `LoginView` | Public |
| `/` | Dashboard placeholder | `ProtectedRoute` |
| `/unauthorized` | Error page | Public |
| `*` | → `/login` | Public (catch-all) |

### `App.jsx` composition
```jsx
<BrowserRouter>
  <AuthProvider>      ← sets up interceptor + initializes session
    <AppRoutes />     ← route definitions
  </AuthProvider>
</BrowserRouter>
```

### Automatic 401 handling
When any call through `authRepository.http` receives a 401:
```
401 response
  → _retried not set
  → read refreshToken from authManager
  → call authRepository.refresh(refreshToken)
  → storeTokens(newTokens)
  → retry original request with new Authorization header
  → if refresh fails: clearTokens + logoutStore
```

### Network error display
`useAuth.login` catches all errors (`AuthApiError`, `NetworkError`, or generic `Error`) and sets `store.error = err.message`. `LoginForm` renders this in a `role="alert"` banner — covers both network and API errors.

## Tests (8)
| Group | Tests |
|-------|-------|
| Login flow | Successful submit calls API; displays network error; displays API error |
| Protected route access | Unauthenticated → redirect to /login; authenticated → renders content |
| Logout flow | `logout()` action clears store state |
| Token persistence | Authenticated user sees content immediately (no flicker); loading spinner shown when isLoading |

## Verification
```
npm run test:run -- src/features/auth/
Test Files: 8 passed
     Tests: 83 passed
```

## Notes
- `AuthProvider` must be rendered inside `BrowserRouter` (needs `useNavigate` via `useAuth`)
- The `_retried` flag is set on the raw axios config object to prevent retry loops
- `ejectResponseInterceptor` is called on AuthProvider unmount to prevent memory leaks
- `jsdom` dev dependency was added (`npm install --save-dev jsdom`) to support Vitest's jsdom test environment
