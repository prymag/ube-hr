---
name: modular-architecture-mastery
description: Enforce strict modular (feature-based) architecture across backend modules and frontend features. Use this when creating, refactoring, or reviewing code to ensure modules respect boundaries, prevent circular dependencies, and maintain separation of concerns.
---

# Modular Architecture Mastery

## When to Use This Skill

Apply this skill when:
- Creating new features or modules
- Refactoring existing code
- Reviewing code for architectural compliance
- Detecting and fixing circular dependencies
- Organizing cross-feature communication

## Backend Module Architecture

### Required Structure
All backend code must live inside `/src/modules/<feature>` directories:

```
/src/modules/user
├── user.routes.ts       # Route definitions
├── user.controller.ts   # HTTP handlers
├── user.service.ts      # Business logic
├── user.repository.ts   # Data access
├── user.model.ts        # Types/schemas
├── user.validator.ts    # Request validation
└── index.ts             # Public API
```

### Strict Prohibited Patterns
- ❌ Global layer-based folders (`controllers/`, `services/`, `models/`)
- ❌ Cross-module direct imports (only via `index.ts`)
- ❌ Circular dependencies between modules
- ❌ Business logic in `/shared` or `/providers`
- ❌ Feature code outside of feature module

## Frontend Feature Architecture

### Required Structure
All frontend code must live inside `/src/features/<feature>` directories:

```
/src/features/products
├── views/               # UI components
│   ├── ProductList.tsx
│   └── ProductItem.tsx
├── hooks/               # Feature hooks
│   └── useProductsData.ts
├── services/            # Business logic & API
│   ├── ProductsManager.ts
│   └── ProductsRepository.ts
├── store/               # State management
│   └── productsStore.ts
├── types/               # Feature types
│   └── products.types.ts
└── index.ts             # Public API
```

## Module Boundaries

### Public API Pattern
Each module exposes ONLY what other modules need via `index.ts`:

```ts
// ✅ CORRECT: /modules/user/index.ts
export { userService } from './user.service';
export type { User, CreateUserRequest } from './user.model';

// ❌ WRONG: Deep exports
export { userRepository } from './user.repository';  // Internal!
```

### Import Rules

**✅ Allowed:**
```ts
import { userService } from '@/modules/user';        // From public API
import { logger } from '@/shared/utils';             // From shared
import { database } from '@/providers/database';     // From providers
```

**❌ Forbidden:**
```ts
import { userRepository } from '@/modules/user/user.repository';  // Deep import!
import { OrderService } from '@/modules/order/order.service';     // Deep import!
```

## Dependency Direction Enforcement

### One-Way Dependencies Only
```
✅ ALLOWED:          ❌ FORBIDDEN:
Module A → B         A → B
                     B → A (circular)
```

If circular dependencies emerge:
1. **Extract Option**: Create a new shared module
2. **Orchestrator Option**: Create a higher-level module coordinating both
3. **Event-Driven Option**: Decouple with events

## Validation Checklist

Before committing code, verify:
- ✅ All new code lives in a module or feature
- ✅ No imports from deep module paths
- ✅ No circular dependencies detected
- ✅ Module's `index.ts` exports public API only
- ✅ `/shared` contains only generic, reusable code
- ✅ `/providers` contains only external integrations
- ✅ Feature-specific code never mixed with shared

## Cross-Feature Communication Pattern

### When Features Must Interact

**Option A: Orchestrator Module**
```ts
// /modules/checkout coordinates user + order + payment
import { userService } from '@/modules/user';
import { orderService } from '@/modules/order';
```

**Option B: Event Bus**
```ts
// Decouple with events
eventBus.emit('user:created', userData);
eventBus.on('user:created', handleUserCreation);
```

**Option C: Shared Domain Module**
```
/modules/identity (extracted shared domain)
/modules/user (depends on identity)
/modules/account (depends on identity)
```

## Key Decision Points

1. Does this code belong in a module, shared, or provider?
2. Am I importing from module's `index.ts` or deep-importing?
3. Would this create a circular dependency?
4. Should this be shared or feature-specific?
