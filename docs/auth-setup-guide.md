# Authentication — Developer Setup Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 20 | Runtime |
| Docker / Docker Compose | latest | MySQL + MailHog |
| npm | ≥ 10 | Package manager |

---

## 1. Clone and install dependencies

```bash
git clone <repo-url>
cd ube-hr/backend
npm install
```

---

## 2. Configure environment variables

Copy the example file and fill in the values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database
DATABASE_URL="mysql://ube_user:ube_password@localhost:3306/ube_hr"

# JWT secrets — generate strong random strings (min 32 characters)
JWT_ACCESS_SECRET="<run: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\">"
JWT_REFRESH_SECRET="<run: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\">"

# Token expiry
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# App
NODE_ENV=development
PORT=3000
```

> **Security**: Never commit `.env`. It is listed in `.gitignore`.

---

## 3. Start Docker services

```bash
docker-compose up -d
```

Services started:
- **MySQL** on port `3306`
- **phpMyAdmin** on port `8080` → http://localhost:8080
- **MailHog** on port `8025` → http://localhost:8025

---

## 4. Configure Prisma 7 MySQL adapter

Prisma 7 requires an explicit driver adapter. Install and configure the MariaDB adapter (compatible with MySQL):

```bash
npm install @prisma/adapter-mariadb mysql2
```

Update `src/providers/database.ts`:

```ts
import { createPool } from 'mysql2/promise';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@/generated/prisma/client';

export function createPrismaClient(): PrismaClient {
  const pool = createPool({ uri: process.env.DATABASE_URL });
  const adapter = new PrismaMariaDb(pool);
  return new PrismaClient({ adapter });
}
```

---

## 5. Run database migrations

```bash
npm run prisma:migrate
```

This creates the `users` table with the `Role` enum.

---

## 6. Seed the initial SYSTEM_ADMIN

```bash
npm run prisma:seed
```

Creates the default system admin:
- **Email:** `admin@ube-hr.com`
- **Password:** `Admin@123` *(change immediately in production)*

---

## 7. Start the development server

```bash
npm run dev
```

Server starts at http://localhost:3000.

Test it:

```bash
curl http://localhost:3000/
# → {"message":"UBE HR Backend is running!"}
```

---

## 8. Test the authentication flow

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ube-hr.com","password":"Admin@123"}'
```

Expected response:
```json
{
  "user": { "id": "...", "email": "admin@ube-hr.com", "role": "SYSTEM_ADMIN" },
  "tokens": { "accessToken": "...", "refreshToken": "..." }
}
```

### Get current user

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

### Refresh tokens

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

### Logout

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

---

## 9. Run tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Specific module
npx jest --testPathPatterns="auth"
```

All 292+ tests should pass without a real database (Prisma is mocked in unit/integration tests).

---

## 10. API reference

See `docs/api.yaml` for the full OpenAPI 3.0 specification.
