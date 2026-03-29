---
name: feature-planning-coordination
description: High-level planning and coordination for full-stack features. Use this when planning new features, breaking down work into frontend and backend tasks, designing API contracts, managing dependencies, and coordinating cross-team implementation.
---

# Feature Planning & Coordination

## When to Use This Skill

Apply this skill when:
- Planning a new full-stack feature
- Breaking down work into frontend/backend tasks
- Designing API contracts before implementation
- Managing dependencies between frontend and backend
- Coordinating feature rollout and integration
- Creating feature implementation plans
- Handling cross-feature dependencies
- Planning database schema changes

---

## Feature Planning Framework

### Phase 1: Requirements & Scope

**Define the Feature:**
- What is the user problem being solved?
- What are the acceptance criteria?
- What is in scope vs. out of scope?
- What are the business constraints?

**Example:**
```
Feature: User Profile Management
Problem: Users need to view and edit their profiles
Acceptance Criteria:
- Users can view their profile (name, email, avatar)
- Users can edit name and avatar
- Changes are persisted immediately
- Toast notification on save
In Scope: Profile view, edit, save
Out of Scope: Password change, email verification
```

### Phase 2: API Contract Design

**Define the API Before Implementation**

Do this FIRST, with both frontend and backend stakeholders.

```markdown
## API Contract

### GET /api/v1/users/profile
Fetch current user's profile

Response (200):
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "avatar": "string (URL)",
  "createdAt": "ISO8601"
}

Errors:
- 401: Unauthorized
- 404: User not found

---

### PATCH /api/v1/users/profile
Update user profile

Request:
{
  "name": "string (optional)",
  "avatar": "string (URL, optional)"
}

Response (200):
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "avatar": "string",
  "updatedAt": "ISO8601"
}

Errors:
- 400: Validation error
- 401: Unauthorized
- 422: Conflict (name already taken)
```

**Parallel Work Can Begin**: Once API contract is finalized, frontend and backend can work independently.

---

## Breakdown: Frontend vs Backend Tasks

### Backend Tasks

**1. Database Schema (Day 1)**
```prisma
model UserProfile {
  id        String   @id @default(uuid())
  userId    String   @unique
  name      String
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**2. Create Module Structure** (`/modules/user-profile`)
```
/modules/user-profile
├── user-profile.routes.ts       # API routes
├── user-profile.controller.ts   # HTTP handling
├── user-profile.service.ts      # Business logic
├── user-profile.repository.ts   # Data access
├── user-profile.model.ts        # Types
├── user-profile.validator.ts    # Validation
└── index.ts                      # Public API
```

**3. Implement Module**
- [ ] Create schema and run migration
- [ ] Build repository (fetch, update)
- [ ] Build service (business logic)
- [ ] Build validators (Zod schemas)
- [ ] Build controller (route handlers)
- [ ] Build routes (GET, PATCH)
- [ ] Write integration tests
- [ ] Document API endpoints

**Dependency**: None (can start immediately)

---

### Frontend Tasks

**1. Create Feature Structure** (`/features/profile`)
```
/features/profile
├── views/
│   ├── ProfileView.tsx       # Main view
│   ├── ProfileEditor.tsx     # Edit form
├── hooks/
│   └── useProfileData.ts     # Data fetching
├── services/
│   ├── ProfileRepository.ts  # API calls
│   └── ProfileManager.ts     # Business logic
├── store/
│   └── profileStore.ts       # State
├── types/
│   └── profile.types.ts      # Types
└── index.ts                  # Public API
```

**2. Implement Components**
- [ ] Define types (Profile, ProfileState)
- [ ] Build ProfileRepository (API calls)
- [ ] Build ProfileManager (business logic)
- [ ] Build profileStore (Zustand)
- [ ] Build useProfileData hook
- [ ] Build ProfileView component
- [ ] Build ProfileEditor component
- [ ] Add error handling
- [ ] Add loading states
- [ ] Write integration tests

**Dependency**: API contract (blocking)

**Blocker Removed When**: Backend publishes API contract and demo endpoint

---

## Task Dependency Graph

```
API Contract Design (Day 1)
    ↓
    ├─→ Backend: Schema & Migration
    │   ├─→ Repository layer
    │   ├─→ Service layer
    │   ├─→ Controller layer
    │   ├─→ Routes & Tests
    │   └─→ API Ready (Day 3-4)
    │
    └─→ Frontend: Types & Services
        ├─→ Hook setup
        ├─→ Store setup
        ├─→ Components (blocked until API ready)
        └─→ Integration tests
            └─→ Feature Ready (Day 5-6)
```

---

## Implementation Checklist

### Pre-Implementation
- [ ] Feature requirements defined
- [ ] API contract designed and approved
- [ ] Database schema designed
- [ ] Feature modules/folders planned
- [ ] Task list created

### Backend Implementation
- [ ] Database migration
- [ ] Repository module complete
- [ ] Service module complete
- [ ] Validator module complete
- [ ] Controller module complete
- [ ] Routes module complete
- [ ] Integration tests written
- [ ] API documented
- [ ] Demo endpoint available

### Frontend Implementation
- [ ] Types defined
- [ ] Repository module complete
- [ ] Manager module complete
- [ ] Store module complete
- [ ] Hook module complete
- [ ] Components built
- [ ] Error handling
- [ ] Loading states
- [ ] Integration tests
- [ ] Component tests (critical paths only)

### Integration & Testing
- [ ] Frontend connects to backend API
- [ ] End-to-end flow tested
- [ ] Error cases handled
- [ ] Loading states work
- [ ] Network retry logic
- [ ] Stale state handling

### Documentation
- [ ] API documentation updated
- [ ] Feature README created
- [ ] Implementation notes documented
- [ ] Deployment notes (if needed)

---

## Task Template

Use this for planning features:

```markdown
# [Feature Name] - Implementation Plan

## Overview
[Brief description]

## Requirements
- [Requirement 1]
- [Requirement 2]

## API Contract

### GET /api/v1/[resource]
[Description]

Response: [Schema]

### POST /api/v1/[resource]
[Description]

---

## Backend Tasks

### 1. Database & Schema
- [ ] Design schema
- [ ] Create migration
- [ ] Estimated: 2 hours

### 2. Module Setup
- [ ] Create folder structure
- [ ] Create files
- [ ] Estimated: 1 hour

### 3. Implementation
- [ ] Repository
- [ ] Service
- [ ] Validator
- [ ] Controller
- [ ] Routes
- [ ] Estimated: 4-6 hours

### 4. Testing
- [ ] Integration tests
- [ ] Estimated: 2 hours

**Total Backend**: ~10-12 hours
**Blocker For**: Frontend

---

## Frontend Tasks

### 1. Feature Setup
- [ ] Create folder structure
- [ ] Define types
- [ ] Estimated: 1 hour

### 2. Data Layer
- [ ] Repository
- [ ] Manager
- [ ] Estimated: 2 hours
**Blocked Until**: Backend API ready

### 3. State Management
- [ ] Store setup
- [ ] Hook setup
- [ ] Estimated: 2 hours

### 4. UI Implementation
- [ ] Components
- [ ] Error handling
- [ ] Loading states
- [ ] Estimated: 3-4 hours

### 5. Testing
- [ ] Integration tests
- [ ] Estimated: 2 hours

**Total Frontend**: ~10-12 hours
**Depends On**: API contract (start), backend API (unblock)

---

## Integration Plan

### Step 1: API Contract Review (Day 1)
- [ ] Finalize request/response schemas
- [ ] Both teams approve
- [ ] Document examples

### Step 2: Parallel Development (Days 2-3)
- Backend: Implement module
- Frontend: Implement except API calls

### Step 3: Backend Ready (Day 4)
- [ ] API endpoints available
- [ ] Integration tests passing
- [ ] Documentation complete

### Step 4: Frontend Integration (Day 4-5)
- [ ] Connect to real API
- [ ] Test end-to-end
- [ ] Handle errors

### Step 5: Testing & Refinement (Day 5-6)
- [ ] QA testing
- [ ] Bug fixes
- [ ] Performance review

### Step 6: Deployment (Day 6+)
- [ ] Backend deployment
- [ ] Frontend deployment
- [ ] Monitoring

---

## Cross-Feature Dependencies

### When Feature A Depends on Feature B

```
Feature A (User Profiles)
  └─ Feature B (User Authentication)
```

**Plan:**
1. Feature B must be completed first
2. Feature A development can't start until Feature B API is ready
3. Use Feature B's public API (from `/modules/auth/index.ts`)
4. Document the dependency

```ts
// Feature A uses Feature B
import { authService } from '@/modules/auth';
import type { User } from '@/modules/auth';

export async function getUserWithAuth(id: string) {
  const user = await this.repository.getUser(id);
  const isVerified = authService.isEmailVerified(user);
  return { ...user, isVerified };
}
```

### Circular Dependency? Use Orchestrator

```
Feature A: User Management
Feature B: Profile Management

Both need to reference each other?
→ Create Feature C: User-Profile Orchestrator
```

---

## Communication Plan

### Pre-Implementation Meeting
**Participants**: Frontend lead, Backend lead, Product

**Agenda**:
1. Feature requirements review
2. API contract design
3. Database schema review
4. Task breakdown
5. Dependency identification
6. Timeline agreement

**Output**: Signed-off API contract, task list, timeline

### Daily Standup (If Parallel)
**Questions**:
- What did backend complete?
- What is frontend blocked on?
- Are there API changes?
- Is there anything else frontend needs?

### Integration Sync (When Backend Ready)
**Agenda**:
1. Demo backend API
2. Review actual vs expected responses
3. Identify discrepancies
4. Plan fixes

**Output**: Frontend can now integrate

### Pre-Release Review
**Checklist**:
- [ ] API contract matches implementation
- [ ] Error handling complete
- [ ] Loading states working
- [ ] Performance acceptable
- [ ] No hardcoded secrets
- [ ] Documentation updated
- [ ] Tests passing

---

## Common Gotchas

### ❌ Gotcha 1: API Contract Changes Mid-Development
**Prevention**: Finalize contract before any development starts
**Solution**: If changes needed, discuss with both teams first

### ❌ Gotcha 2: Frontend Assumes Backend Behavior
**Prevention**: Document API contract explicitly
**Solution**: Use API spec as source of truth, not assumptions

### ❌ Gotcha 3: Inconsistent Error Handling
**Prevention**: Define error response format in API contract
**Solution**: Frontend handles all documented error codes

### ❌ Gotcha 4: Missing Integration Testing
**Prevention**: Plan integration tests early
**Solution**: Both teams write tests against API contract

### ❌ Gotcha 5: Performance Issues Discovered Late
**Prevention**: Consider performance during planning
**Solution**: Plan pagination, filtering, caching upfront

### ❌ Gotcha 6: Deployment Timing Mismatch
**Prevention**: Coordinate deployment timeline
**Solution**: Deploy backend first, then frontend

---

## Planning Checklist

Use this before starting any feature:

- [ ] Requirements gathered and documented
- [ ] Feature scope defined (in/out)
- [ ] API contract designed and reviewed
- [ ] Database schema designed
- [ ] Module structure planned
- [ ] Task list created with time estimates
- [ ] Dependencies identified
- [ ] Frontend blockers identified
- [ ] Communication plan defined
- [ ] Testing strategy planned
- [ ] Deployment plan documented
- [ ] Team alignment confirmed

---

## Quick Reference: What Goes Where

| Aspect | Owner | Timing |
|--------|-------|--------|
| **API Contract** | Both | Day 1 |
| **Database Schema** | Backend | Day 1 |
| **Module Structure** | Both | Day 1 |
| **Implementation** | Both | Days 2-4 |
| **Integration** | Both | Days 4-5 |
| **Testing** | Both | Throughout |
| **Deployment** | DevOps | Day 6+ |

---

## Tips for Success

1. **API Contract First**: Never start backend without contract approval
2. **Clear Dependencies**: Document what blocks what
3. **Daily Sync**: Quick standup if working in parallel
4. **Integration Testing**: Test API contract, not implementation
5. **Error Handling**: Define all errors upfront
6. **Documentation**: Keep API docs in sync with code
7. **Deployment Coordination**: Backend first, then frontend
8. **Feature Flags**: Plan rollout strategy for large features
9. **Monitoring**: Plan metrics/logging before deployment
10. **Communication**: Overcommunicate during parallel work
