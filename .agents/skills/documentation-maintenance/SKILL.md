---
name: documentation-maintenance
description: Keep documentation synchronized with code implementation and ensure comprehensive, accurate documentation across the project. Use this when implementing features, making architectural decisions, or updating documentation.
---

# Documentation Maintenance

## When to Use This Skill

Apply this skill when:
- Implementing new features (update docs after)
- Refactoring code
- Making architectural decisions
- Changing API contracts
- Onboarding team members
- Reviewing PRs with documentation gaps

## Documentation Hierarchy

### 1. Architecture Documentation

**Location**: `/docs/` directory

**Core files to maintain:**
- `backend-folder-structure.md` — Backend module patterns
- `frontend-folder-structure.md` — Frontend feature patterns
- `api-contracts.md` — API endpoints and schemas
- `data-flow.md` — System-wide data flow
- `dependency-rules.md` — Allowed/forbidden patterns

**Update triggers:**
- Major architectural changes
- New pattern adoption
- Anti-pattern discovery
- Structure refactoring

**Format:**
- Use Markdown with clear sections
- Include diagrams (Mermaid/ASCII)
- Provide examples
- Link to related docs

### 2. Module-Level Documentation

**Location**: Within each module/feature as `README.md`

**Backend module README:**
```
/modules/user/
├── README.md              ← Module documentation
├── user.routes.ts
├── user.service.ts
└── ...
```

**File structure:**
```markdown
# User Module

## Purpose
Manages user accounts, authentication, and profiles.

## Public API
- `userService` — User business logic
- `User` type — User entity

## Dependencies
- `@/shared/utils` — Logging, hashing
- `@/providers/database` — Data persistence

## Common Use Cases
1. Create new user
2. Get user by ID
3. Update user profile

## Integration Example
```ts
import { userService, type User } from '@/modules/user';
const user = await userService.getUser(userId);
```

## Testing
- Services: tests/user.service.spec.ts
- Integration: tests/user.integration.spec.ts
```

**Frontend feature README:**
```
/features/products/
├── README.md              ← Feature documentation
├── views/
├── hooks/
└── ...
```

### 3. Code-Level Documentation

#### Inline Comments (Minimal)

**Rule: Comment WHY, not WHAT**

```ts
// ✅ GOOD: Explains business decision
// Email verification requires 30-day holding period
// to prevent fraudulent account signups
if (!user.emailVerifiedAt || Date.now() - user.emailVerifiedAt < 30 * 24 * 60 * 60 * 1000) {
  return 0; // Not eligible for loyalty points
}

// ❌ AVOID: Obvious from code
// Get the loyalty points
const points = calculateLoyaltyPoints(user);
```

#### Function Documentation (JSDoc/TSDoc)

```ts
/**
 * Calculate loyalty points for a user based on verification status
 * 
 * @param user - User object with verification info
 * @returns Loyalty points (0 if not eligible)
 * @throws UserNotFoundError if user ID is invalid
 * 
 * @example
 * const points = await calculateLoyaltyPoints(user);
 * if (points > 100) { ... }
 */
export async function calculateLoyaltyPoints(user: User): Promise<number> {
  // Implementation
}
```

#### Type Documentation

```ts
/**
 * Represents a user in the system
 */
export interface User {
  /** Unique identifier (UUID v4 format) */
  id: string;

  /** User's full name (required, max 100 chars) */
  name: string;

  /** User's email address (must be unique, valid email) */
  email: string;

  /** User role with associated permissions */
  role: 'admin' | 'moderator' | 'user';

  /** Email verification timestamp, null if unverified */
  emailVerifiedAt: ISO8601 | null;

  /** Resource creation timestamp */
  createdAt: ISO8601;

  /** Last update timestamp */
  updatedAt: ISO8601;

  /** Soft delete timestamp, null if active */
  deletedAt: ISO8601 | null;
}
```

## API Documentation

### Endpoint Documentation Template

```markdown
### POST /api/v1/users

**Description**: Create a new user account in the system

**Authentication**: Not required (public endpoint)

**Permissions**: None required

**Request Body**:
```json
{
  "name": "string (required, max 100 chars)",
  "email": "string (required, unique, valid email)",
  "password": "string (required, min 8 chars, must include uppercase + number)"
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "createdAt": "2024-03-28T23:22:34.431Z",
  "updatedAt": "2024-03-28T23:22:34.431Z"
}
```

**Error Responses**:

- **400 Bad Request** — Validation failed
  ```json
  { "error": { "code": "VALIDATION_ERROR", "details": { "email": "Invalid email" } } }
  ```

- **409 Conflict** — Email already exists
  ```json
  { "error": { "code": "DUPLICATE_EMAIL", "message": "User with this email already exists" } }
  ```

- **500 Internal Server Error** — Server error
  ```json
  { "error": { "code": "INTERNAL_ERROR", "message": "Failed to create user" } }
  ```

**Example**:
```bash
curl -X POST https://api.example.com/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```
```

### Generate from Code

Use tools to auto-generate:
- **OpenAPI/Swagger**: From controller decorators
- **GraphQL**: From schema definitions
- **JSDoc**: From function comments

```bash
npm run docs:generate  # Generate API docs
npm run docs:validate  # Check docs against code
```

## Documentation Sync Strategy

### When Code Changes, Update Docs

| Code Change | Documentation Update |
|-------------|----------------------|
| New endpoint added | Add endpoint docs |
| Data model changed | Update type docs |
| Module created | Create module README |
| API deprecated | Mark as deprecated, set migration path |
| Dependency added/removed | Update dependency docs |
| Error handling changed | Update error docs |
| Major refactor | Update architecture docs |

### Version Control for Docs

```markdown
## Version History

### v2.0 (2024-03-28)
- **Breaking**: Removed `/v1/users` endpoint (use `/v2/users`)
- **New**: Added email verification requirement
- **New**: Added user roles (admin, moderator, user)
- **Deprecated**: `lastLogin` field (use `updatedAt`)

### v1.5 (2024-01-15)
- Added email verification check
- Added user caching (performance improvement)
- Fixed timezone handling in timestamps
```

## Documentation Quality Checklist

### Completeness
- ✅ Every module has a README
- ✅ All public API functions documented
- ✅ All API endpoints fully documented
- ✅ Type definitions have descriptions
- ✅ Architecture patterns explained
- ✅ Common errors documented
- ✅ Integration examples provided
- ✅ Dependencies listed

### Accuracy
- ✅ Examples actually work
- ✅ Types match implementation
- ✅ API docs match code
- ✅ Endpoints are current
- ✅ Error codes are accurate
- ✅ No outdated information
- ✅ Links are not broken

### Clarity
- ✅ Written for target audience
- ✅ Plain language explanations
- ✅ Code examples included
- ✅ Common gotchas noted
- ✅ Visual diagrams where helpful
- ✅ Consistent terminology
- ✅ Cross-references provided

### Organization
- ✅ Logical structure
- ✅ Easy to navigate
- ✅ Table of contents present
- ✅ Consistent formatting
- ✅ Proper heading hierarchy
- ✅ Clear sections

## Documentation Tools

### Recommended Stack

- **API Docs**: OpenAPI/Swagger, Postman
- **Architecture**: Markdown + Mermaid diagrams
- **Code Docs**: JSDoc/TSDoc comments
- **Decision Logs**: ADR (Architecture Decision Record) format
- **Type Docs**: TypeScript interfaces with comments

### Automation Commands

```bash
npm run docs:generate   # Generate API docs from code
npm run docs:validate   # Check docs sync with code
npm run docs:serve      # Serve documentation locally
npm run docs:build      # Build static documentation site
```

## Documentation Review Checklist

Before merging code:

- ✅ API docs updated (if endpoints changed)
- ✅ Types documented (if models changed)
- ✅ Module README current (if functionality changed)
- ✅ Architecture docs updated (if structure changed)
- ✅ Examples work (tested)
- ✅ No broken links
- ✅ Version/changelog entry added
- ✅ Deprecations marked if applicable
- ✅ Migration path documented (if breaking)
- ✅ Comments explain "why", not "what"

## Documentation Template Files

### Module README Template

```markdown
# [Module Name] Module

## Overview
Brief description of what this module does.

## Features
- Feature 1
- Feature 2

## Public API
```ts
export { mainService } from './main.service';
export type { MainEntity } from './main.model';
```

## Usage Example
```ts
import { mainService } from '@/modules/main';
const result = await mainService.doSomething();
```

## Testing
- Unit tests: `/tests/main.service.spec.ts`
- Integration tests: `/tests/main.integration.spec.ts`

## Dependencies
- `@/shared/utils`
- `@/providers/database`

## Related Documentation
- See `docs/backend-folder-structure.md` for architecture
```

### PR Documentation Checklist

Include in PR description:
- [ ] API changes documented
- [ ] Breaking changes marked with ⚠️
- [ ] Migration guide provided (if breaking)
- [ ] Examples updated
- [ ] Type changes documented
- [ ] Error handling documented
- [ ] Performance notes (if applicable)
