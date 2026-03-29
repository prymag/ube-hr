---
name: state-management-data-flow
description: Design and maintain clear, unidirectional data flow and state management patterns. Use this when implementing features, managing state, or debugging data flow issues across backend services and frontend stores.
---

# State Management & Data Flow

## When to Use This Skill

Apply this skill when:
- Designing new features with state requirements
- Adding API endpoints and data flows
- Implementing state management (Zustand/Redux)
- Debugging data consistency issues
- Optimizing performance
- Designing cross-feature communication

## Backend Data Flow Pattern

### Request-Response Lifecycle

```
HTTP Request
    ↓
Route Handler (match URL)
    ↓
Controller (deserialize HTTP)
    ↓
Validator (validate input)
    ↓
Service (execute business logic)
    ↓
Repository (fetch/save data)
    ↓
Database (persist/retrieve)
    ↓
Repository (serialize response)
    ↓
Service (format output)
    ↓
Controller (HTTP response)
    ↓
HTTP Response
```

### Backend Layer Restrictions

**Controllers** — HTTP handling only:
```ts
export async function createUser(req: Request, res: Response) {
  try {
    const validated = await validateCreateUserRequest(req.body);
    const user = await userService.createUser(validated);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
```

**Services** — Business logic, never HTTP:
```ts
export class UserService {
  async createUser(req: CreateUserRequest): Promise<UserResponse> {
    // ✅ OK: Business logic
    const exists = await this.repository.findByEmail(req.email);
    if (exists) throw new DuplicateEmailError();

    // ❌ WRONG: No HTTP objects
    // req.res.json() — NEVER!

    const user = await this.repository.save(req);
    return this.toResponse(user);
  }
}
```

**Repositories** — Data access only:
```ts
export class UserRepository {
  async save(user: User): Promise<User> {
    // ✅ OK: Data access
    return database.insert('users', user);

    // ❌ WRONG: No business logic
    // if (!user.isValidForSave()) — NEVER!
  }
}
```

### Backend State Management

- Services are **stateless** (no instance variables holding state)
- State comes from database via repository
- Each request gets fresh context
- Use dependency injection for configuration

```ts
// ✅ GOOD: Stateless service
export class UserService {
  async getUser(id: string): Promise<UserResponse> {
    const user = await this.repository.findById(id);
    return this.toResponse(user);
  }
}

// ❌ WRONG: Stateful service
export class UserService {
  private cache: Map<string, User> = new Map(); // Instance state!
}
```

## Frontend Data Flow Pattern

### Component-to-Store Lifecycle

```
Component Renders
    ↓
useFeatureData Hook Called
    ↓
Check Store for Cached Data
    ↓
If Cache Miss:
  ├─ Set Loading State
  ├─ Call Repository
  ├─ Repository calls API
  ├─ Update Store
  └─ Component Re-renders
    ↓
If Cache Hit:
  └─ Return Store Data
    ↓
Component Renders with Data
```

### Frontend Layer Responsibilities

**Views** (Components) — UI rendering only:
```ts
export function ProductList({ products, loading }: ProductListProps) {
  // ✅ OK: Rendering
  return loading ? <div>Loading...</div> : <ul>{products.map(...)}</ul>;

  // ❌ WRONG: Fetching data directly
  // const [data] = useState(fetchProducts()); — NEVER!
}
```

**Hooks** — Data fetching and store binding:
```ts
export function useProductsData() {
  const store = useProductsStore();
  const repository = new ProductsRepository();

  // ✅ OK: Fetch in hook
  useEffect(() => {
    if (store.needsRefresh) {
      store.setLoading(true);
      repository.fetch()
        .then(data => store.setProducts(data))
        .catch(err => store.setError(err))
        .finally(() => store.setLoading(false));
    }
  }, []);

  return { products: store.products, loading: store.loading };
}
```

**Store** — State centralization:
```ts
export const useProductsStore = create((set) => ({
  products: [],
  loading: false,
  error: null,

  setProducts: (products) => set({ products }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
```

**Repository** — API communication:
```ts
export class ProductsRepository {
  async fetch(): Promise<Product[]> {
    // ✅ OK: Pure API call
    const response = await api.get('/products');
    return response.data;
  }
}
```

## Data Flow Rules

### Frontend Constraint: One-Way Data Flow

```
Data Flows Down:  Store → Hook → Component
Events Flow Up:   Component → Hook → Store
```

**✅ Correct:**
```ts
function ProductList() {
  const { products, onSelect } = useProductsData();
  return <div onClick={() => onSelect('1')}>{products.map(...)}</div>;
}
```

**❌ Wrong:**
```ts
function ProductList() {
  const [products, setProducts] = useState([]);
  // Fetching directly in component!
  useEffect(() => {
    setProducts(await api.get('/products'));
  }, []);
}
```

### Backend Constraint: No Data Bypass

**✅ Correct:** Always validate and process
```ts
Route → Controller → Validator → Service → Repository → DB
```

**❌ Wrong:** Skipping layers
```ts
// ❌ Controller skips validator
controller.saveUser(req.body) // No validation!

// ❌ Service bypasses repository
service.query(sql) // Direct DB access!
```

## Cache Management

### Frontend Caching Strategy

```ts
// Store tracks if data is loaded
interface ProductsStore {
  products: Product[];
  loaded: boolean; // not "loading" — "loaded"
  needsRefresh: boolean;
}

// Hook checks cache before fetching
useEffect(() => {
  if (!store.loaded && !store.loading) {
    // Fetch only if not cached and not already loading
    fetch();
  }
}, []);

// Invalidate on mutation
async function createProduct(data: Product) {
  await repository.create(data);
  store.setNeedsRefresh(true); // Invalidate cache
  await refetch(); // Refetch fresh data
}
```

### Backend Caching Strategy

```ts
// Cache expensive queries
export class UserRepository {
  constructor(private cache: CacheProvider) {}

  async getUserWithStats(id: string): Promise<UserWithStats> {
    const cacheKey = `user:stats:${id}`;

    // Check cache
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    // Compute if not cached
    const result = await this.computeStats(id);

    // Store with TTL
    await this.cache.set(cacheKey, result, { ttl: 3600 });

    return result;
  }
}

// Invalidate on mutation
async function updateUser(id: string, data: UpdateUserRequest) {
  await this.repository.update(id, data);
  await this.cache.invalidate(`user:stats:${id}`); // Clear cache
}
```

## Error Propagation

### Frontend Error Handling

```ts
const hook = useProductsData();

// Errors stored in state
if (hook.error) {
  return <ErrorBoundary error={hook.error} onRetry={refetch} />;
}

// Transform errors to user-friendly messages
const userMessage = hook.error === 'NETWORK_ERROR' 
  ? 'Connection failed. Please try again.'
  : hook.error;
```

### Backend Error Handling

```ts
// Service throws domain errors
export class UserService {
  async getUser(id: string): Promise<UserResponse> {
    const user = await this.repository.findById(id);
    if (!user) throw new UserNotFoundError(id); // Domain error
  }
}

// Controller converts to HTTP response
export async function getUser(req: Request, res: Response) {
  try {
    const user = await userService.getUser(req.params.id);
    res.json(user);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
```

## Cross-Feature Communication

### Pattern 1: Orchestrator Module (Backend)

```ts
// /modules/checkout orchestrates multiple features
export class CheckoutService {
  constructor(
    private userService: UserService,
    private orderService: OrderService,
    private paymentService: PaymentService,
  ) {}

  async checkout(userId: string, items: OrderItem[]): Promise<Order> {
    const user = await this.userService.getUser(userId);
    const order = await this.orderService.createOrder(userId, items);
    await this.paymentService.charge(user, order.total);
    return order;
  }
}
```

### Pattern 2: Event-Driven (Decoupled)

```ts
// User module emits events
eventBus.emit('user:created', { userId, email });

// Order module listens
eventBus.on('user:created', async ({ userId }) => {
  await orderService.initializeUserAccount(userId);
});
```

### Pattern 3: Shared Domain Module

```
/modules/identity (shared domain)
├── identity.model.ts
├── identity.service.ts

/modules/user (depends on identity)
/modules/account (depends on identity)
```

## Data Flow Validation Checklist

Backend:
- ✅ Validation before service call
- ✅ Services never handle HTTP
- ✅ Repositories never contain logic
- ✅ Errors logged with context
- ✅ No data bypass

Frontend:
- ✅ Components don't fetch data
- ✅ Hooks manage data fetching
- ✅ Store is single source of truth
- ✅ Cache properly invalidated
- ✅ Errors handled gracefully

Both:
- ✅ Unidirectional flow (no circular)
- ✅ One point of data access per feature
- ✅ Type-safe throughout
- ✅ Testable in isolation
