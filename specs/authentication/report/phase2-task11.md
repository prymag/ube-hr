# Report: Phase 2 - Task 11: User Management Repository Layer

## Summary
Implemented `UsersRepository` extending `AuthRepository` with role-aware CRUD and SYSTEM_ADMIN-protected delete. Created module directory structure, repository, unit tests, and `index.ts` public API.

## Files Created
- `backend/src/modules/users/users.repository.ts` — UsersRepository class
- `backend/src/modules/users/__tests__/users.repository.test.ts` — 21 unit tests
- `backend/src/modules/users/index.ts` — module public API

## Files Modified
- `specs/authentication/tasks.md` — Task 11 marked ✅ DONE

## Implementation Details

### Key Changes

**`users.repository.ts`**

`UsersRepository` extends `AuthRepository` and stores its own `db` reference to the injected `PrismaClient` (since `AuthRepository.prisma` is `private`). This avoids modifying the already-complete base class.

```ts
export class UsersRepository extends AuthRepository {
  private readonly db: PrismaClient;

  constructor(prisma: PrismaClient) {
    super(prisma);
    this.db = prisma;
  }
  // ...
}
```

New DTOs add the `role` field:
```ts
export interface UsersCreateInput { ..., role?: Role }
export interface UsersUpdateInput { ..., role?: Role }
export interface UsersFilters     { ..., role?: Role }
```

**`findAll`** — builds a `where` clause including `role`, `email`, `firstName`, `lastName` filters. Uses `select` to explicitly exclude the `password` field from list results.

**`create`** — spreads the role into the Prisma `data` object only when provided (schema default kicks in otherwise).

**`update`** — uses `!== undefined` guards (not truthiness) so falsy-but-valid values like empty strings are handled correctly.

**`delete`** — fetches the user first:
- Throws `'User not found'` if absent
- Throws `'Cannot delete a SYSTEM_ADMIN account'` if role is `SYSTEM_ADMIN`
- Proceeds with `prisma.user.delete` otherwise

## Tests
- **File:** `__tests__/users.repository.test.ts`
- **Tests:** 21 / **Passed:** 21 / **Failed:** 0

| Suite | Tests |
|-------|-------|
| findById | 2 |
| findAll | 7 (no filters, role, email, firstName+lastName, role+email, pagination, no-password) |
| create | 3 (no role, ADMIN role, SYSTEM_ADMIN role) |
| update | 3 (scalar, role, multiple) |
| delete | 4 (USER, ADMIN, SYSTEM_ADMIN guard, not-found guard) |
| Class contract | 2 |

## Verification
- `npx jest --testPathPatterns="users.repository" --no-coverage` → 21/21 pass

## Notes
- `password` is excluded from `findAll` select to avoid leaking hashes in list responses. `findById` (used by auth flows) still returns the full record including hash.
- SYSTEM_ADMIN protection is enforced at the repository layer so it cannot be bypassed by any service calling through this repo.
