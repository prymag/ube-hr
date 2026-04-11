This is an NX workspace with nestjs and react apps.

It has apps/api containing the nestjs app

SEE docs/LIBRARY_STRUCTURE.md for the nestjs library structure

use `npx nx lint web` to check typescript issues for the frontend app.

## Frontend component structure

Use `features/` (not `modules/`) for domain logic in the React app.

Each feature folder (e.g. `features/users/`) should contain:
- **`<Entity>.types.ts`** — shared types
- **`<entity>.api.ts`** — raw API calls
- **`<entity>.queries.ts`** — React Query hooks
- **`index.ts`** — re-exports everything
- **`components/`** — all UI components for the feature:
  - **`<Entity>Table.tsx`** — table/list component for the entity
  - **`Delete<Entity>Dialog.tsx`** — delete confirmation dialog; owns its delete mutation

## Frontend CRUD navigation pattern

**Never use modals for create, read, or update operations.** Use dedicated pages instead:

- **Create** — navigates to a `/new` route (e.g. `/users/new`) with a `Create<Entity>Page` component that owns form state and the create mutation.
- **Read/Update** — navigates to a detail route (e.g. `/users/:id`) with a `<Entity>DetailPage` component. The page loads the entity, presents an editable form pre-filled with current values, and has a Save button that calls the update mutation. Read and update share the same page.
- **Delete** — the only operation that may use a dialog/modal for confirmation.

Pages own the form state and mutation. They pass values, change handlers, `onSubmit`, `isPending`, and `error` down to the form component.

## Form design

Forms are presentational components — they receive values, change handlers, an `onSubmit` callback, and any derived state (e.g. `isPending`, `error`) as props. They contain no internal state and no mutations. The parent component (page or dialog) owns the form state, calls the mutation, and passes everything down.

## Managing complexity

When a page or component becomes complex (multiple queries, non-trivial derived state, compound side effects, or logic that's hard to follow inline), extract that logic into a dedicated `use<Page|Feature>` hook rather than leaving it in the component body. Keep components focused on rendering; let hooks own the data and behavior.

## React Query patterns

- **Dependent queries** (waiting for a value to be available): use `skipToken` from `@tanstack/react-query`
- **Lazy queries** (manually triggered via `refetch()`): use `enabled: false`