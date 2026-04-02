# Report: Phase 3 - Task 18: Auth Repository (API Integration)

## Summary
Implemented `AuthRepository`, the frontend API client class responsible for all HTTP communication with the backend auth endpoints (`/login`, `/refresh`, `/logout`, `/me`). Includes typed error classes (`AuthApiError`, `NetworkError`) and a full test suite using MSW for request interception.

## Files Modified
- `frontend/src/features/auth/index.ts` — Exported `AuthRepository`, `authRepository`, `AuthApiError`, `NetworkError`
- `frontend/package.json` / `package-lock.json` — Added `jsdom` dev dependency (required by Vitest jsdom environment)

## Files Created
- `frontend/src/features/auth/services/AuthRepository.ts` — API client class
- `frontend/src/features/auth/__tests__/AuthRepository.test.ts` — 12 repository tests using MSW

## Implementation Details

### Key Changes

#### `AuthRepository` class (`services/AuthRepository.ts`)
- Wraps an `axios` instance scoped to `${VITE_API_URL}/api/v1/auth`
- Base URL resolves via `import.meta.env.VITE_API_URL` with fallback to `http://localhost:5000`
- All methods are `async` and throw typed errors on failure

| Method | HTTP | Endpoint | Returns |
|--------|------|----------|---------|
| `login(email, password)` | POST | `/login` | `LoginResponse` |
| `refresh(refreshToken)` | POST | `/refresh` | `AuthTokens` |
| `logout(refreshToken)` | POST | `/logout` | `void` |
| `getCurrentUser(accessToken)` | GET | `/me` | `User` |

#### Error normalisation (`private normalise`)
- `AxiosError` with a response → `AuthApiError(message, statusCode, code)`
- `AxiosError` without a response (network down) → `NetworkError`
- Any other `Error` → `NetworkError`

#### Error types
```ts
class AuthApiError extends Error {
  statusCode: number
  code?: string
}

class NetworkError extends Error {}
```

#### Singleton export
```ts
export const authRepository = new AuthRepository()
```
Consumers can import the singleton or instantiate `new AuthRepository(customBaseURL)` for testing.

#### `getCurrentUser` — token injection
Passes the access token as `Authorization: Bearer <token>` per request header (not stored on the axios instance), keeping the repository stateless.

## Tests
**File:** `__tests__/AuthRepository.test.ts` — 12 tests, all pass

| Suite | Tests |
|-------|-------|
| `login` — success | Returns user + tokens |
| `login` — invalid credentials | Throws `AuthApiError(401)` with code `INVALID_CREDENTIALS` |
| `login` — network error | Throws `NetworkError` |
| `refresh` — valid token | Returns new token pair |
| `refresh` — invalid token | Throws `AuthApiError(401)` with code `INVALID_TOKEN` |
| `logout` — success | Resolves `undefined` |
| `logout` — network error | Throws `NetworkError` |
| `getCurrentUser` — valid token | Returns `User` object |
| `getCurrentUser` — invalid token | Throws `AuthApiError(401)` |
| `AuthApiError` shape | name, message, statusCode, code |
| `NetworkError` shape | name, default message |
| `NetworkError` custom message | Accepts custom string |

**Runner:** Vitest + MSW (`setupServer`) intercepting real HTTP calls in a `node` environment.

## Verification
```
npm run test:run -- src/features/auth/
```
```
Test Files  2 passed (2)
     Tests  22 passed (22)
```

## Notes
- `jsdom` was missing from devDependencies and was installed (`npm install --save-dev jsdom`)
- MSW `setupServer` is used (not `setupWorker`) because tests run in Node, not a browser
- The `onUnhandledRequest: 'error'` flag ensures tests fail fast if an unexpected route is hit
- `authRepository` singleton uses `VITE_API_URL` — set this in `.env.local` for development
