# Frontend Structure for Modern React Apps (SPA, SSR, Native)

This is a suggested folder organization inspired by Ramon Prata’s structure for scalable React applications ([source](https://ramonprata.medium.com/how-to-structure-a-react-app-in-2025-spa-ssr-or-native-10d8de7a245a)).

---

## Project Root

```
my-app/
├── src/
│   ├── app/
│   ├── features/
│   └── shared/
├── package.json
├── tsconfig.json
└── ...
```

## 1. `src/app` — App Entry & Root Configuration

```
src/app/
├── index.tsx           # Render root
├── App.tsx             # Root component
├── routes/             # Route config (framework-specific)
├── providers/          # Global providers (Theme, Auth, etc.)
└── styles/             # Global styles
```

## 2. `src/features` — Feature Modules

```
src/features/
├── products/
│   ├── views/
│   │   ├── ProductList.tsx
│   │   └── ProductItem.tsx
│   ├── hooks/
│   │   └── useProductsData.ts
│   ├── services/
│   │   ├── ProductsManager.ts
│   │   └── ProductsRepository.ts
│   ├── store/
│   │   └── productsStore.ts
│   ├── utils/
│   │   └── dataMappers.ts
│   └── types/
│       └── products.types.ts
├── cart/
└── checkout/
```

### Layers Explained

* **Views** — UI components specific to the feature.
* **Hooks** — Feature-scoped hooks (e.g., data fetching).
* **Services** — Encapsulate business logic (Manager) and API/data interaction (Repository).
* **Store** — State management (Zustand slice, Redux slice, or Context).
* **Utils** — Reusable helpers for this feature.
* **Types** — TypeScript types/interfaces for this feature.

## 3. `src/shared` — Reusable & Framework-Agnostic Code

```
src/shared/
├── components/       # Generic UI components (buttons, modals, inputs)
├── hooks/            # Shared hooks (useForm, useDebounce)
├── services/         # Shared API clients or utilities
├── utils/            # General utilities
├── types/            # Shared type definitions
└── styles/           # Design tokens or shared styles
```

> Features can depend on shared modules, but shared should not depend on individual features.

## Interaction Between Layers

* **View <-> Store**: Components consume state and trigger actions.
* **View <-> Data Layer**: Views and hooks fetch/send data through Managers → Repositories.
* **Shared**: Used by both features and app root for common logic/UI.

## Benefits of This Structure

* Organizes code by domain/feature, not by type (helps scale).
* Easier onboarding and clearer separation of concerns.
* Adaptable to SPA, SSR, and native (React Native/Expo).

## Example Summary Tree

```
src/
├── app/
│   ├── App.tsx
│   ├── index.tsx
│   ├── routes/
│   └── providers/
├── features/
│   ├── products/
│   ├── cart/
│   └── checkout/
└── shared/
    ├── components/
    ├── hooks/
    ├── utils/
    └── styles/
```

This structure isn’t a rule — adapt as your project evolves.
