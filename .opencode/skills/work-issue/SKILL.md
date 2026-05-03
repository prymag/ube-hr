---
name: work-issue
description: Implement a GitHub issue end-to-end. Provide an issue number and the agent fetches the issue, explores the codebase, plans the work, implements it, verifies it, and posts a completion comment. Use when user says "work on issue #N", "implement issue #N", or "fix issue #N".
---

# Skill: work-issue

Given a GitHub issue number, implement it fully — schema, backend, frontend, tests — following all project conventions from `AGENTS.md`.

## Process

### 1. Fetch the issue

```bash
gh issue view <number> --comments
```

Read the full issue body and all comments. Identify:
- **What to build** (acceptance criteria)
- **Blocked by** (do not start if blockers are open — inform the user)
- **Parent issue** (for additional context; fetch it too if present)

### 2. Explore the codebase

Explore only what is relevant to the issue. Use Glob and Grep to find affected files. Read the files you will modify. Do NOT explore the entire repo.

Identify all files that need to change across every layer:
- Prisma schema / migrations
- `libs/feature` services and modules
- `libs/shared` wire types and permissions
- `apps/api` controllers, DTOs, integration specs
- `apps/web` API clients, queries, components, pages, routes

### 3. Plan with TodoWrite

Break the work into atomic tasks and add them to the todo list **before writing any code**. Use the implementation order from `AGENTS.md`:

1. Shared types (`libs/shared`)
2. Schema + migration (if needed)
3. Backend service (`libs/feature`)
4. Backend controller + DTOs (`apps/api`)
5. Backend tests
6. Frontend API client + queries (`apps/web`)
7. Frontend components + pages (`apps/web`)
8. Lint + typecheck + build verification

Mark each todo `in_progress` when you start it and `completed` immediately when done.

### 4. Implement

Follow all conventions from `AGENTS.md`:

- **Services never receive or return DTOs** — mapping happens only in the controller.
- **Wire types** live in `libs/shared/src/models.ts` (plain string unions, no Prisma enums).
- **DTOs** live in `apps/api/src/app/<entity>/dto/` and never leave the API layer.
- **Soft deletes**: always filter `deletedAt: null`.
- **Permissions**: guard routes with `@RequirePermission()` using constants from `libs/shared`.
- **Radix UI**: never use `value=""` on `SelectItem` — use a sentinel string.
- **No modals for CRUD**: use dedicated pages for Create/Update; modals only for Delete confirmation.
- **Nx generators**: prefer generators over hand-written files; always `--dry-run` first.

### 5. Verify

Run in this order, fixing any failures before moving on:

```bash
# Lint
npx nx lint <affected-project>

# Type check
npx nx run-many -t typecheck

# Unit tests (if service was modified)
npx nx test feature --testFile=<path>

# Integration tests (if controller was modified)
npx nx test api --testFile=<path>

# Build
npx nx build <affected-project>
```

### 6. Post a completion comment

When all acceptance criteria are met and verification passes, post a comment on the issue:

```bash
gh issue comment <number> --body "..."
```

The comment must include:
- A brief summary of what was implemented.
- Which acceptance criteria are now met (tick each one).
- Any deviations from the original plan and why.
- Verification output (lint/typecheck/test/build pass confirmation).

Do NOT close the issue — leave that to the human reviewer.
