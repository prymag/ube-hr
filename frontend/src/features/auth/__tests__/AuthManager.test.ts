import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthManager } from '../services/AuthManager'

// ---------------------------------------------------------------------------
// localStorage mock (jsdom in this Vitest version lacks .clear())
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    reset: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// ---------------------------------------------------------------------------
// Helpers to build test JWTs
// ---------------------------------------------------------------------------

function buildJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `${header}.${body}.fakesig`
}

const futureExp = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
const pastExp = Math.floor(Date.now() / 1000) - 60    // 1 minute ago

const validToken = buildJwt({ sub: '1', exp: futureExp })
const expiredToken = buildJwt({ sub: '1', exp: pastExp })
const noExpToken = buildJwt({ sub: '1' })
const malformedToken = 'not.a.valid'

const mockTokens = {
  accessToken: 'access.token.here',
  refreshToken: 'refresh.token.here',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthManager', () => {
  let manager: AuthManager

  beforeEach(() => {
    localStorageMock.reset()
    vi.clearAllMocks()
    manager = new AuthManager()
  })

  // ---- storeTokens / getAccessToken / getRefreshToken --------------------

  it('storeTokens persists both tokens to localStorage', () => {
    manager.storeTokens(mockTokens)
    expect(localStorage.getItem('ube_hr_access_token')).toBe('access.token.here')
    expect(localStorage.getItem('ube_hr_refresh_token')).toBe('refresh.token.here')
  })

  it('getAccessToken returns the stored access token', () => {
    manager.storeTokens(mockTokens)
    expect(manager.getAccessToken()).toBe('access.token.here')
  })

  it('getRefreshToken returns the stored refresh token', () => {
    manager.storeTokens(mockTokens)
    expect(manager.getRefreshToken()).toBe('refresh.token.here')
  })

  it('getAccessToken returns null when no token stored', () => {
    expect(manager.getAccessToken()).toBeNull()
  })

  it('getRefreshToken returns null when no token stored', () => {
    expect(manager.getRefreshToken()).toBeNull()
  })

  // ---- clearTokens -------------------------------------------------------

  it('clearTokens removes both tokens from localStorage', () => {
    manager.storeTokens(mockTokens)
    manager.clearTokens()
    expect(manager.getAccessToken()).toBeNull()
    expect(manager.getRefreshToken()).toBeNull()
  })

  it('clearTokens is safe to call when nothing is stored', () => {
    expect(() => manager.clearTokens()).not.toThrow()
  })

  // ---- isTokenExpired ----------------------------------------------------

  it('isTokenExpired returns false for a valid (future) token', () => {
    expect(manager.isTokenExpired(validToken)).toBe(false)
  })

  it('isTokenExpired returns true for an expired token', () => {
    expect(manager.isTokenExpired(expiredToken)).toBe(true)
  })

  it('isTokenExpired returns true when token has no exp claim', () => {
    expect(manager.isTokenExpired(noExpToken)).toBe(true)
  })

  it('isTokenExpired returns true for a malformed token', () => {
    expect(manager.isTokenExpired(malformedToken)).toBe(true)
  })

  // ---- getTokenExpiryTime ------------------------------------------------

  it('getTokenExpiryTime returns ms-epoch timestamp for a valid token', () => {
    const result = manager.getTokenExpiryTime(validToken)
    expect(result).toBe(futureExp * 1000)
  })

  it('getTokenExpiryTime returns null when token has no exp', () => {
    expect(manager.getTokenExpiryTime(noExpToken)).toBeNull()
  })

  it('getTokenExpiryTime returns null for a malformed token', () => {
    expect(manager.getTokenExpiryTime(malformedToken)).toBeNull()
  })
})
