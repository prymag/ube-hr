# Tech Stack

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

### State Management
- **Store**: Zustand
- **Pattern**: Feature-scoped stores
- **Context**: React Context for UI-only state (Theme, Modal)

### Form & Validation
- **Validation**: Zod (runtime + TypeScript inference)
- **Form Library**: react-hook-form
- **Pattern**: Validate on frontend AND backend

### HTTP Client
- **Client**: Axios or native Fetch API
- **Pattern**: Repository pattern in each feature
- **Auth**: Bearer token in Authorization header

### Testing
- **Framework**: Vitest
- **Strategy**: Integration tests focused on critical user flows
- **Mocking**: MSW for API mocking
- **No Coverage Target**: Focus on critical business logic, not % coverage

---

## Backend Stack

### Core Runtime
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **Package Manager**: npm

### Database
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Migrations**: `/prisma/migrations` (auto-managed)
- **Connection**: Via Prisma client in `/providers/database.ts`

### Validation
- **Input Validation**: Zod
- **Pattern**: Define validators in `<feature>.validator.ts`
- **Execution**: Validator runs before service in controller

### Authentication & Security
- **Auth**: JWT (Bearer tokens)
- **Password Hashing**: bcrypt
- **CORS**: Express CORS middleware
- **Headers**: Helmet.js for security headers

### Testing
- **Framework**: Jest
- **Strategy**: Integration tests for API endpoints and critical business logic
- **Scope**: Test complete request → controller → service → repository → database flows
- **Focus**: Business-critical operations only (create, update, delete, auth flows)
- **Mocking**: Mock external services and providers, but test actual business logic
- **No Coverage Target**: Focus on critical paths, not aiming for high % coverage

### Error Handling
- **Custom Errors**: Domain-specific error classes
- **Status Codes**: Follow REST conventions (400, 401, 403, 404, 409, 500)
- **Error Format**:
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
- **Commits**: Conventional commits

### Code Quality
- **Linter**: ESLint
- **Formatter**: Prettier
- **Type Checker**: TypeScript

### Environment
- **Config**: `.env` files (never commit)
- **Tool**: dotenv

---

## Quick Setup

### Frontend
```bash
cd frontend
npm install
npm run dev     # Start dev server
npm run build   # Production build
npm run test    # Run tests
```

### Backend
```bash
cd backend
npm install
npm run migrate # Run Prisma migrations
npm run dev     # Start dev server
npm run build   # Production build
npm run test    # Run tests
```

---

## Why These Choices

- **Zod**: Runtime validation + TypeScript inference (same validator for frontend and backend)
- **Tailwind**: Consistent styling, utility-first, highly customizable
- **Zustand**: Minimal, unopinionated state management (perfect for modular features)
- **Prisma**: Type-safe database access, auto-migrations, excellent DX
- **Express**: Lightweight, flexible, perfect for modular architecture
- **TypeScript**: Type safety across full stack, better IDE support, fewer runtime errors

---

**Last Updated**: 2024-03-29
