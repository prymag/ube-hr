# Modular Architecture Guidelines (Express / Node.js)

## 🎯 Goal

This document defines how the codebase should be structured using a **modular (feature-based) architecture**. AI agents and developers must follow this strictly to ensure scalability, maintainability, and consistency.

---

## 🧱 Core Principle

> Organize code by **feature (module)**, not by technical layer.

Each feature should be self-contained and include all logic related to it.

---

## 📁 Project Structure

```
/src
├── /modules
│   ├── /<feature>
│   │   ├── <feature>.routes.ts
│   │   ├── <feature>.controller.ts
│   │   ├── <feature>.service.ts
│   │   ├── <feature>.repository.ts
│   │   ├── <feature>.model.ts
│   │   ├── <feature>.validator.ts
│   │   └── index.ts
│
├── /shared
│   ├── /utils
│   ├── /constants
│   ├── /types
│
├── /providers
│   ├── <provider>.provider.ts
│
├── /middlewares
├── /config
├── app.ts
├── server.ts
```

---

## 📦 Module Rules

Each module represents a **single business domain** (e.g., user, order, auth).

### Required Files

* `*.routes.ts` → Defines API routes
* `*.controller.ts` → Handles HTTP request/response
* `*.service.ts` → Contains business logic
* `*.repository.ts` → Handles database access
* `*.model.ts` → Defines schema/types
* `*.validator.ts` → Request validation
* `index.ts` → Exports module components

---

## 🔄 Data Flow

Strict flow must be followed:

```
Route → Controller → Service → Repository → Database
```

### Rules:

* Controllers MUST NOT access the database directly
* Services MUST NOT handle HTTP objects (req, res)
* Repositories MUST ONLY handle data access

---

## 🔌 Dependency Rules

### Allowed:

* Controller → Service
* Service → Repository
* Module → Shared
* Module → Providers

### Not Allowed:

* Module → Another Module (directly)
* Repository → Service
* Service → Controller

👉 If cross-module interaction is needed:

* Use **service interfaces** or
* Extract shared logic into `/shared`

---

## ♻️ Shared Layer

Use `/shared` ONLY for reusable, generic logic.

Examples:

* Utility functions
* Constants
* Custom error classes
* Common types/interfaces

❌ Do NOT put business logic here

---

## 🔌 Providers Layer

Used for external integrations.

Examples:

* Database clients
* Redis
* Message queues
* Third-party APIs

Rules:

* Must be stateless wrappers
* Must not contain business logic

---

## 🧪 Validation Rules

* All incoming requests MUST be validated
* Validation logic goes in `*.validator.ts`
* Controllers should call validators before services

---

## 🧼 Naming Conventions

* Use lowercase for folders: `user`, `order`
* Use dot notation for files: `user.service.ts`
* Keep naming consistent across modules

---

## 🚫 Anti-Patterns (DO NOT DO)

❌ Creating global `controllers/`, `services/`, `models/` folders
❌ Mixing business logic inside controllers
❌ Direct database access in controllers
❌ Cross-module imports (e.g., user → order)
❌ Putting feature logic inside `/shared`

---

## 🔒 Module Boundaries & Dependency Rules

To prevent tight coupling and circular dependencies, all modules must follow strict boundaries.

### 📦 Public API per Module

Each module MUST expose a single entry point via `index.ts`.

Example:

```ts
// /modules/user/index.ts
export { userService } from './user.service';
export * from './user.model';
```

### ✅ Allowed Imports

* Modules may ONLY import from another module's `index.ts`

```ts
import { userService } from '@/modules/user';
```

### ❌ Forbidden Imports

* Deep imports across modules are NOT allowed:

```ts
// ❌ DO NOT DO THIS
import { userRepository } from '@/modules/user/user.repository';
```

---

## 🔁 Dependency Direction Rules

Modules must follow a clear dependency direction to avoid cycles.

### Rule:

> A module can depend on another module, but that dependency must NEVER be mutual.

### ✅ Allowed:

```
order → user
```

### ❌ Not Allowed (circular dependency):

```
user → order
order → user
```

---

## 🧩 Handling Cross-Module Logic

If two modules need each other:

### Option A — Extract a New Module

Create a shared domain module:

```
/modules/identity
/modules/order
```

### Option B — Use an Orchestrator Module

Create a higher-level module to coordinate:

```
/modules/checkout
```

Example:

```ts
// checkout.service.ts
await userService.getUserById();
await orderService.createOrder();
```

### Option C — Event-Driven (Advanced)

Use events to decouple modules:

```ts
eventBus.emit('user.created');
```

---

## 🧠 AI Implementation Rules

When generating code:

1. ALWAYS place new functionality inside a module
2. NEVER create global layer-based folders
3. KEEP all feature-related files inside the same module
4. FOLLOW strict data flow (controller → service → repository)
5. REUSE shared utilities when applicable
6. DO NOT duplicate logic across modules
7. CREATE validator files for all endpoints

---

## 📌 Example Module (User)

```
/modules/user
├── user.routes.ts
├── user.controller.ts
├── user.service.ts
├── user.repository.ts
├── user.model.ts
├── user.validator.ts
└── index.ts
```

---

## 🚀 Scalability Notes

* This structure allows easy migration to microservices
* Each module can be extracted independently
* Reduces coupling and circular dependencies

---

## ✅ Summary

* Structure by feature
* Keep modules isolated
* Enforce strict layering inside modules
* Use shared and providers properly

---

This guideline is mandatory for all new code and refactoring efforts.
