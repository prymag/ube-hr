---
name: dependency-import-management
description: Enforce strict import rules and manage dependencies to prevent circular dependencies and maintain module isolation. Use this when reviewing imports, refactoring code, or detecting dependency issues.
---

# Dependency & Import Management

## When to Use This Skill

Apply this skill when:
- Reviewing code imports for violations
- Detecting circular dependencies
- Adding cross-module dependencies
- Refactoring imports
- Onboarding to architectural standards

## Core Import Rules

### ✅ ALLOWED Imports

**Within the same module (any file):**
```ts
// In /modules/user/user.controller.ts
import { userService } from './user.service';      // ✅ Same module
import { validateUser } from './user.validator';   // ✅ Same module
```

**From a module's public API via index.ts:**
```ts
// In /modules/order/order.service.ts
import { userService } from '@/modules/user';      // ✅ From index.ts
import type { User } from '@/modules/user';        // ✅ Type import
```

This works because `/modules/user/index.ts` exports:
```ts
export { userService } from './user.service';
export type { User } from './user.model';
```

**From shared layer:**
```ts
// In /modules/user/user.service.ts
import { logger, hashPassword } from '@/shared/utils';    // ✅
import { IUserRepository } from '@/shared/interfaces';    // ✅
```

**From providers layer:**
```ts
// In /modules/user/user.repository.ts
import { database } from '@/providers/database';   // ✅
import { cache } from '@/providers/cache';         // ✅
```

### ❌ FORBIDDEN Imports

**Deep module imports (bypassing index.ts):**
```ts
// ❌ WRONG: Deep import
import { userRepository } from '@/modules/user/user.repository';
import { UserService } from '@/modules/order/order.service';

// ❌ WRONG: Deep import
import { useProductsStore } from '@/features/products/store/productsStore';
```

**Cross-feature imports (frontend):**
```ts
// ❌ WRONG: Cross-feature direct import
import { useCartData } from '@/features/cart/hooks/useCartData';
import ProductsList from '@/features/products/views/ProductsList';
```

**Circular dependencies:**
```ts
// ❌ Module A imports from B AND B imports from A
// /modules/user/user.service.ts
import { orderService } from '@/modules/order';    // ❌ If order imports user

// /modules/order/order.service.ts
import { userService } from '@/modules/user';      // ❌ Circular!
```

**Business logic in shared:**
```ts
// ❌ WRONG: Feature logic in /shared
// /shared/userUtils.ts
export function calculateUserLoyaltyPoints(user: User) { ... }

// Should be in /modules/user/user.service.ts instead
```

## Module Public API Pattern

### Backend Module Structure

```
/modules/user
├── user.routes.ts           ← Routes
├── user.controller.ts        ← Controller
├── user.service.ts           ← Service (business logic)
├── user.repository.ts        ← Repository (data access)
├── user.model.ts             ← Types and interfaces
├── user.validator.ts         ← Validation rules
└── index.ts                  ← PUBLIC API ⭐
```

### Creating Module Public API

**Public API** — `/modules/user/index.ts`:
```ts
// ✅ EXPORT: What external modules need
export { userService } from './user.service';
export { IUserRepository } from './user.repository';
export type { User, CreateUserRequest, UserResponse } from './user.model';

// ❌ DO NOT EXPORT: Internal implementation
// export { userRepository } — Internal!
// export { userController } — Internal!
// export { validateUser } — Internal!
```

**External usage:**
```ts
// In /modules/order/order.service.ts
import { userService, type User } from '@/modules/user';  // ✅ Clean import
```

### Frontend Feature Structure

```
/features/products
├── views/
│   ├── ProductList.tsx
│   ├── ProductItem.tsx
├── hooks/
│   └── useProductsData.ts
├── services/
│   ├── ProductsManager.ts
│   ├── ProductsRepository.ts
├── store/
│   └── productsStore.ts
├── types/
│   └── products.types.ts
└── index.ts                  ← PUBLIC API ⭐
```

**Public API** — `/features/products/index.ts`:
```ts
// ✅ EXPORT: Public-facing API
export { useProductsData } from './hooks/useProductsData';
export { ProductsManager } from './services/ProductsManager';
export type { Product, ProductsState } from './types/products.types';

// ❌ DO NOT EXPORT: Internal components
// export { ProductList } — UI component, internal!
// export { productsStore } — Store, internal!
// export { ProductsRepository } — Repository, internal!
```

## Import Organization in Files

### Recommended Import Order

```ts
// 1. External libraries (React, Express, etc.)
import React, { useEffect } from 'react';
import Express, { Request, Response } from 'express';

// 2. Type-only imports from external libs
import type { NextPage } from 'next';

// 3. Absolute imports from same project (modules, shared)
import { userService } from '@/modules/user';
import { logger } from '@/shared/utils';
import { database } from '@/providers/database';

// 4. Type-only imports from project
import type { User } from '@/modules/user';
import type { Logger } from '@/shared/types';

// 5. Relative imports (same module only)
import { userRepository } from './user.repository';
import { validateUser } from './user.validator';
```

## Dependency Direction Rules

### One-Way Dependency Flow

```
✅ ALLOWED:              ❌ FORBIDDEN (Circular):
Order → User            User → Order
                        Order → User
```

### Acyclic Dependency Graph

Modules must form a directed acyclic graph:
```
    app.ts
      ↓
  [checkout]      ← Orchestrator
   ↙    ↖
[order] [user]    ← Features (no circular)
 ↓
[payment]
```

**Never:**
```
[user] ↔ [order]   ← Circular!
```

## Resolving Circular Dependencies

### Option A: Extract New Module

```
Before (circular):
user ↔ order

After (resolved):
/modules/identity (shared domain)
/modules/user (depends on identity)
/modules/order (depends on identity)
```

### Option B: Create Orchestrator Module

```
/modules/checkout (orchestrator)
├── checkout.service.ts
│   ├── calls userService
│   ├── calls orderService
│   └── calls paymentService
```

### Option C: Event-Driven Architecture

```ts
// user.service.ts — Emit event, don't import order
eventBus.emit('user:created', userData);

// order.service.ts — Listen to event, don't import user
eventBus.on('user:created', async (userData) => {
  await this.initializeUserAccount(userData);
});
```

## Import Verification

### Check for Deep Imports

```bash
# Find deep imports (if script exists in project)
npm run check:deep-imports

# Manual check using grep
grep -r "from '@/modules/.*/.*'" src/modules/
```

### Check for Circular Dependencies

```bash
# Tools: madge, dpdm, depcheck
npm run check:circular-deps

# Using madge:
madge --circular src/
```

## Import Patterns by File Type

### Backend Routes (imports allowed from all layers)

```ts
// ✅ routes can import service from public API
import { userService } from '@/modules/user';
```

### Backend Service (limited imports)

```ts
// ✅ Service can import from repository (same module)
import { userRepository } from './user.repository';

// ✅ Service can import from another module's public API
import { orderService } from '@/modules/order';

// ❌ Service cannot import controller
import { userController } from './user.controller'; // WRONG!
```

### Backend Repository (most limited)

```ts
// ✅ Repository imports data provider
import { database } from '@/providers/database';

// ✅ Repository imports types
import type { User } from './user.model';

// ❌ Repository cannot import service
import { userService } from './user.service'; // WRONG!

// ❌ Repository cannot import other features
import { orderRepository } from '@/modules/order'; // WRONG!
```

### Frontend Component (from store/hooks)

```ts
// ✅ Component imports hook
import { useProductsData } from './hooks/useProductsData';

// ✅ Component imports types
import type { Product } from './types/products.types';

// ❌ Component imports store directly
import { useProductsStore } from './store/productsStore'; // WRONG!

// ❌ Component imports repository
import { ProductsRepository } from './services/ProductsRepository'; // WRONG!
```

## Dependency Injection Pattern

Use dependency injection for testability and flexibility:

```ts
// ✅ GOOD: Dependencies passed in
export class UserService {
  constructor(private repository: IUserRepository) {}

  async getUser(id: string): Promise<User> {
    return this.repository.findById(id);
  }
}

// Usage
const userService = new UserService(userRepository);

// Testing
const mockRepository = new MockUserRepository();
const service = new UserService(mockRepository);
```

## Import Validation Checklist

Before committing code:
- ✅ All cross-module imports use `index.ts`
- ✅ No deep imports detected
- ✅ No circular dependencies created
- ✅ `/shared` code is truly generic
- ✅ `/providers` only has external integrations
- ✅ Feature code stays within feature boundaries
- ✅ Dependency direction is acyclic
- ✅ Types properly exported from public APIs
- ✅ Internal implementations not exposed
- ✅ Testable with dependency injection

## Key Decision Points

1. Am I importing from `module/index.ts` or deep-importing?
2. Does this create a circular dependency?
3. Should this be shared or feature-specific?
4. Is the dependency direction correct?
5. Can I test this in isolation?
