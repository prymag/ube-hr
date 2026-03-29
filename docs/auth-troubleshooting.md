# Authentication — Troubleshooting Guide

## Common issues and solutions

---

### 1. `401 Authorization header missing or malformed`

**Cause:** The `Authorization` header is absent or does not use the `Bearer` scheme.

**Fix:**
```
Authorization: Bearer <accessToken>
```
- Ensure there is exactly one space between `Bearer` and the token.
- Ensure the header name is spelled correctly (`Authorization`, not `Authorisation`).

---

### 2. `401 Token has expired`

**Cause:** The access token has passed its expiry time (default: 15 minutes).

**Fix:** Use the refresh token to obtain a new token pair:
```bash
POST /api/v1/auth/refresh
{ "refreshToken": "<refreshToken>" }
```
Then retry the original request with the new access token.

If the refresh token has also expired (default: 7 days), the user must log in again.

---

### 3. `401 Invalid token`

**Cause:** One of the following:
- The token was tampered with.
- The token was signed with a different secret (e.g., from another environment).
- The token string is truncated or malformed.

**Fix:**
- Log out and log in again to obtain a fresh token pair.
- Verify `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` are identical across all instances of the service.

---

### 4. `401 Refresh token has been invalidated`

**Cause:** The refresh token was already used (token rotation) or explicitly invalidated by a logout call.

**Fix:** The user must log in again:
```bash
POST /api/v1/auth/login
{ "email": "...", "password": "..." }
```

---

### 5. `403 Forbidden: insufficient permissions`

**Cause:** The authenticated user's role is not in the set of roles permitted by the endpoint.

| Endpoint | Required roles |
|----------|---------------|
| `POST /api/v1/users` | `ADMIN`, `SYSTEM_ADMIN` |
| `GET /api/v1/users` | `ADMIN`, `SYSTEM_ADMIN` |
| `PATCH /api/v1/users/:id` | `ADMIN`, `SYSTEM_ADMIN` |
| `DELETE /api/v1/users/:id` | `ADMIN`, `SYSTEM_ADMIN` |

**Fix:** Use an account with the appropriate role, or contact a `SYSTEM_ADMIN` to elevate your role.

---

### 6. `403 ADMIN cannot assign ADMIN or SYSTEM_ADMIN role`

**Cause:** An `ADMIN` attempted to create or update a user with a role of `ADMIN` or `SYSTEM_ADMIN`.

**Fix:** Only `SYSTEM_ADMIN` can assign elevated roles. Either:
- Omit the `role` field (defaults to `USER`).
- Ask a `SYSTEM_ADMIN` to perform the operation.

---

### 7. `403 ADMIN cannot modify a SYSTEM_ADMIN account`

**Cause:** An `ADMIN` attempted to `PATCH` or `DELETE` a `SYSTEM_ADMIN` account.

**Fix:** Only `SYSTEM_ADMIN` can modify other `SYSTEM_ADMIN` accounts.

---

### 8. `409 A user with this email already exists`

**Cause:** A `POST /api/v1/users` request was made with an email address that is already registered.

**Fix:** Use a different email address, or `PATCH` the existing account instead.

---

### 9. `400 Validation failed` on login

**Cause:** The request body does not match the expected schema.

Common mistakes:
- `email` is not a valid email address format.
- `password` field is empty or missing.

**Fix:** Ensure the body is:
```json
{ "email": "valid@example.com", "password": "yourpassword" }
```
And the `Content-Type` header is `application/json`.

---

### 10. `400 Validation failed` on user create/update

**Cause:** Password does not meet complexity requirements.

Password rules:
- Minimum 8 characters
- At least one uppercase letter (`A-Z`)
- At least one lowercase letter (`a-z`)
- At least one digit (`0-9`)

**Fix:** Use a password that satisfies all rules, e.g. `SecurePass1`.

---

### 11. Database connection errors at startup

**Cause:** Either the MySQL service is not running, or `DATABASE_URL` is incorrect.

**Fix:**
1. Start Docker services: `docker-compose up -d`
2. Verify `DATABASE_URL` in `.env` matches Docker Compose configuration.
3. Confirm the adapter is properly installed and configured in `src/providers/database.ts`.

---

### 12. Tests failing with `Cannot find module`

**Cause:** TypeScript path aliases (`@/`) are not resolved by Jest.

**Fix:** Ensure `jest.config.js` / `tsconfig.json` has `moduleNameMapper` for the `@/` alias pointing to `src/`. This is pre-configured in the project.

---

### 13. JWT secret mismatch between environments

**Symptom:** Tokens issued in one environment (e.g., staging) are rejected by another (production).

**Fix:** Each environment must have its own unique `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. Tokens issued in one environment are intentionally invalid in another. Users must re-authenticate after environment switches.

---

## Diagnostic checklist

```
[ ] Docker services running (docker-compose up -d)
[ ] .env file exists with all required variables
[ ] DATABASE_URL points to the correct host/database
[ ] JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are set and ≥ 32 chars
[ ] @prisma/adapter-mariadb installed and configured in database.ts
[ ] Database migrated (npm run prisma:migrate)
[ ] System admin seeded (npm run prisma:seed)
[ ] Authorization header format: "Bearer <token>" (note the space)
[ ] Content-Type: application/json on POST/PATCH requests
```
