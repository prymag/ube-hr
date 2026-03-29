# Token Expiration & Refresh Strategy

## Overview

UBE HR uses a **dual-token** (access + refresh) JWT strategy to balance security and user experience.

| Token | Default expiry | Storage recommendation | Purpose |
|-------|---------------|----------------------|---------|
| Access token | 15 minutes | Memory (JS variable) | Authenticate API requests |
| Refresh token | 7 days | `httpOnly` cookie or secure storage | Obtain new access tokens |

Expiry values are configurable via `.env`:
```env
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

---

## Token lifecycle

```
┌─────────┐   POST /auth/login    ┌─────────────┐
│  Client │ ─────────────────────▶│    Server   │
│         │◀───────────────────── │             │
│         │  accessToken (15m)    │  Validates  │
│         │  refreshToken (7d)    │  password   │
└─────────┘                       └─────────────┘

During a session (access token still valid):
┌─────────┐   GET /api/v1/...     ┌─────────────┐
│  Client │ ─────────────────────▶│    Server   │
│         │  Authorization:       │  Verifies   │
│         │  Bearer <accessToken> │  JWT sig    │
│         │◀─────────────────────│             │
└─────────┘   200 OK              └─────────────┘

When access token expires (refresh token still valid):
┌─────────┐  POST /auth/refresh   ┌─────────────┐
│  Client │ ─────────────────────▶│    Server   │
│         │  { refreshToken }     │  Rotates    │
│         │◀─────────────────────│  token pair │
│         │  new accessToken      │             │
│         │  new refreshToken     └─────────────┘
└─────────┘

When both tokens expire → user must log in again.
```

---

## Token rotation

Every call to `POST /auth/refresh` **invalidates** the old refresh token and issues a new one. This means:

- Each refresh token can only be used **once**.
- A stolen refresh token used by an attacker will invalidate the legitimate user's token — they will be forced to re-authenticate, alerting them to the compromise.
- Clients must **always store the latest refresh token** returned by `/auth/refresh`.

---

## Access token — no server-side revocation

Access tokens are stateless JWTs verified by signature alone. They **cannot be revoked** before they expire. This is an intentional trade-off:

- **Pro:** No database lookup on every request — high-performance, horizontally scalable.
- **Con:** A stolen access token remains valid until it expires (max 15 minutes).

Mitigations:
- Keep access token expiry short (15 minutes default).
- Transmit tokens over HTTPS only.
- Store tokens in memory (not `localStorage`) to reduce XSS exposure.

---

## Refresh token — in-memory invalidation

Refresh tokens are stored in an in-memory `Set` of invalidated tokens within `AuthService`. This means:

- Logout is effective immediately within a single process.
- **After a server restart**, previously invalidated tokens may be accepted again until they naturally expire.

**Production recommendation:** Persist invalidated refresh tokens in Redis or the database:

```ts
// Example: Redis-backed invalidation store
async logout(refreshToken: string): Promise<void> {
  const decoded = jwt.decode(refreshToken) as { exp: number };
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  await redis.setEx(`revoked:${refreshToken}`, ttl, '1');
}

async isInvalidated(refreshToken: string): Promise<boolean> {
  return (await redis.exists(`revoked:${refreshToken}`)) === 1;
}
```

---

## Recommended client-side implementation

```ts
// Pseudocode — adapt to your frontend framework

class AuthClient {
  private accessToken: string | null = null;

  async login(email: string, password: string) {
    const { user, tokens } = await api.post('/auth/login', { email, password });
    this.accessToken = tokens.accessToken;
    secureStorage.set('refreshToken', tokens.refreshToken); // httpOnly cookie preferred
    return user;
  }

  async callApi(path: string, options: RequestInit = {}) {
    // Attach access token
    const res = await fetch(path, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${this.accessToken}` },
    });

    // Auto-refresh on 401
    if (res.status === 401 && secureStorage.has('refreshToken')) {
      await this.refresh();
      return this.callApi(path, options); // retry once
    }

    return res;
  }

  async refresh() {
    const refreshToken = secureStorage.get('refreshToken');
    const { tokens } = await api.post('/auth/refresh', { refreshToken });
    this.accessToken = tokens.accessToken;
    secureStorage.set('refreshToken', tokens.refreshToken); // store NEW refresh token
  }

  async logout() {
    await api.post(
      '/auth/logout',
      { refreshToken: secureStorage.get('refreshToken') },
      { headers: { Authorization: `Bearer ${this.accessToken}` } },
    );
    this.accessToken = null;
    secureStorage.remove('refreshToken');
  }
}
```

---

## Expiry configuration guidance

| Environment | Access expiry | Refresh expiry | Notes |
|-------------|--------------|---------------|-------|
| Development | `15m` | `7d` | Defaults; balance convenience and security |
| Production (standard) | `15m` | `7d` | Good baseline |
| Production (high-security) | `5m` | `1d` | Shorter window reduces exposure |
| Production (long sessions) | `30m` | `30d` | Only if users cannot re-authenticate frequently |

Adjust via `.env`:
```env
JWT_ACCESS_EXPIRY=5m
JWT_REFRESH_EXPIRY=1d
```

---

## Security checklist

- [ ] `JWT_ACCESS_SECRET` ≥ 32 random bytes (`crypto.randomBytes(32).toString('hex')`)
- [ ] `JWT_REFRESH_SECRET` ≥ 32 random bytes, **different** from access secret
- [ ] Secrets stored in environment variables, never in source code
- [ ] HTTPS enforced in production (tokens must not transit over plain HTTP)
- [ ] Access tokens stored in memory only (not `localStorage`)
- [ ] Refresh tokens stored in `httpOnly` cookies when possible
- [ ] Token rotation enabled (already implemented)
- [ ] Redis-backed invalidation store for multi-instance / restart resilience (production)
