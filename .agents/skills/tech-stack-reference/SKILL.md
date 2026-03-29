---
name: tech-stack-reference
description: Reference guide for the project's technology stack decisions. Use this when generating code to ensure alignment with frontend (React, Tailwind, Zod), backend (Express, Prisma, Zod), and shared tools.
---

# Tech Stack Reference

This guide specifies the technologies and tools used across the ube-hr project.

## Frontend Stack

### Core Framework
- **Framework**: React 18+ (TypeScript)
- **Build Tool**: Vite
- **Language**: TypeScript (strict mode)
- **Package Manager**: npm

### Styling
- **Primary**: Tailwind CSS v3+
- **Configuration**: `tailwind.config.js` (root)
- **Icons**: React Icons or Heroicons
- **CSS-in-JS**: None (use Tailwind utilities)

### State Management
- **Store**: Zustand
- **Pattern**: Feature-scoped stores
- **Context**: React Context for UI-only state (Theme, Modal)
- **Never**: Redux (use Zustand for new code)

### Form & Validation
- **Validation**: Zod (runtime + TypeScript inference)
- **Form Library**: react-hook-form
- **Pattern**: Validators in feature, always validate on frontend AND backend

### HTTP Client
- **Client**: Axios or native Fetch API
- **Pattern**: Repository pattern in each feature
- **Auth**: Bearer token in Authorization header

### Testing
- **Framework**: Vitest
- **Strategy**: Integration tests for critical user flows only
- **Mocking**: MSW for API mocking during flow tests
- **Focus**: Business-critical paths, not component unit tests
- **No Coverage Target**: Quality over quantity

### Linting & Formatting
- **Linter**: ESLint
- **Formatter**: Prettier
- **Config**: `.eslintrc.json`, `.prettierrc`

---

## Backend Stack

### Core Runtime
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **Package Manager**: npm

### Database
- **Database**: PostgreSQL (or configured database)
- **ORM**: Prisma
- **Migrations**: `/prisma/migrations` (auto-managed by Prisma)
- **Connection**: Via Prisma client in `/providers/database.ts`

### Validation
- **Input Validation**: Zod
- **Pattern**: Define validators in `<feature>.validator.ts`
- **Execution**: Validator runs before service in controller
- **Type Inference**: Generate TypeScript types from Zod schemas

### Authentication & Security
- **Auth**: JWT (Bearer tokens)
- **Password Hashing**: bcrypt
- **Refresh Tokens**: Optional, configurable
- **CORS**: Express CORS middleware
- **Headers**: Helmet.js for security headers

### Testing
- **Framework**: Jest
- **Strategy**: Integration tests for API endpoints and critical business logic only
- **Scope**: Complete request flow (route → controller → validator → service → repository → database)
- **Focus**: Business-critical operations (create, update, delete, auth flows)
- **Mocking**: Mock external providers, test actual business logic
- **No Coverage Target**: Quality over quantity - focus on critical paths

### Logging & Monitoring
- **Logger**: console.log with context (or Winston/Pino)
- **Log Levels**: error, warn, info, debug
- **Pattern**: Log at service/controller boundaries

### API Documentation
- **Format**: OpenAPI/Swagger (optional)
- **Tools**: Swagger UI Express (optional)

### Error Handling
- **Custom Errors**: Domain-specific error classes
- **Status Codes**: Follow REST conventions (400, 401, 403, 404, 409, 500)
- **Error Response Format**:
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "User-friendly message",
      "details": {}
    }
  }
  ```

---

## Shared Stack

### Version Control
- **VCS**: Git
- **Branching**: feature branches, main branch protected
- **Commits**: Conventional commits (feat:, fix:, docs:, etc.)

### Git Hooks
- **Tool**: Husky
- **pre-commit**: Run linters on staged files
- **commit-msg**: Validate conventional commit format

### Environment Management
- **Config**: `.env` files (never commit .env)
- **Tool**: dotenv
- **Pattern**: Load in `app.ts` or `index.ts`

### Code Quality Tools
- **Linter**: ESLint (shared config for frontend + backend)
- **Formatter**: Prettier (shared config)
- **Type Checker**: TypeScript compiler

---

## Installation & Setup

### Frontend Setup
```bash
cd frontend
npm install
npm run dev           # Start dev server
npm run build         # Production build
npm run test          # Run tests
npm run lint          # Run ESLint
```

### Backend Setup
```bash
cd backend
npm install
npm run migrate       # Run Prisma migrations
npm run dev           # Start dev server with watch
npm run build         # Production build
npm run test          # Run tests
npm run lint          # Run ESLint
```

---

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/ube-hr
JWT_SECRET=your-secret-key
PORT=3000
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3000/api
VITE_ENV=development
```

---

## Key Patterns by Tech

### Zod for Validation

**Backend**:
```ts
// features/user/user.validator.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export type CreateUserRequest = z.infer<typeof createUserSchema>;
```

**Frontend**:
```ts
// features/user/types/user.types.ts
import { z } from 'zod';

export const userFormSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});
```

### Prisma for Database

**Schema** (`/prisma/schema.prisma`):
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Repository Pattern**:
```ts
// features/user/user.repository.ts
export class UserRepository {
  async findById(id: string) {
    return database.user.findUnique({ where: { id } });
  }
}
```

### Zustand for State

**Store** (`/features/products/store/productsStore.ts`):
```ts
import { create } from 'zustand';

export const useProductsStore = create((set) => ({
  products: [],
  setProducts: (products) => set({ products }),
}));
```

### Express for Routing

**Routes** (`/modules/user/user.routes.ts`):
```ts
import { Router } from 'express';
import { userController } from './user.controller';

export const userRoutes = Router()
  .post('/', userController.createUser)
  .get('/:id', userController.getUser);
```

---

## When Updating Tech Stack

If you need to add/change technologies:

1. Update this file (`/docs/TECH_STACK.md`)
2. Update `/AGENTS.md` if it affects AI instructions
3. Update relevant skills if patterns change
4. Document migration path for existing code

---

**Last Updated**: 2024-03-29

**Stack**: React 18 + TypeScript + Tailwind | Express + TypeScript + Prisma + Zod
