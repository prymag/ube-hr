This is an NX workspace with nestjs and react apps.

It has apps/api containing the nestjs app

SEE docs/LIBRARY_STRUCTURE.md for the nestjs library structure

use `npx nx lint web` to check typescript issues for the frontend app.

## React Query patterns

- **Dependent queries** (waiting for a value to be available): use `skipToken` from `@tanstack/react-query`
- **Lazy queries** (manually triggered via `refetch()`): use `enabled: false`