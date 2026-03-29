# Feature Plan: JWT-Based Authentication System

## Objective
Implement a secure JWT-based authentication system where an initial system admin can add users and assign roles. Users can log in with email and password, receive JWT tokens, and access role-based resources.

## Scope

### Included Functionality
- User login with email and password
- JWT token generation and refresh
- Password hashing with bcrypt
- Role-based access control (RBAC)
- User management (admin adds/removes users)
- Session management with token expiration
- Protected API routes

### Excluded Functionality
- Social login (OAuth/Google)
- Email verification
- Multi-factor authentication (MFA)
- Password reset flow
- User self-registration

---

## API Contract

### Authentication Endpoints

#### POST /api/v1/auth/login
Login with email and password

**Request:**
```json
{
  "email": "string (email format)",
  "password": "string (min 6 chars)"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "string (JWT)",
  "refreshToken": "string (JWT)",
  "user": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "SYSTEM_ADMIN | ADMIN | USER",
    "createdAt": "ISO8601"
  }
}
```

**Errors:**
- `401 Unauthorized`: Invalid email or password
- `400 Bad Request`: Missing or invalid fields

---

#### POST /api/v1/auth/refresh
Refresh expired access token using refresh token

**Request:**
```json
{
  "refreshToken": "string (JWT)"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "string (JWT)",
  "refreshToken": "string (JWT)"
}
```

**Errors:**
- `401 Unauthorized`: Invalid or expired refresh token
- `400 Bad Request`: Missing refreshToken

---

#### POST /api/v1/auth/logout
Logout user (invalidate tokens)

**Request:**
```json
{
  "refreshToken": "string (JWT)"
}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Errors:**
- `401 Unauthorized`: Invalid token

---

### User Management Endpoints (Admin Only)

#### POST /api/v1/users
Create new user (Admin/System Admin only)

**Request:**
```json
{
  "email": "string (email, unique)",
  "firstName": "string",
  "lastName": "string",
  "password": "string (min 6 chars)",
  "role": "ADMIN | USER"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "ADMIN | USER",
  "createdAt": "ISO8601"
}
```

**Errors:**
- `403 Forbidden`: User lacks admin permission
- `409 Conflict`: Email already exists
- `400 Bad Request`: Invalid input

---

#### GET /api/v1/users
List all users (Admin/System Admin only)

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `role`: filter by role (optional)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "SYSTEM_ADMIN | ADMIN | USER",
      "createdAt": "ISO8601"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**Errors:**
- `403 Forbidden`: User lacks admin permission

---

#### PATCH /api/v1/users/:userId
Update user (Admin/System Admin only)

**Request:**
```json
{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "role": "ADMIN | USER (optional)"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "SYSTEM_ADMIN | ADMIN | USER",
  "updatedAt": "ISO8601"
}
```

**Errors:**
- `403 Forbidden`: User lacks admin permission
- `404 Not Found`: User not found
- `400 Bad Request`: Invalid input

---

#### DELETE /api/v1/users/:userId
Delete user (Admin/System Admin only)

**Response (204 No Content)**

**Errors:**
- `403 Forbidden`: User lacks admin permission
- `404 Not Found`: User not found
- `409 Conflict`: Cannot delete the last System Admin

---

#### GET /api/v1/auth/me
Get current user profile (authenticated users)

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "SYSTEM_ADMIN | ADMIN | USER",
  "createdAt": "ISO8601"
}
```

**Errors:**
- `401 Unauthorized`: No valid token

---

## Detailed Steps / Tasks

### Phase 1: Setup & Planning (Day 1)
1. Database schema design
   - Create User and Role tables (~15 min)
   - Define JWT secret management (~10 min)
   - Plan token expiration strategy (~10 min)

2. Project setup
   - Install dependencies (bcryptjs, jsonwebtoken, zod) (~10 min)
   - Configure environment variables template (~10 min)
   - Create auth module folder structure (~10 min)

---

### Phase 2: Backend Implementation (Days 2-3)

#### 1. Database Schema & Migration (2-3 hours)
- [ ] Design User model (email, password hash, firstName, lastName, role, createdAt, updatedAt)
- [ ] Design Role enum (SYSTEM_ADMIN, ADMIN, USER)
- [ ] Create Prisma schema for User table
- [ ] Create database migration
- [ ] Seed initial system admin user
- [ ] Write schema validation tests

#### 2. Auth Module - Repository Layer (1-2 hours)
- [ ] Create `auth.repository.ts`
- [ ] Implement `findByEmail(email)` - find user for login
- [ ] Implement `findById(id)` - find user by ID
- [ ] Implement `create(userData)` - create new user
- [ ] Implement `update(userId, data)` - update user
- [ ] Implement `delete(userId)` - delete user
- [ ] Implement `findAll(filters)` - list users with pagination
- [ ] Write repository unit tests

#### 3. Auth Module - Service Layer (2-3 hours)
- [ ] Create `auth.service.ts`
- [ ] Implement `hashPassword(password)` - bcrypt hashing
- [ ] Implement `comparePassword(plain, hash)` - verify password
- [ ] Implement `generateTokens(user)` - create access & refresh tokens
- [ ] Implement `verifyAccessToken(token)` - validate JWT
- [ ] Implement `verifyRefreshToken(token)` - validate refresh JWT
- [ ] Implement `login(email, password)` - authenticate user
- [ ] Implement `refreshTokens(refreshToken)` - issue new tokens
- [ ] Implement `logout(userId)` - invalidate tokens (if using token blacklist)
- [ ] Write service unit tests

#### 4. Auth Module - Validator Layer (1 hour)
- [ ] Create `auth.validator.ts` with Zod schemas
- [ ] Define `loginSchema` - email, password validation
- [ ] Define `refreshTokenSchema` - refreshToken validation
- [ ] Define `createUserSchema` - create user validation
- [ ] Define `updateUserSchema` - update user validation
- [ ] Test validators

#### 5. Auth Module - Controller Layer (1-2 hours)
- [ ] Create `auth.controller.ts`
- [ ] Implement `login(req, res)` - handle login requests
- [ ] Implement `refresh(req, res)` - handle token refresh
- [ ] Implement `logout(req, res)` - handle logout
- [ ] Implement `getCurrentUser(req, res)` - return current user
- [ ] Implement error handling for all endpoints
- [ ] Write controller unit tests

#### 6. Auth Module - Routes Layer (1 hour)
- [ ] Create `auth.routes.ts`
- [ ] Define `POST /api/v1/auth/login` route
- [ ] Define `POST /api/v1/auth/refresh` route
- [ ] Define `POST /api/v1/auth/logout` route
- [ ] Define `GET /api/v1/auth/me` route
- [ ] Add route-level error handling
- [ ] Write route integration tests

#### 7. User Management Module (2-3 hours)
- [ ] Create `users` module with similar structure
- [ ] Implement `POST /api/v1/users` - create user (admin only)
- [ ] Implement `GET /api/v1/users` - list users (admin only, with pagination)
- [ ] Implement `PATCH /api/v1/users/:userId` - update user (admin only)
- [ ] Implement `DELETE /api/v1/users/:userId` - delete user (admin only)
- [ ] Add role-based access control middleware
- [ ] Write integration tests

#### 8. Middleware & Auth Guards (1-2 hours)
- [ ] Create `authenticate.middleware.ts` - verify JWT tokens
- [ ] Create `authorize.middleware.ts` - check roles
- [ ] Create token validation error handling
- [ ] Test middleware with protected routes
- [ ] Document middleware usage

#### 9. Integration & Documentation (1-2 hours)
- [ ] Document all API endpoints with examples
- [ ] Create authentication flow diagram
- [ ] Write setup guide for developers
- [ ] Create troubleshooting guide
- [ ] Document token expiration and refresh strategy
- [ ] Add swagger/OpenAPI documentation

---

### Phase 3: Frontend Implementation (Days 2-3, Parallel with Backend)

#### 1. Feature Setup (1 hour)
- [ ] Create `/src/features/auth` folder structure
- [ ] Create subdirectories: `views/`, `hooks/`, `services/`, `store/`, `types/`
- [ ] Create feature `index.ts` for public API

#### 2. Type Definitions (1 hour)
- [ ] Create `types/auth.types.ts`
- [ ] Define `User` interface matching API response
- [ ] Define `LoginRequest` interface
- [ ] Define `AuthState` interface
- [ ] Define `TokenPair` interface
- [ ] Create Zod validation schemas for forms

#### 3. Auth Repository (1-2 hours)
- [ ] Create `services/AuthRepository.ts`
- [ ] Implement `login(email, password)` - API call
- [ ] Implement `refresh(refreshToken)` - API call
- [ ] Implement `logout(refreshToken)` - API call
- [ ] Implement `getCurrentUser()` - API call
- [ ] Add error handling
- [ ] Write repository tests

#### 4. Auth Manager (1 hour)
- [ ] Create `services/AuthManager.ts`
- [ ] Implement token storage (localStorage/sessionStorage strategy)
- [ ] Implement `storeTokens(tokens)` - persist tokens
- [ ] Implement `getAccessToken()` - retrieve token
- [ ] Implement `clearTokens()` - clear on logout
- [ ] Implement `isTokenExpired(token)` - check expiration

#### 5. State Management (1-2 hours)
- [ ] Create `store/authStore.ts` with Zustand
- [ ] Define store state: user, isLoading, error, isAuthenticated
- [ ] Implement `setUser(user)` action
- [ ] Implement `setLoading(loading)` action
- [ ] Implement `setError(error)` action
- [ ] Implement `logout()` action
- [ ] Add persistence middleware
- [ ] Write store tests

#### 6. Custom Hook (1 hour)
- [ ] Create `hooks/useAuth.ts`
- [ ] Implement `login(email, password)` hook
- [ ] Implement `logout()` hook
- [ ] Implement `refreshToken()` hook
- [ ] Handle token refresh automatically
- [ ] Return state and actions
- [ ] Add error handling

#### 7. Login Components (2-3 hours)
- [ ] Create `views/LoginView.tsx` - login page
- [ ] Create `views/LoginForm.tsx` - login form component
- [ ] Add form validation (Zod)
- [ ] Add error display
- [ ] Add loading state
- [ ] Add "Remember Me" toggle (optional)
- [ ] Add redirect on successful login
- [ ] Write component tests

#### 8. Protected Route Component (1 hour)
- [ ] Create `views/ProtectedRoute.tsx` or similar
- [ ] Implement route guard (redirect if not authenticated)
- [ ] Show loading state while checking auth
- [ ] Handle role-based route protection (optional for now)
- [ ] Write guard tests

#### 9. Integration with Backend (1-2 hours)
- [ ] Connect LoginForm to useAuth hook
- [ ] Test full login flow
- [ ] Test token refresh on API call
- [ ] Test logout flow
- [ ] Handle network errors gracefully
- [ ] Test protected routes
- [ ] Write end-to-end flow tests

---

### Phase 4: Integration & Testing (Day 4)

#### Backend
- [ ] Run full integration test suite
- [ ] Test all authentication flows
- [ ] Test error cases and edge cases
- [ ] Test token expiration and refresh
- [ ] Performance testing (hash timing)
- [ ] Security review (password handling, token storage)

#### Frontend
- [ ] Connect to real backend API
- [ ] Test login/logout flow end-to-end
- [ ] Test token refresh mechanism
- [ ] Test error handling
- [ ] Test protected routes
- [ ] Test component rendering states

#### End-to-End
- [ ] Test complete user login → authenticated request → logout flow
- [ ] Test token refresh during long sessions
- [ ] Test multiple concurrent logins
- [ ] Test logout invalidating tokens
- [ ] Test unauthorized access to protected endpoints

---

## Dependencies

### External Libraries

**Backend:**
- `jsonwebtoken` - JWT token creation and verification
- `bcryptjs` - Password hashing
- `zod` - Validation schemas
- `express` - Web framework (already installed)
- `@prisma/client` - Database ORM (already installed)

**Frontend:**
- `zustand` - State management (already installed)
- `zod` - Validation schemas (already installed)
- `axios` or `fetch` - HTTP client (already in place)
- `react-router-dom` - Routing (already installed)

### System Dependencies
- PostgreSQL or MySQL (already configured in docker-compose)
- Environment variables for JWT secrets (to be defined)

### Feature Dependencies
- **None** - Authentication is a foundational feature with no dependencies on other features

---

## Implementation Order

1. **API Contract** (Day 1) - Finalize and approve
2. **Backend Database** (Day 1-2) - Schema and migration
3. **Backend Auth Module** (Day 2-3) - In parallel with frontend
4. **Frontend Setup & Types** (Day 2-3) - In parallel with backend
5. **Backend API Endpoints Live** (Day 3) - Demo for frontend
6. **Frontend Integration** (Day 3-4) - Connect to real API
7. **Testing & Refinement** (Day 4) - Full integration testing
8. **Documentation** (Day 4) - Complete API and setup docs

---

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/ube_hr
JWT_ACCESS_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
NODE_ENV=development
```

### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:3000/api/v1
```

---

## Security Considerations

1. **Password Storage**: Use bcryptjs with salt rounds ≥ 10
2. **JWT Secrets**: Use strong random secrets (32+ characters), store in environment variables only
3. **Token Expiration**: 
   - Access Token: 15 minutes (short-lived)
   - Refresh Token: 7 days
4. **Token Refresh**: Implement sliding window or refresh rotation
5. **HTTPS Only**: Ensure secure cookie flags in production
6. **CORS**: Configure CORS to allow only frontend domain
7. **Rate Limiting**: Consider rate limiting on login endpoint
8. **Token Blacklist**: Consider token blacklist for logout (optional, depends on scale)
9. **Password Validation**: Enforce minimum password requirements (min 6 chars, complexity optional)
10. **Secrets Management**: Never commit `.env` files; use `.env.example` template

---

## Testing Strategy

### Backend Unit Tests
- Password hashing and comparison
- Token generation and verification
- Service business logic
- Repository data access
- Validator schemas

### Backend Integration Tests
- Login flow (valid/invalid credentials)
- Token refresh flow
- Logout flow
- Protected endpoints
- Role-based access control
- User management endpoints

### Frontend Unit Tests
- Auth store actions
- Auth repository calls
- Auth manager token storage
- Hook logic

### Frontend Integration Tests
- Full login flow
- Token refresh during API calls
- Protected route redirects
- Error handling and display
- Logout flow

### End-to-End Tests
- User login → access protected resource → logout
- Token refresh during session
- Multiple concurrent users

---

## Rollout & Deployment

### Phase 1: Deployment
1. Deploy backend with authentication
2. Deploy frontend with login feature
3. Monitor for errors

### Phase 2: Verification
1. Test production login/logout
2. Verify token refresh works
3. Check error handling

### Phase 3: Monitoring
- Log failed login attempts
- Monitor token refresh rate
- Track authentication errors
- Alert on anomalies

---

## Notes & Recommendations

1. **Initial Admin**: Create system admin user during database seeding with secure password
2. **Token Expiration**: Consider implementing sliding window refresh for better UX
3. **Multi-Device**: Allow multiple simultaneous logins for the same user (no device tracking for now)
4. **Error Messages**: Keep error messages generic for security (don't reveal if email exists)
5. **Password Requirements**: Consider enforcing stronger password rules in production
6. **Rate Limiting**: Implement rate limiting on login endpoint to prevent brute force
7. **Audit Logging**: Consider logging all authentication events for compliance
8. **Token Revocation**: Plan for future token revocation mechanism
9. **CORS Configuration**: Must be carefully configured once frontend URL is known
10. **Documentation**: Keep API documentation in sync with code using Swagger/OpenAPI

---

## Success Criteria

- ✅ Users can log in with email and password
- ✅ JWT tokens are returned on successful login
- ✅ Access tokens expire and can be refreshed
- ✅ Protected API routes enforce authentication
- ✅ Admins can create users and assign roles
- ✅ Role-based access control works as expected
- ✅ Logout invalidates tokens
- ✅ Error handling is consistent and clear
- ✅ All tests pass (unit, integration, e2e)
- ✅ API documentation is complete and accurate
- ✅ No secrets are hardcoded or exposed
