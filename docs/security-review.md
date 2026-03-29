# Backend Security Review

**Scope:** JWT-based authentication and user management (Phase 2, Tasks 3–16)
**Date:** 2026-03-29
**Status:** Passed — no critical findings

---

## 1. Password hashing

### Implementation

`AuthService.hashPassword` uses **bcryptjs** with a configurable `saltRounds` parameter that defaults to `10`:

```ts
async hashPassword(password: string, saltRounds = 10): Promise<string> {
  if (saltRounds < 10) {
    throw new Error('Salt rounds must be at least 10 for security');
  }
  return bcrypt.hash(password, saltRounds);
}
```

### Review findings

| Check | Result | Notes |
|-------|--------|-------|
| Salt rounds ≥ 10 | ✅ Pass | Enforced at runtime; values below 10 throw |
| Unique salt per hash | ✅ Pass | bcrypt generates a random salt automatically |
| Timing-safe comparison | ✅ Pass | `bcrypt.compare` is constant-time |
| Plaintext password ever logged | ✅ Pass | Password is not logged anywhere |
| Plaintext password returned to client | ✅ Pass | `AuthService.login` returns only user fields + tokens |
| Password field excluded from list API | ✅ Pass | `UsersRepository.findAll` uses explicit `select` that omits `password` |
| Password field excluded from service responses | ✅ Pass | `UsersService.stripPassword` removes it from all returned objects |

### Recommendations

- Consider increasing `saltRounds` to **12** in production for additional brute-force resistance (adds ~300 ms per hash on modern hardware — acceptable for login flows).
- Optionally add Argon2id as an alternative hashing algorithm for new deployments.

---

## 2. JWT secret generation and storage

### Implementation

Secrets are read from environment variables with dev fallbacks:

```ts
const authService = new AuthService(
  process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
  process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  ...
);
```

### Review findings

| Check | Result | Notes |
|-------|--------|-------|
| Secrets in env vars, not source code | ✅ Pass | Loaded from `process.env`; `.env` is gitignored |
| Access and refresh secrets are separate | ✅ Pass | Separate env vars; avoids secret reuse |
| Weak dev fallbacks documented | ⚠️ Warning | `'dev-access-secret'` and `'dev-refresh-secret'` are intentionally weak — clearly marked as dev-only |
| `.env` file in `.gitignore` | ✅ Pass | Verified |
| `.env.example` has no real values | ✅ Pass | Contains only placeholder comments |
| Secrets not logged | ✅ Pass | No logging of JWT secrets anywhere |
| Minimum recommended secret length | ⚠️ Advisory | Enforce ≥ 32 bytes at startup (see recommendation) |

### Recommendations

Add a startup validation check in `server.ts` or `providers/database.ts`:

```ts
function validateSecrets(): void {
  const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if ((process.env.JWT_ACCESS_SECRET?.length ?? 0) < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
  }
  if ((process.env.JWT_REFRESH_SECRET?.length ?? 0) < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters');
  }
}
```

Generate secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 3. Token expiration and refresh mechanisms

### Review findings

| Check | Result | Notes |
|-------|--------|-------|
| Access token has short expiry | ✅ Pass | Default 15 min via `JWT_ACCESS_EXPIRY` |
| Refresh token has bounded expiry | ✅ Pass | Default 7 days via `JWT_REFRESH_EXPIRY` |
| Token rotation on refresh | ✅ Pass | Old refresh token invalidated immediately after use |
| Expired token correctly rejected | ✅ Pass | `TokenExpiredError` caught; returns 401 |
| Tampered token correctly rejected | ✅ Pass | `JsonWebTokenError` caught; returns 401 |
| Error message doesn't leak internals | ✅ Pass | Returns `'Token has expired'` or `'Invalid token'` only |
| Refresh token reuse detected | ✅ Pass | In-memory `invalidatedTokens` Set blocks reused tokens |
| Token invalidation survives server restart | ⚠️ Advisory | In-memory store is cleared on restart — see token-strategy.md for Redis recommendation |

---

## 4. Sensitive data handling

### Review findings

| Check | Result | Notes |
|-------|--------|-------|
| Password never returned by any endpoint | ✅ Pass | `stripPassword` applied in all service methods |
| Password excluded from `findAll` DB query | ✅ Pass | `select` object explicitly omits `password` field |
| JWT payload contains minimal claims | ✅ Pass | Only `userId`, `email`, `role` — no sensitive data |
| `req.user` payload never echoed raw to client | ✅ Pass | Only safe fields returned from `/auth/me` |
| Error messages don't reveal user existence | ✅ Pass | Login returns identical error for wrong password vs unknown email |
| SQL injection surface | ✅ Pass | All DB access via Prisma ORM parameterised queries |
| Input validation before service calls | ✅ Pass | Zod schemas validated in every controller before delegation |
| SYSTEM_ADMIN deletion blocked | ✅ Pass | Repository-level guard; cannot be bypassed by service/controller |

---

## 5. Role-based access control

| Check | Result | Notes |
|-------|--------|-------|
| All user management routes require auth | ✅ Pass | `authenticate` middleware on every `/api/v1/users` route |
| All user management routes require ADMIN+ | ✅ Pass | `authorize(['ADMIN','SYSTEM_ADMIN'])` on every route |
| ADMIN cannot escalate roles | ✅ Pass | Service rejects role assignment to ADMIN/SYSTEM_ADMIN by ADMIN actors |
| ADMIN cannot touch SYSTEM_ADMIN accounts | ✅ Pass | Service fetches target user and rejects if SYSTEM_ADMIN |
| Middleware order enforced (auth before authz) | ✅ Pass | `authenticate` always runs before `authorize` in route definitions |

---

## 6. Overall assessment

| Category | Rating | Finding count |
|----------|--------|---------------|
| Password security | ✅ Strong | 0 critical, 1 advisory |
| JWT secret management | ⚠️ Good (needs startup validation) | 0 critical, 2 advisory |
| Token lifecycle | ✅ Strong | 0 critical, 1 advisory (Redis) |
| Data handling | ✅ Strong | 0 critical |
| RBAC | ✅ Strong | 0 critical |

**No critical or high-severity vulnerabilities found.**

All advisories are documented improvements for hardening, not blockers for deployment.
