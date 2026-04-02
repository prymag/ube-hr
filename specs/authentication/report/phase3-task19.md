# Report: Phase 3 - Task 19: Auth Manager (Token Storage & Expiration)

## Summary
Implemented `AuthManager` — a stateless class that wraps `localStorage` for JWT token persistence and provides local expiration checks without making network calls.

## Files Created
- `frontend/src/features/auth/services/AuthManager.ts` — Token management class + singleton
- `frontend/src/features/auth/__tests__/AuthManager.test.ts` — 14 unit tests

## Implementation Details

### Key Changes

**`AuthManager` class** — storage keys use a namespaced prefix (`ube_hr_access_token`, `ube_hr_refresh_token`) to avoid collisions with other apps on the same origin.

| Method | Description |
|--------|-------------|
| `storeTokens(tokens)` | Writes both tokens to localStorage |
| `getAccessToken()` | Retrieves access token or null |
| `getRefreshToken()` | Retrieves refresh token or null |
| `clearTokens()` | Removes both tokens (safe to call on logout) |
| `isTokenExpired(token)` | Decodes JWT payload, checks `exp` with 5s clock-skew buffer |
| `getTokenExpiryTime(token)` | Returns `exp * 1000` (ms epoch) or null |

**JWT payload decoding** is done locally with `atob()` — no network call or third-party library needed. Treats tokens with missing/undecodable `exp` as expired (fail-safe).

**`authManager` singleton** is exported for convenience; consumers can also `new AuthManager()`.

## Tests
- 14 tests in `AuthManager.test.ts` — all pass
- Used a `vi.fn()`-backed localStorage mock (jsdom in this Vitest version lacks `localStorage.clear()`)
- Covers: storeTokens, getAccessToken/getRefreshToken (present/absent), clearTokens, isTokenExpired (valid/expired/no-exp/malformed), getTokenExpiryTime (valid/no-exp/malformed)

## Verification
```
npm run test:run -- src/features/auth/__tests__/AuthManager.test.ts
Tests: 14 passed
```

## Notes
- 5-second clock-skew buffer in `isTokenExpired` prevents edge-case race conditions where a token expires between the check and the API call
- `atob` is available in jsdom; uses URL-safe base64 variant (replaces `-` → `+`, `_` → `/`) per RFC 7515
