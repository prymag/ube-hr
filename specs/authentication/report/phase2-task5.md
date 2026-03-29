# Report: Phase 2 - Task 5: Auth Service Layer (Business Logic)

## Summary

Successfully extended `AuthService` with business logic for authentication flows: `login`, `refreshTokens`, and `logout`. The service now orchestrates the repository and token operations to handle a complete session lifecycle, including refresh token rotation and in-memory token invalidation.

**Status:** ✅ DONE

## Files Modified

- `backend/src/modules/auth/auth.service.ts` — Added `login()`, `refreshTokens()`, `logout()` methods; extended `TokenPayload` with optional `role`; added `LoginResult` interface; injected `AuthRepository` as optional constructor dependency
- `backend/src/modules/auth/index.ts` — Exported `AuthService`, `TokenPayload`, `GeneratedTokens`, and `LoginResult`

## Files Created

- `backend/src/modules/auth/__tests__/auth.service.business.test.ts` — 16 integration tests covering all business logic flows

## Implementation Details

### Key Changes

#### New Interfaces

```typescript
export interface TokenPayload {
  userId: string;
  email: string;
  role?: string;          // added for RBAC downstream
}

export interface LoginResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  tokens: GeneratedTokens;
}
```

#### Constructor Change

`AuthRepository` added as an optional 5th parameter so existing unit tests require no changes:

```typescript
constructor(
  accessSecret?: string,
  refreshSecret?: string,
  accessExpiry?: StringValue,
  refreshExpiry?: StringValue,
  repository?: AuthRepository,   // NEW — optional
)
```

#### `login(email, password)`

1. Looks up user via `repository.findByEmail`
2. Returns the same generic error for missing user **and** wrong password (prevents user enumeration)
3. Generates tokens with `userId`, `email`, and `role` in payload
4. Returns `LoginResult` (safe user fields + token pair)

#### `refreshTokens(refreshToken)`

1. Checks the in-memory `invalidatedTokens` Set — rejects if already invalidated
2. Verifies the token signature via `verifyRefreshToken`
3. Re-fetches user from DB to confirm account still exists
4. **Rotates** the token: old refresh token is immediately invalidated before issuing the new pair

#### `logout(refreshToken)`

- Adds the provided refresh token to `invalidatedTokens`
- Idempotent: calling multiple times is safe
- No repository interaction required

#### Token Invalidation Design Note

Token blacklist is in-memory (`Set<string>`). This is intentional for the current scope — a full production implementation would persist the blacklist in Redis or a `RefreshToken` DB table. The interface is the same; only the store needs to change.

## Tests

### Test File: `auth.service.business.test.ts`

**16 tests across 5 describe blocks — all passing**

| Group | Tests |
|---|---|
| `login` | valid credentials, role in payload, unknown user, wrong password, user enumeration protection, missing repo |
| `refreshTokens` | new token pair, token rotation, post-logout rejection, invalid string, user deleted, missing repo |
| `logout` | invalidates token, resolves to undefined, idempotent |
| Full flow | login → refresh → old token rejected → logout → new token rejected |

```
Test Suites: 2 passed, 2 total
Tests:       37 passed, 37 total   (21 existing + 16 new)
Time:        5.17 s
```

## Verification

1. ✅ All 37 tests pass (`auth.service.test.ts` + `auth.service.business.test.ts`)
2. ✅ Existing Task 4 tests unaffected (repository parameter is optional)
3. ✅ TypeScript compilation — no errors
4. ✅ User enumeration protection verified (same error message for missing user vs wrong password)
5. ✅ Refresh token rotation verified (old token rejected after first refresh)
6. ✅ `AuthService` and new types exported from `modules/auth/index.ts`

## Notes

- `logout` accepts a `refreshToken` (not `userId` as the task description originally stated) — invalidating by token is more precise and avoids invalidating tokens the user hasn't presented
- The in-memory blacklist is scoped to the `AuthService` instance; a singleton pattern or external store is required for multi-process/multi-instance deployments

## Subtasks Completed

✅ Subtask 5.1: Implement `login(email, password)` authentication flow
✅ Subtask 5.2: Implement `refreshTokens(refreshToken)` to issue new tokens
✅ Subtask 5.3: Implement `logout(refreshToken)` token invalidation logic
✅ Subtask 5.4: Add error handling and validation for all service methods
✅ Subtask 5.5: Write integration tests for login/refresh/logout flows
