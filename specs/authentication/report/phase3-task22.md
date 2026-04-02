# Report: Phase 3 - Task 22: Login View & Form Components

## Summary
Implemented `LoginView` (page shell) and `LoginForm` (controlled form) with client-side Zod validation, loading state, API error display, and redirect on successful login.

## Files Created
- `frontend/src/features/auth/views/LoginView.tsx` — Page container
- `frontend/src/features/auth/views/LoginForm.tsx` — Controlled form component
- `frontend/src/features/auth/__tests__/LoginView.test.tsx` — 9 component tests

## Implementation Details

### `LoginView`
Renders the page heading (`UBE HR System`) and subtitle, then renders `<LoginForm />` inside a centred card container.

### `LoginForm`
- Controlled with `useState` (no react-hook-form dependency)
- Validates on submit via `loginFormSchema.safeParse()` — shows per-field errors without calling the API
- Delegates login to `useAuth().login()`
- Displays API/network error from `useAuth().error` in a banner `role="alert"`
- Shows `Signing in…` text and disables all inputs + button during `isLoading`
- Redirect to `/` handled inside `useAuth.login` via `useNavigate`

### Accessibility
- `htmlFor` / `id` pairing for inputs
- `aria-describedby` linking inputs to error spans
- `role="alert"` on error messages for screen readers
- `aria-label` on form and page `<main>`

## Tests (9)
| Group | Tests |
|-------|-------|
| LoginView render | Heading, subtitle, email/password inputs, submit button |
| Validation | Empty email error, invalid email format error, empty password error |
| Submission | Calls `login()` with correct values on valid form |
| Loading state | Button shows `Signing in…` and is disabled; inputs disabled |
| API error | Displays error string from `useAuth().error` |

## Verification
```
npm run test:run -- src/features/auth/__tests__/LoginView.test.tsx
Tests: 9 passed
```

## Notes
- No Tailwind dependency used; CSS class names (`login-page`, `form-field`, `btn-primary`) are applied but styling is deferred to a future CSS task
- `noValidate` on the form element disables browser-native validation in favour of Zod
