/**
 * User role enum matching backend Prisma schema
 */
export type Role = 'SYSTEM_ADMIN' | 'ADMIN' | 'USER'

/**
 * Authenticated user object returned from API
 */
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * Refresh token request payload
 */
export interface RefreshTokenRequest {
  refreshToken: string
}

/**
 * Token pair returned by login and refresh endpoints
 */
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

/**
 * Full login response from the API
 */
export interface LoginResponse {
  user: User
  tokens: AuthTokens
}

/**
 * Auth feature state shape (used by Zustand store)
 */
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  accessTokenExpiryTime: number | null
}

/**
 * Auth store actions
 */
export interface AuthActions {
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  setAccessTokenExpiryTime: (time: number | null) => void
}

/**
 * Full auth store type (state + actions)
 */
export type AuthStore = AuthState & AuthActions
