# Architecture

This is an NX monorepo containing a NestJS API, a React web app, and shared libraries.

## Workspace Structure

```
ube-hr/
├── apps/
│   ├── api/          — NestJS backend
│   ├── api-e2e/      — Playwright e2e tests for API
│   ├── web/          — React frontend
│   └── web-e2e/      — Playwright e2e tests for web
├── libs/
│   ├── backend/      — Backend infrastructure (config, Prisma)
│   ├── feature/      — Feature modules (auth, users)
│   ├── shared/       — Shared utilities (e.g. password hashing)
│   └── ui/           — React UI component library
├── prisma/
│   ├── schema.prisma — Database schema (MySQL via MariaDB adapter)
│   └── migrations/   — Prisma migration history
└── docker-compose.yml — MySQL, PhpMyAdmin, Mailhog services
```

## Applications

### apps/api (NestJS)

- **Port**: 3000
- **Global prefix**: `/api`
- **Swagger docs**: `http://localhost:3000/api`
- **Bundler**: Webpack (tsc compiler), output to `dist/apps/backend`
- **Root module**: `AppModule` imports `AppConfigModule`, `PrismaModule`, `AuthModule`
- **Controllers**: `AppController`, `AuthController`
- **Middleware**: `AuthMiddleware` applied globally except `POST /auth/login`

Auth endpoints:

| Method | Path             | Guard           |
|--------|------------------|-----------------|
| POST   | /auth/login      | LocalAuthGuard  |
| POST   | /auth/refresh    | JwtAuthGuard    |
| POST   | /auth/logout     | JwtAuthGuard    |
| GET    | /auth/me         | JwtAuthGuard    |

### apps/web (React)

- **Port**: 4200
- **Bundler**: Vite, output to `dist/apps/web`
- **Proxy**: `/api` requests forwarded to `http://localhost:3000`
- **Router**: React Router v6
- **HTTP client**: Axios
- **Styling**: Tailwind CSS

Routes:

| Path     | Component  |
|----------|------------|
| /login   | LoginPage  |
| *        | → /login   |

## Libraries

Path aliases are defined in `tsconfig.base.json`.

### libs/backend (`@ube-hr/backend`)

Backend infrastructure modules used only by `apps/api`.

- `AppConfigModule` — Global `@nestjs/config` wrapper
- `PrismaModule` / `PrismaService` — ORM initialization with MariaDB adapter

### libs/feature (`@ube-hr/feature`)

Feature modules for the API. See [LIBRARY_STRUCTURE.md](./LIBRARY_STRUCTURE.md) for internal structure.

- `UsersModule` / `UsersService` — User lookups and refresh token management
- `AuthModule` (Global) / `AuthService` — JWT + Passport authentication
  - Strategies: `LocalStrategy`, `JwtStrategy`
  - Guards: `LocalAuthGuard`, `JwtAuthGuard`
  - Middleware: `AuthMiddleware`
  - Token lifetimes: access token 15 min, refresh token long-lived
- `AuthModule` imports `UsersModule` internally

### libs/shared (`@ube-hr/shared`)

Framework-agnostic utilities usable by both frontend and backend.

- `secrets.hash(password)` — Argon2 password hashing
- `secrets.verify(hash, password)` — Password verification

### libs/ui (`@ube-hr/ui`)

React component library shared across frontend apps (currently minimal).

## Data Model

Database: MySQL 8.0 (accessed via Prisma with the MariaDB adapter).

```
User
  id           Int       PK, auto-increment
  email        String    unique
  password     String    (Argon2 hash)
  name         String?
  refreshToken String?
  createdAt    DateTime  default now()
  updatedAt    DateTime  auto-updated
```

## Dependency Graph

```
apps/api
  ├── libs/backend   (AppConfigModule, PrismaModule)
  └── libs/feature   (AuthModule → UsersModule)
        └── libs/shared  (secrets / argon2)

apps/web
  └── libs/ui        (React components)
```

## Infrastructure (Docker Compose)

| Service     | Port        | Purpose                    |
|-------------|-------------|----------------------------|
| MySQL 8.0   | 3306        | Primary database           |
| PhpMyAdmin  | 8080        | Database UI                |
| Mailhog     | 1025 / 8025 | SMTP trap / email preview  |

All services run on the `ube-hr-network` bridge network.

## Key Technology Choices

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Monorepo     | NX 22.6.4                           |
| Backend      | NestJS 11, TypeScript 5.9           |
| ORM          | Prisma 7.6 (MariaDB adapter)        |
| Auth         | Passport (local + JWT), Argon2      |
| API docs     | Swagger / OpenAPI                   |
| Frontend     | React 19, React Router 6, Axios     |
| Styling      | Tailwind CSS                        |
| Build (API)  | Webpack + tsc                       |
| Build (web)  | Vite                                |
| Testing      | Jest (unit), Vitest, Playwright (e2e)|
