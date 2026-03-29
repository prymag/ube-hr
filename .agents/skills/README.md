# Copilot Skills for ube-hr Project

These skills enable Copilot to provide specialized guidance and code generation aligned with the project's modular architecture and development standards.

## 📚 Available Skills

### 0. **Feature Planning & Coordination** (`/feature-planning-coordination`) 🎯
High-level planning and coordination for full-stack features across frontend and backend.

**When to use:**
- Planning new features end-to-end
- Breaking down work into frontend/backend tasks
- Designing API contracts before implementation
- Managing dependencies between frontend and backend
- Coordinating feature rollout and integration
- Identifying task blockers and timelines

**Key areas:** API contracts, task breakdown, dependency management, cross-team coordination, integration planning

---

### 1. **Modular Architecture Mastery** (`/modular-architecture-mastery`)
Enforce strict modular (feature-based) architecture across backend modules and frontend features.

**When to use:**
- Creating new features or modules
- Refactoring existing code
- Reviewing for architectural compliance
- Detecting circular dependencies

**Key areas:** Module boundaries, import rules, dependency direction, cross-feature communication

---

### 2. **Full-Stack Code Generation** (`/full-stack-code-generation`)
Generate production-ready code following strict layer and data flow patterns.

**When to use:**
- Building new features from scratch
- Adding API endpoints
- Creating React components
- Refactoring monolithic code

**Key areas:** Layer responsibilities, data flow, code quality standards, generation order

---

### 3. **TypeScript Type System** (`/typescript-type-system`)
Design robust types with proper type safety across module boundaries.

**When to use:**
- Designing features and types
- Adding API endpoints with DTOs
- Creating typed React components
- Reviewing type safety

**Key areas:** Type categories, shared types, type leaks, frontend/backend type patterns

---

### 4. **Testing & Quality Assurance** (`/testing-quality-assurance`)
Ensure code reliability through comprehensive testing strategies.

**When to use:**
- Writing integration tests for API endpoints
- Testing critical business logic
- Setting up test infrastructure
- Reviewing test coverage

**Key areas:** API endpoint testing, critical path validation, integration test patterns

---

### 5. **State Management & Data Flow** (`/state-management-data-flow`)
Design clear, unidirectional data flow and state management.

**When to use:**
- Implementing features with state
- Adding API endpoints
- Managing state (Zustand/Redux)
- Debugging data consistency

**Key areas:** Request lifecycle, layer constraints, caching, error propagation, cross-feature communication

---

### 6. **API Contract Design** (`/api-contract-design`)
Design clear, versioned, well-documented API contracts.

**When to use:**
- Designing new endpoints
- Modifying existing APIs
- Adding pagination/filtering
- Handling errors
- Versioning APIs

**Key areas:** HTTP methods, request/response structure, error responses, pagination, authentication

---

### 7. **Dependency & Import Management** (`/dependency-import-management`)
Enforce strict import rules and prevent circular dependencies.

**When to use:**
- Reviewing imports for violations
- Detecting circular dependencies
- Adding cross-module dependencies
- Refactoring imports

**Key areas:** Import rules, public API pattern, dependency direction, circular dependency resolution

---

### 8. **Documentation Maintenance** (`/documentation-maintenance`)
Keep documentation synchronized with code and ensure completeness.

**When to use:**
- Implementing new features
- Refactoring code
- Making architectural decisions
- Updating documentation

**Key areas:** Documentation hierarchy, API docs, type docs, version control, quality checklist

---

### 9. **Security & Secrets Management** (`/security-secrets-management`) 🔐
Enforce strict security practices for secrets management and sensitive data.

**When to use:**
- Generating code with API keys or credentials
- Setting up authentication (JWT, OAuth, API keys)
- Creating database connections
- Configuring external integrations
- Reviewing code for security vulnerabilities

**Key areas:** Environment variables, secrets handling, no hardcoding rule, logging safety, secret rotation

---

## 🚀 How to Use Skills

### Invoke a Specific Skill

In your prompt to Copilot, reference a skill by name:

```
Use the /modular-architecture-mastery skill to organize this new user feature.
```

### List Available Skills

```
What skills do you have?
```

### Enable/Disable Skills

```
/skills
```

Then use arrow keys and spacebar to toggle skills on/off.

---

## 📊 Quick Reference

| Skill | File | Focus Area |
|-------|------|-----------|
| **Planning** 🎯 | `feature-planning-coordination` | **Feature planning, coordination** |
| Architecture | `modular-architecture-mastery` | Module organization, boundaries |
| Code Generation | `full-stack-code-generation` | Feature implementation |
| Types | `typescript-type-system` | Type safety, DTOs |
| Testing | `testing-quality-assurance` | Integration tests, critical logic |
| State | `state-management-data-flow` | Data flow, state patterns |
| APIs | `api-contract-design` | Endpoint design, versioning |
| Imports | `dependency-import-management` | Dependency management |
| Docs | `documentation-maintenance` | Documentation sync |
| **Security** 🔐 | `security-secrets-management` | **Secrets, env vars, credentials** |

---

## 🎯 Common Scenarios

**Planning a full-stack feature:**
```
Use the /feature-planning-coordination skill to plan a new user dashboard,
including API contract design, task breakdown, and frontend/backend dependencies.
```

**Starting a new feature:**
```
Use the /modular-architecture-mastery and /full-stack-code-generation skills 
to help me structure a new user authentication feature.
```

**Debugging data flow issues:**
```
Use the /state-management-data-flow and /dependency-import-management skills 
to help me trace why this data isn't updating correctly.
```

**Designing API endpoints:**
```
Use the /api-contract-design and /full-stack-code-generation skills 
to help me design the endpoints for product management.
```

**Setting up tests:**
```
Use the /testing-quality-assurance skill to help me write integration tests 
for the API endpoints.
```

**Handling authentication and secrets:**
```
Use the /security-secrets-management and /full-stack-code-generation skills 
to set up JWT authentication with proper secret management.
```

---

## 📝 Maintenance

Skills are automatically loaded by Copilot based on the directory structure in `.agents/skills/`.

Each skill has a unique directory with:
- `SKILL.md` — The skill definition with instructions and patterns

Skills are defined following [GitHub's Copilot Skill Format](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/create-skills).

---

## 🔗 Project Architecture References

- **Backend Structure:** `/docs/backend-folder-structure.md`
- **Frontend Structure:** `/docs/frontend-folder-structure.md`
- **AGENTS Instructions:** `/AGENTS.md`

---

Last updated: 2024-03-29
