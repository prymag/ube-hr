# Report: Phase 2 - Task 12: User Management Service Layer

## Summary
Implemented `UsersService` with full business logic for user management: `createUser`, `updateUser`, `deleteUser`, and `listUsers`. Includes role-based permission checks, password hashing delegation to `AuthService`, duplicate-email detection, and password stripping on all returned objects.

## Files Created
- `backend/src/modules/users/users.service.ts` — UsersService class
- `backend/src/modules/users/__tests__/users.service.test.ts` — 32 integration tests

## Files Modified
- `backend/src/modules/users/index.ts` — Added `UsersService` and `SafeUser` exports
- `specs/authentication/tasks.md` — Task 12 marked ✅ DONE

## Implementation Details

### Key Design Decisions

**Permission model** enforced at service layer:
| Actor | Create USER | Create ADMIN | Create SYSTEM_ADMIN | Update SYSTEM_ADMIN | Assign elevated role | Delete USER |
|-------|-------------|--------------|----------------------|---------------------|----------------------|-------------|
| USER | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ADMIN | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| SYSTEM_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

SYSTEM_ADMIN delete is additionally blocked at the repository layer regardless of actor.

**`SafeUser` interface** — password-free shape returned by all service methods:
```ts
export interface SafeUser {
  id: string; email: string; firstName: string; lastName: string;
  role: Role; createdAt: Date; updatedAt: Date;
}
```

**`stripPassword`** — private helper that destructures `password` out of any returned Prisma record before exposing it to callers.

**`createUser`**
1. Check actor is ADMIN or SYSTEM_ADMIN (throws `'Insufficient permissions to create users'`)
2. Check ADMIN isn't assigning elevated role (throws `'ADMIN cannot assign ADMIN or SYSTEM_ADMIN role'`)
3. Check email uniqueness (throws `'A user with this email already exists'`)
4. Hash password via `authService.hashPassword`
5. Delegate to `repository.create`, strip password, return `SafeUser`

**`updateUser`**
1. Check actor is elevated (throws if USER)
2. Fetch target user; throw `'User not found'` if absent
3. ADMIN guards: block modifying SYSTEM_ADMIN target; block assigning elevated roles
4. Hash password only if `data.password !== undefined`
5. Delegate to `repository.update`, strip password, return `SafeUser`

**`deleteUser`**
1. Check actor is elevated
2. Delegate to `repository.delete` (which enforces SYSTEM_ADMIN protection internally)

**`listUsers`**
- Delegates to `repository.findAll` with filters/pagination
- Maps result data through `stripPassword`

## Tests
- **File:** `__tests__/users.service.test.ts`
- **Tests:** 32 / **Passed:** 32 / **Failed:** 0

| Suite | Tests |
|-------|-------|
| createUser | 10 (role permissions × 3, ADMIN restrictions × 2, USER denied, duplicate email, password hashing, password stripped) |
| updateUser | 11 (SYSTEM_ADMIN full access × 2, ADMIN allowed, ADMIN blocked × 3, USER denied, not found, password hashed, not hashed, stripped) |
| deleteUser | 5 (SYSTEM_ADMIN, ADMIN, USER denied, SYSTEM_ADMIN target propagates, not-found propagates) |
| listUsers | 4 (returns without password, passes filters, passes pagination, strips all items) |
| Class contract | 2 |

## Verification
- `npx jest --testPathPatterns="users.service" --no-coverage` → 32/32 pass

## Notes
- Password hashing is deliberately not duplicated in the service — it delegates to `AuthService.hashPassword` to keep the hashing logic centralised and consistent with the auth flow.
- `listUsers` has no `actorRole` parameter because route-level `authorize(['ADMIN', 'SYSTEM_ADMIN'])` middleware is sufficient; adding it would add complexity without benefit.
