import { describe, it, expect } from 'vitest'
import { loginFormSchema, refreshTokenSchema } from '../types/auth.schemas'
import type { User, AuthState, LoginResponse } from '../types/auth.types'

describe('loginFormSchema', () => {
  it('accepts valid login input', () => {
    const result = loginFormSchema.safeParse({
      email: 'user@example.com',
      password: 'secret123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing email', () => {
    const result = loginFormSchema.safeParse({ email: '', password: 'secret' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path[0] === 'email')
      expect(emailError).toBeDefined()
    }
  })

  it('rejects invalid email format', () => {
    const result = loginFormSchema.safeParse({
      email: 'not-an-email',
      password: 'secret',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path[0] === 'email')
      expect(emailError?.message).toContain('valid email')
    }
  })

  it('rejects missing password', () => {
    const result = loginFormSchema.safeParse({
      email: 'user@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const pwError = result.error.issues.find((i) => i.path[0] === 'password')
      expect(pwError).toBeDefined()
    }
  })
})

describe('refreshTokenSchema', () => {
  it('accepts a valid refresh token', () => {
    const result = refreshTokenSchema.safeParse({ refreshToken: 'valid.jwt.token' })
    expect(result.success).toBe(true)
  })

  it('rejects empty refresh token', () => {
    const result = refreshTokenSchema.safeParse({ refreshToken: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing refresh token field', () => {
    const result = refreshTokenSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('auth type shapes', () => {
  it('User type has expected structure', () => {
    const user: User = {
      id: '1',
      email: 'admin@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'ADMIN',
    }
    expect(user.id).toBe('1')
    expect(user.role).toBe('ADMIN')
  })

  it('AuthState has correct initial shape', () => {
    const state: AuthState = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      accessTokenExpiryTime: null,
    }
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('LoginResponse has user and tokens', () => {
    const response: LoginResponse = {
      user: {
        id: '1',
        email: 'admin@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'ADMIN',
      },
      tokens: {
        accessToken: 'access.token.here',
        refreshToken: 'refresh.token.here',
      },
    }
    expect(response.tokens.accessToken).toBe('access.token.here')
    expect(response.user.role).toBe('ADMIN')
  })
})
