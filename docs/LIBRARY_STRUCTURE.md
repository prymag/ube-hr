Multi-Module Feature Library: libs/feature
──────────────────────────────────────────────
libs/feature/
└─ src/
   ├─ users/          <-- Users feature module
   │   ├─ users.module.ts
   │   ├─ users.service.ts
   │   └─ users.controller.ts
   │
   ├─ auth/           <-- Auth feature module (depends on Users)
   │   ├─ auth.module.ts
   │   ├─ auth.service.ts
   │   └─ auth.controller.ts
   │
   └─ index.ts        <-- Exports modules for external use

Dependency Flow:
──────────────────────────────────────────────
[auth.module.ts]
   └─ imports UsersModule (relative import: ../users/users.module)

[users.module.ts]
   └─ independent, exports UsersService

[index.ts]
   ├─ export * from './users/users.module';
   └─ export * from './auth/auth.module';

External App:
──────────────────────────────────────────────
import { UsersModule, AuthModule } from '@feature';