---
name: full-stack-code-generation
description: Generate production-ready code across backend and frontend following strict layer and data flow patterns. Use this when implementing new features, creating endpoints, or refactoring code to ensure quality and consistency.
---

# Full-Stack Code Generation & Refactoring

## When to Use This Skill

Apply this skill when:
- Building new features from scratch
- Adding new API endpoints
- Creating React components and pages
- Refactoring monolithic code
- Consolidating duplicate logic

## Backend Code Generation

### File Generation Order (Dependency Order)

1. **Model** (`<feature>.model.ts`) — Define types, DTOs, schemas
2. **Repository** (`<feature>.repository.ts`) — Data access layer
3. **Service** (`<feature>.service.ts`) — Business logic
4. **Validator** (`<feature>.validator.ts`) — Request validation
5. **Controller** (`<feature>.controller.ts`) — HTTP handlers
6. **Routes** (`<feature>.routes.ts`) — Route definitions
7. **Index** (`index.ts`) — Public API exports

### Strict Data Flow Pattern

```
Route → Controller → Validator → Service → Repository → Database
         ↓
       (HTTP)
```

**Layer Responsibilities:**

- **Controller**: HTTP handling only (req/res)
- **Validator**: Input validation rules
- **Service**: Business logic and orchestration
- **Repository**: Data access only
- **Database**: Persistence

**Layer Restrictions:**

- ❌ Controllers NEVER access database directly
- ❌ Services NEVER handle `req`/`res` objects
- ❌ Repositories NEVER contain business logic
- ❌ Controllers NEVER skip validation
- ❌ Services NEVER make HTTP calls directly

### Backend Code Quality Requirements

```ts
// 1. Explicit return types
export async function getUser(id: string): Promise<UserResponse> {
  // ...
}

// 2. Error handling at each layer
try {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError('User not found');
} catch (error) {
  logger.error('Failed to get user', { id, error });
  throw new ServiceError('Failed to retrieve user');
}

// 3. Logging at key points
logger.info('Creating user', { email });
logger.debug('User created', { userId: user.id });

// 4. Async/await patterns (not callbacks)
const data = await repository.fetch();
const processed = await service.process(data);
```

## Frontend Code Generation

### Feature File Generation Order

1. **Types** (`types/<feature>.types.ts`) — TypeScript interfaces
2. **Repository** (`services/<feature>Repository.ts`) — API calls
3. **Manager** (`services/<feature>Manager.ts`) — Business logic
4. **Store** (`store/<feature>Store.ts`) — State management
5. **Hooks** (`hooks/use<Feature>Data.ts`) — Feature hooks
6. **Views** (`views/<Feature>.tsx`) — UI components

### Frontend Pattern: Manager & Repository

**Repository** — Handles API communication:
```ts
export class ProductsRepository {
  async fetchProducts(filters?: FilterParams): Promise<Product[]> {
    const response = await api.get('/products', { params: filters });
    return response.data;
  }
}
```

**Manager** — Encapsulates business logic:
```ts
export class ProductsManager {
  constructor(private repository: ProductsRepository) {}

  async filterByPrice(products: Product[], maxPrice: number): Promise<Product[]> {
    return products.filter(p => p.price <= maxPrice);
  }
}
```

**Hook** — Binds to store and repository:
```ts
export function useProductsData() {
  const store = useProductsStore();
  const manager = new ProductsManager(new ProductsRepository());

  useEffect(() => {
    if (!store.loaded) {
      store.setLoading(true);
      manager.repository.fetchProducts()
        .then(data => store.setProducts(data))
        .catch(err => store.setError(err))
        .finally(() => store.setLoading(false));
    }
  }, []);

  return {
    products: store.products,
    loading: store.loading,
    error: store.error,
  };
}
```

### Frontend Code Quality Requirements

- ✅ Components are props-driven
- ✅ Hooks handle data fetching
- ✅ Store manages state centrally
- ✅ Error boundaries included
- ✅ Loading states managed
- ✅ TypeScript strict mode compliant

## Refactoring Guidelines

### Backend Refactoring

- Move logic into correct layers (service vs repository)
- Extract shared patterns into `/shared/utils`
- Consolidate duplicate services/repositories
- Ensure validators are consistent
- Add missing error handlers
- Improve logging coverage

### Frontend Refactoring

- Extract reusable components to `/shared/components`
- Consolidate duplicate API calls
- Optimize re-renders with proper hooks
- Improve type safety
- Simplify component logic
- Move utilities to `/shared`

## Code Generation Checklist

Before generating code, verify:
- ✅ Follows module/feature structure
- ✅ Respects data flow patterns
- ✅ No cross-module direct imports
- ✅ TypeScript strict mode compliant
- ✅ Error handling included at each layer
- ✅ Logging at key decision points
- ✅ Input validation in place
- ✅ Tests included (unit + integration)

## Code Quality Standards

### TypeScript
- No `any` types
- Explicit return types
- Strict null checks
- Proper error types

### Documentation
- JSDoc comments for public functions
- Clear variable/function names
- Comments for "why", not "what"
- Usage examples in READMEs

### Consistency
- Follow existing code patterns
- Match naming conventions
- Use same libraries (don't add duplicates)
- Consistent error handling
