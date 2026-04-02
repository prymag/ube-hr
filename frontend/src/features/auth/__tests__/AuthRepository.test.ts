import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AuthRepository, AuthApiError, NetworkError } from '../services/AuthRepository'

// ---------------------------------------------------------------------------
// Mock server — responses match the actual Express backend format
// ---------------------------------------------------------------------------

const API_BASE = 'http://localhost:5000/api/v1/auth'

const mockUserPayload = {
  id: 'user-1',
  email: 'admin@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'ADMIN',
}

const mockTokenPayload = {
  userId: 'user-1',
  email: 'admin@example.com',
  role: 'ADMIN',
}

const mockTokens = {
  accessToken: 'mock.access.token',
  refreshToken: 'mock.refresh.token',
}

const server = setupServer(
  // POST /login — matches backend: { user, tokens }
  http.post(`${API_BASE}/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    if (body.email === 'admin@example.com' && body.password === 'correctpass') {
      return HttpResponse.json({ user: mockUserPayload, tokens: mockTokens })
    }
    return HttpResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }),

  // POST /refresh — matches backend: { tokens }
  http.post(`${API_BASE}/refresh`, async ({ request }) => {
    const body = (await request.json()) as { refreshToken: string }
    if (body.refreshToken === 'valid.refresh.token') {
      return HttpResponse.json({
        tokens: { accessToken: 'new.access.token', refreshToken: 'new.refresh.token' },
      })
    }
    return HttpResponse.json(
      { error: 'Invalid or expired refresh token' },
      { status: 401 },
    )
  }),

  // POST /logout — matches backend: { message }
  http.post(`${API_BASE}/logout`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' })
  }),

  // GET /me — matches backend: { user: TokenPayload }
  http.get(`${API_BASE}/me`, ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (auth === 'Bearer valid.access.token') {
      return HttpResponse.json({ user: mockTokenPayload })
    }
    return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const repo = new AuthRepository('http://localhost:5000')

describe('AuthRepository.login', () => {
  it('returns normalised user and tokens on valid credentials', async () => {
    const result = await repo.login('admin@example.com', 'correctpass')
    expect(result.user.id).toBe('user-1')
    expect(result.user.email).toBe('admin@example.com')
    expect(result.user.role).toBe('ADMIN')
    expect(result.tokens.accessToken).toBe('mock.access.token')
    expect(result.tokens.refreshToken).toBe('mock.refresh.token')
  })

  it('throws AuthApiError(401) on invalid credentials', async () => {
    await expect(repo.login('admin@example.com', 'wrongpass')).rejects.toBeInstanceOf(
      AuthApiError,
    )
    try {
      await repo.login('admin@example.com', 'wrongpass')
    } catch (err) {
      expect(err).toBeInstanceOf(AuthApiError)
      expect((err as AuthApiError).statusCode).toBe(401)
      expect((err as AuthApiError).message).toBe('Invalid email or password')
    }
  })

  it('throws NetworkError when server is unreachable', async () => {
    server.use(http.post(`${API_BASE}/login`, () => HttpResponse.error()))
    await expect(repo.login('a@b.com', 'pass')).rejects.toBeInstanceOf(NetworkError)
  })
})

describe('AuthRepository.refresh', () => {
  it('returns new tokens for a valid refresh token', async () => {
    const tokens = await repo.refresh('valid.refresh.token')
    expect(tokens.accessToken).toBe('new.access.token')
    expect(tokens.refreshToken).toBe('new.refresh.token')
  })

  it('throws AuthApiError(401) for an invalid refresh token', async () => {
    await expect(repo.refresh('expired.token')).rejects.toBeInstanceOf(AuthApiError)
    try {
      await repo.refresh('expired.token')
    } catch (err) {
      expect((err as AuthApiError).statusCode).toBe(401)
    }
  })
})

describe('AuthRepository.logout', () => {
  it('resolves without error', async () => {
    await expect(repo.logout('any.refresh.token')).resolves.toBeUndefined()
  })

  it('throws NetworkError when server is unreachable', async () => {
    server.use(http.post(`${API_BASE}/logout`, () => HttpResponse.error()))
    await expect(repo.logout('token')).rejects.toBeInstanceOf(NetworkError)
  })
})

describe('AuthRepository.getCurrentUser', () => {
  it('returns a mapped User from the token payload', async () => {
    const user = await repo.getCurrentUser('valid.access.token')
    expect(user.id).toBe('user-1')
    expect(user.email).toBe('admin@example.com')
    expect(user.role).toBe('ADMIN')
  })

  it('throws AuthApiError(401) for an invalid access token', async () => {
    await expect(repo.getCurrentUser('bad.token')).rejects.toBeInstanceOf(AuthApiError)
    try {
      await repo.getCurrentUser('bad.token')
    } catch (err) {
      expect((err as AuthApiError).statusCode).toBe(401)
    }
  })
})

describe('AuthApiError', () => {
  it('has the correct name, message, and statusCode', () => {
    const err = new AuthApiError('Not found', 404, 'NOT_FOUND')
    expect(err.name).toBe('AuthApiError')
    expect(err.message).toBe('Not found')
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe('NOT_FOUND')
  })
})

describe('NetworkError', () => {
  it('has the correct name and default message', () => {
    const err = new NetworkError()
    expect(err.name).toBe('NetworkError')
    expect(err.message).toContain('Network error')
  })

  it('accepts a custom message', () => {
    const err = new NetworkError('custom message')
    expect(err.message).toBe('custom message')
  })
})
