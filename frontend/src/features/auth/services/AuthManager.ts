import type { AuthTokens } from '../types/auth.types'

const ACCESS_TOKEN_KEY = 'ube_hr_access_token'
const REFRESH_TOKEN_KEY = 'ube_hr_refresh_token'

interface JwtPayload {
  exp?: number
  [key: string]: unknown
}

function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const decoded = atob(padded)
    return JSON.parse(decoded) as JwtPayload
  } catch {
    return null
  }
}

/**
 * AuthManager — manages JWT token persistence and expiration checks.
 *
 * Tokens are stored in localStorage under namespaced keys.
 * Expiration is determined by decoding the JWT payload locally (no network call).
 */
export class AuthManager {
  /**
   * Persist both tokens to localStorage.
   */
  storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  }

  /**
   * Retrieve the stored access token, or null if absent.
   */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  }

  /**
   * Retrieve the stored refresh token, or null if absent.
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  /**
   * Remove both tokens from localStorage (call on logout).
   */
  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  /**
   * Returns true if the token is expired or cannot be decoded.
   * Treats tokens without an `exp` claim as expired.
   */
  isTokenExpired(token: string): boolean {
    const payload = parseJwtPayload(token)
    if (!payload?.exp) return true
    // Add a 5-second buffer to account for clock skew
    return Date.now() >= (payload.exp - 5) * 1000
  }

  /**
   * Returns the expiry timestamp (ms since epoch) from the token's `exp` claim,
   * or null if the token cannot be decoded or has no `exp`.
   */
  getTokenExpiryTime(token: string): number | null {
    const payload = parseJwtPayload(token)
    if (!payload?.exp) return null
    return payload.exp * 1000
  }
}

export const authManager = new AuthManager()
