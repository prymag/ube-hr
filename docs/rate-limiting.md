# Rate Limiting — Recommendations

Rate limiting is not implemented in the current codebase. This document defines the recommended strategy before production deployment.

---

## Why rate limiting matters for auth endpoints

| Attack | Unmitigated risk |
|--------|-----------------|
| Brute-force login | Attacker tries millions of passwords against a known email |
| Credential stuffing | Attacker replays leaked username/password lists |
| Token endpoint abuse | Attacker floods `/auth/refresh` to exhaust server resources |
| User enumeration via timing | Repeated requests to measure bcrypt timing differences |

---

## Recommended library

**[`express-rate-limit`](https://github.com/express-rate-limit/express-rate-limit)** — widely used, zero-dependency, compatible with Express 4/5.

For distributed deployments (multiple Node processes), pair it with a Redis store:

```bash
npm install express-rate-limit rate-limit-redis ioredis
```

---

## Recommended limits per endpoint

| Endpoint | Window | Max requests | Strategy |
|----------|--------|-------------|----------|
| `POST /auth/login` | 15 min | 10 per IP | Strict — protects against brute-force |
| `POST /auth/refresh` | 15 min | 30 per IP | Moderate — refresh is expected to happen automatically |
| `POST /auth/logout` | 15 min | 30 per IP | Moderate — mirrors refresh limit |
| `GET /auth/me` | 1 min | 60 per IP | Loose — lightweight, read-only |
| `POST /users` | 1 min | 20 per IP+user | Admin action — moderate |
| `GET /users` | 1 min | 60 per IP+user | Read-only — loose |
| `PATCH /users/:id` | 1 min | 20 per IP+user | Admin action — moderate |
| `DELETE /users/:id` | 1 min | 10 per IP+user | Destructive — strict |

---

## Implementation example

```ts
// src/middlewares/rate-limit.ts
import rateLimit from 'express-rate-limit';

/** Strict limiter for authentication endpoints */
export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,   // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  keyGenerator: (req) => req.ip ?? 'unknown',
  skipSuccessfulRequests: false,
});

/** Moderate limiter for refresh / logout */
export const authTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

/** General API limiter */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Please try again shortly.' },
});
```

Apply in `auth.routes.ts`:

```ts
import { authLoginLimiter, authTokenLimiter } from '../../middlewares/rate-limit';

router.post('/login',   authLoginLimiter,  controller.login);
router.post('/refresh', authTokenLimiter,  controller.refresh);
router.post('/logout',  authTokenLimiter, authenticate, controller.logout);
router.get('/me',       authenticate,      controller.getCurrentUser);
```

---

## Redis store for distributed deployments

When running multiple Node instances (e.g., behind a load balancer), each instance must share the same rate-limit counter store:

```ts
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createClient } from 'ioredis';

const redisClient = createClient({ url: process.env.REDIS_URL });

export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});
```

---

## Account lockout (optional, post-rate-limit hardening)

In addition to IP-based rate limiting, consider progressive account lockout after repeated failed login attempts:

```ts
// Pseudocode — track failed attempts in Redis
async function trackFailedLogin(email: string): Promise<void> {
  const key = `failed_logins:${email}`;
  const attempts = await redis.incr(key);
  await redis.expire(key, 15 * 60); // reset after 15 min

  if (attempts >= 5) {
    // Lock the account or notify via email
    throw new Error('Account temporarily locked due to repeated failed login attempts');
  }
}
```

Reset the counter on successful login.

---

## Additional recommendations

- **HTTPS only** — enforce TLS termination at the load balancer / reverse proxy (Nginx, AWS ALB). Rate limiting is ineffective without TLS because headers can be spoofed.
- **Trusted proxy** — if behind a proxy (Nginx, CloudFront), configure `app.set('trust proxy', 1)` so Express reads the real client IP from `X-Forwarded-For`.
- **Monitoring** — emit a metric or log entry whenever a rate limit is triggered. Alert on spikes (potential attack in progress).
- **CAPTCHA** — add CAPTCHA (e.g., hCaptcha, Cloudflare Turnstile) to the login page after 3 failed attempts to block automated clients.

```ts
// Express trust proxy configuration (add to app.ts)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
```
