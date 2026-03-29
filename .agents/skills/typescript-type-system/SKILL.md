---
name: typescript-type-system
description: Design and maintain robust TypeScript types with proper type safety across module boundaries. Use this when creating features, designing types, or reviewing type safety to prevent type leaks and ensure strict null checks.
---

# TypeScript Type System Proficiency

## When to Use This Skill

Apply this skill when:
- Designing new features and their types
- Adding API endpoints with DTOs
- Creating React components with typed props
- Sharing types across modules
- Reviewing type safety
- Fixing type leaks

## Backend Type Design

### Three Type Categories

#### 1. Request/Response DTOs (Data Transfer Objects)

```ts
// Request: What client sends
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string; // Never in responses!
}

// Response: What server returns
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

// Never combine them!
// ❌ WRONG: export interface User extends CreateUserRequest { id: string }
```

#### 2. Database Entity Types

```ts
// Internal database representation
export interface User extends UserResponse {
  passwordHash: string;      // Never in response!
  deletedAt: ISO8601 | null; // Soft delete
}
```

#### 3. Service Method Types

```ts
export interface IUserService {
  createUser(req: CreateUserRequest): Promise<UserResponse>;
  getUserById(id: string): Promise<UserResponse | null>;
  updateUser(id: string, req: UpdateUserRequest): Promise<UserResponse>;
  deleteUser(id: string): Promise<void>;
}
```

### Backend Type Guidelines

**Model File Structure** (`user.model.ts`):

```ts
// 1. Request types
export interface CreateUserRequest { ... }
export interface UpdateUserRequest { ... }

// 2. Response types
export interface UserResponse { ... }
export interface UserListResponse { ... }

// 3. Database types (internal)
export interface User extends UserResponse { ... }

// 4. Error types
export interface UserNotFoundError { code: 'USER_NOT_FOUND' }
export interface DuplicateEmailError { code: 'DUPLICATE_EMAIL' }

// 5. Service interface
export interface IUserService { ... }
```

## Frontend Type Design

### Feature Types Structure

```ts
// /features/products/types/products.types.ts

// 1. Domain model
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

// 2. Feature state
export interface ProductsState {
  items: Product[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
}

// 3. Filter/Sort types
export interface ProductFilter {
  minPrice?: number;
  maxPrice?: number;
  category?: string;
}

// 4. Component props
export interface ProductListProps {
  products: Product[];
  loading: boolean;
  onSelect: (id: string) => void;
}

// 5. API response
export interface ProductsApiResponse {
  data: Product[];
  total: number;
}
```

### Frontend Type Guidelines

- Separate domain models from state shapes
- Use discriminated unions for loading/error/success states
- Type all component props with interfaces
- Use `readonly` for immutable state
- Export types that other features might need

```ts
// ✅ GOOD: Clear state variants
type ProductsStatus = 
  | { status: 'idle'; data: Product[] }
  | { status: 'loading' }
  | { status: 'error'; error: string };

// ❌ AVOID: Mixing concerns
interface ProductsState {
  products: Product[] | null;
  loading: boolean;
  error: string | null;
}
```

## Shared Type Guidelines

### What Goes in `/shared/types`

**✅ Do:**
- Common domain models (User, Organization, etc.)
- API response envelopes
- Error types and exceptions
- Utility types (Pagination, Filter, Sort)
- Auth types (Credentials, Token, etc.)

**❌ Don't:**
- Feature-specific business logic types
- Module-internal interfaces
- Repository implementation details

### Shared Type Example

```ts
// /shared/types/common.types.ts

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}
```

## Type Safety Enforcement

### Backend Standards

```ts
// ✅ GOOD: Strict types throughout
function getUserById(id: string): Promise<User> {
  if (!id) throw new Error('ID required');
  return repository.findById(id);
}

// ❌ WRONG: Using any
function getUserById(id: any): any {
  return repository.findById(id);
}
```

### Frontend Standards

```ts
// ✅ GOOD: Typed component props
interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
}

function UserCard({ user, onEdit }: UserCardProps) {
  return <div onClick={() => onEdit(user.id)}>{user.name}</div>;
}

// ❌ WRONG: Untyped props
function UserCard(props) {
  return <div onClick={() => props.onEdit(props.user.id)}>{props.user.name}</div>;
}
```

## Cross-Module Type Sharing

### Import Pattern

**✅ Correct: Use shared types via public API**
```ts
// In /modules/order/order.service.ts
import type { User } from '@/modules/user';           // From public API
import type { UserResponse } from '@/shared/types';   // From shared

// Feature communicates via API types, not internal types
```

**❌ Wrong: Deep imports**
```ts
// DO NOT DO THIS
import type { User } from '@/modules/user/user.model';  // Deep import!
```

### Type Flow Direction

```
Feature → Shared    ✅ Features use shared types
Shared → Feature    ✅ Shared doesn't depend on features
Feature → Feature   ❌ Use API types, not deep imports
```

## Preventing Type Leaks

### Pattern: Hide Implementation Details

```ts
// ❌ WRONG: Leaks internal types
export interface User {
  id: string;
  passwordHash: string;  // Internal!
  databaseId: string;    // Internal!
}

// ✅ CORRECT: Only public types
export interface UserResponse {
  id: string;
  name: string;
  email: string;
}

// Internal type, not exported
interface User extends UserResponse {
  passwordHash: string;
}
```

### Pattern: Use Interfaces for APIs

```ts
// ✅ GOOD: Interface hides implementation
export interface IUserService {
  getUser(id: string): Promise<UserResponse>;
}

// ❌ WRONG: Concrete type leaks implementation
export class UserService {
  // Internal details visible
  private repository: UserRepository;
  private cache: Map<string, User>;
}
```

## Type Generation Checklist

When creating a new feature:
- ✅ Define request/response DTOs
- ✅ Create state type (frontend) or entity type (backend)
- ✅ Define error types
- ✅ Create service/hook interfaces
- ✅ Document required fields vs optional
- ✅ Use discriminated unions where applicable
- ✅ No type leaks to internal implementations
- ✅ All types in TypeScript strict mode

## Type System Best Practices

- **One-way imports**: Features → Shared (never reverse)
- **No `any` types**: Use `unknown` and type guards instead
- **Explicit vs implicit**: Always prefer explicit types
- **Immutability**: Use `readonly` for state objects
- **Discriminated unions**: For complex state variants
- **Generic utilities**: Reuse type patterns across features
