---
name: testing-quality-assurance
description: Ensure code quality and reliability through comprehensive testing strategies for backend and frontend. Use this when writing tests, setting up test infrastructure, or reviewing test coverage.
---

# Testing & Quality Assurance

## When to Use This Skill

Apply this skill when:
- Writing unit tests for services/hooks
- Creating integration tests for API endpoints
- Adding component tests
- Setting up test infrastructure
- Reviewing test coverage
- Improving test quality

## Backend Testing Strategy

### Unit Tests: Service Layer

**File**: `<feature>.service.spec.ts`

**What to test:**
- Business logic in isolation
- All branches and edge cases
- Error handling paths
- Input validation

**Mock dependencies:**
```ts
// ✅ GOOD: Mock repository, test service logic
describe('UserService', () => {
  let service: UserService;
  let repository: MockUserRepository;

  beforeEach(() => {
    repository = new MockUserRepository();
    service = new UserService(repository);
  });

  it('should return user when found', async () => {
    const user = { id: '1', name: 'John' };
    repository.findById.mockResolvedValue(user);

    const result = await service.getUser('1');

    expect(result).toEqual(user);
  });

  it('should throw NotFoundError when user not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.getUser('1')).rejects.toThrow(NotFoundError);
  });
});
```

### Unit Tests: Repository Layer

**File**: `<feature>.repository.spec.ts`

**What to test:**
- Query construction
- Data transformation
- CRUD operations
- Error scenarios

```ts
describe('UserRepository', () => {
  it('should construct correct query', async () => {
    const repo = new UserRepository(mockDb);
    const spy = jest.spyOn(mockDb, 'query');

    await repo.findById('123');

    expect(spy).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', ['123']);
  });
});
```

### Integration Tests: API Endpoints

**File**: `<feature>.integration.spec.ts`

**What to test:**
- Complete request-response cycle
- Controller → Service → Repository flow
- Error responses
- Status codes and headers

```ts
describe('POST /api/v1/users (Integration)', () => {
  it('should create user and return 201', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({ name: 'John', email: 'john@example.com' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('John');
  });

  it('should return 400 for invalid email', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({ name: 'John', email: 'invalid' })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

## Frontend Testing Strategy

### Component Tests

**File**: `<Feature>.test.tsx`

**What to test:**
- Conditional rendering
- Event handlers
- Props passed to children
- Error and loading states

```ts
describe('ProductList', () => {
  it('should render products', () => {
    const products = [{ id: '1', name: 'Product 1' }];
    const { getByText } = render(<ProductList products={products} loading={false} />);

    expect(getByText('Product 1')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const { getByText } = render(<ProductList products={[]} loading={true} />);

    expect(getByText('Loading...')).toBeInTheDocument();
  });

  it('should call onSelect when product clicked', () => {
    const onSelect = jest.fn();
    const products = [{ id: '1', name: 'Product 1' }];
    const { getByText } = render(
      <ProductList products={products} loading={false} onSelect={onSelect} />
    );

    fireEvent.click(getByText('Product 1'));

    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

### Hook Tests

**File**: `useFeatureData.test.ts`

**What to test:**
- Data fetching on mount
- Loading state transitions
- Error handling
- Cache invalidation

```ts
describe('useProductsData', () => {
  it('should fetch products on mount', async () => {
    const mockRepository = new MockProductsRepository();
    const { result } = renderHook(() => useProductsData(mockRepository));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products.length).toBeGreaterThan(0);
  });

  it('should set error on fetch failure', async () => {
    const mockRepository = new MockProductsRepository();
    mockRepository.fetch.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useProductsData(mockRepository));

    await waitFor(() => {
      expect(result.current.error).toBe('API error');
    });
  });
});
```

### Store/State Tests

**File**: `<Feature>Store.test.ts`

**What to test:**
- Initial state
- State mutations
- Selectors
- Async actions

```ts
describe('ProductsStore', () => {
  it('should initialize empty', () => {
    const store = useProductsStore();
    expect(store.products).toEqual([]);
    expect(store.loading).toBe(false);
  });

  it('should set products', () => {
    const store = useProductsStore();
    const products = [{ id: '1', name: 'Product 1' }];

    store.setProducts(products);

    expect(store.products).toEqual(products);
  });

  it('should filter by category', () => {
    const store = useProductsStore();
    store.setProducts([
      { id: '1', name: 'P1', category: 'electronics' },
      { id: '2', name: 'P2', category: 'books' },
    ]);

    const filtered = store.getByCategory('electronics');

    expect(filtered).toHaveLength(1);
  });
});
```

## Testing Guidelines

### Test Naming Convention

```
should [expected outcome] when [condition]
```

**✅ Good names:**
- `should return user when found`
- `should throw error when email exists`
- `should render loading state when loading is true`

**❌ Bad names:**
- `test user`
- `works`
- `error handling`

### Arrange-Act-Assert Pattern

```ts
// Arrange: Set up test data
const userId = '123';
const mockUser = { id: userId, name: 'John' };
repository.findById.mockResolvedValue(mockUser);

// Act: Call the function
const result = await service.getUser(userId);

// Assert: Verify result
expect(result).toEqual(mockUser);
```

### What NOT to Test

- ❌ Third-party library behavior
- ❌ Framework features (Express routing)
- ❌ External API behavior (mock it)
- ❌ Snapshot tests (brittle)
- ❌ Implementation details

### What TO Test

- ✅ Business logic
- ✅ Error handling
- ✅ Edge cases
- ✅ State transitions
- ✅ User interactions
- ✅ API contracts

## Test Coverage Goals

| Layer | Target |
|-------|--------|
| Services | 80%+ |
| Repositories | 70%+ |
| Controllers | 60%+ |
| Components | 70%+ |
| Hooks | 80%+ |
| **Overall** | **75%+** |

## Test Data Management

### Use Fixtures/Factories

```ts
// tests/fixtures/user.fixture.ts
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: uuid(),
  name: 'Test User',
  email: 'test@example.com',
  ...overrides,
});

// Usage
const user = createMockUser({ email: 'custom@example.com' });
```

### Mock External Dependencies

```ts
// ✅ Mock API calls
jest.mock('@/services/api', () => ({
  fetchUser: jest.fn().mockResolvedValue({ id: '1', name: 'John' }),
}));

// ✅ Mock database
const mockDb = {
  query: jest.fn(),
  close: jest.fn(),
};
```

## Test Execution

### Commands

```bash
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
npm run test:ci          # CI environment
```

### CI/CD Integration

Before merge, verify:
- ✅ All tests pass: `npm run test`
- ✅ Coverage meets target: `npm run test:coverage`
- ✅ No flaky tests: Run twice
- ✅ Performance: Tests complete in < 5 minutes

## Quality Checklist

Before committing tests:
- ✅ Clear, descriptive test names
- ✅ Tests are independent (no shared state)
- ✅ Proper mocking and stubbing
- ✅ Good error messages
- ✅ Edge cases covered
- ✅ Both happy path and error paths
- ✅ Performance acceptable
- ✅ No duplicate tests
