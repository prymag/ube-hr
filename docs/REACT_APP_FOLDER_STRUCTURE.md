src/
├── assets/            # Global static files (images, fonts, global CSS)
├── components/        # Shared, reusable "atomic" components (Button, Input, Modal)
├── config/            # Global configuration (env variables, constants)
├── features/          # The heart of the app (Modularized by domain)
│   ├── authentication/
│   │   ├── api/       # Auth-specific API calls — use a subfolder only when
│   │   ├── hooks/     #   there are multiple files; otherwise place files
│   │   ├── types/     #   directly in the feature root.
│   │   └── index.ts   # The "Public API" for the feature (always required)
│   │
│   │   Example — single file per concern (flat):
│   │   ├── auth.api.ts
│   │   ├── auth.types.ts
│   │   ├── useAuth.ts
│   │   └── index.ts
│   │
│   │   Example — multiple files per concern (use subfolders):
│   │   ├── api/
│   │   │   ├── login.api.ts
│   │   │   └── signup.api.ts
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SocialButtons.tsx
│   │   └── index.ts
│   │
│   └── dashboard/
│       ├── dashboard.api.ts
│       └── index.ts
├── hooks/             # Shared, global custom hooks
├── layouts/           # Page wrappers (AdminLayout, PublicLayout)
├── pages/             # Route components that compose features together
├── services/          # Global API clients (Axios instances, Firebase config)
├── store/             # Global state management (Redux, Zustand, Context)
└── utils/             # Global helper functions (date formatting, validation)
