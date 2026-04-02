import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

// Make Zustand persist a no-op in tests
vi.mock('zustand/middleware', async (importOriginal) => {
  const original = await importOriginal<typeof import('zustand/middleware')>()
  return {
    ...original,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    persist: (fn: any) => fn,
    createJSONStorage: () => undefined,
  }
})

// Mock authRepository
vi.mock('../services/AuthRepository', () => ({
  authRepository: {
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    getCurrentUser: vi.fn(),
  },
  AuthApiError: class AuthApiError extends Error {
    statusCode: number
    constructor(message: string, statusCode: number) {
      super(message)
      this.name = 'AuthApiError'
      this.statusCode = statusCode
    }
  },
  NetworkError: class NetworkError extends Error {
    constructor(message?: string) {
      super(message ?? 'Network error')
      this.name = 'NetworkError'
    }
  },
  authManager: {},
}))

// Mock authManager
vi.mock('../services/AuthManager', () => ({
  authManager: {
    storeTokens: vi.fn(),
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    clearTokens: vi.fn(),
    isTokenExpired: vi.fn(),
    getTokenExpiryTime: vi.fn(),
  },
}))

import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import { authRepository } from '../services/AuthRepository'
import { authManager } from '../services/AuthManager'
import type { LoginResponse, AuthTokens, User } from '../types/auth.types'

// ---------------------------------------------------------------------------
// Typed mocks
// ---------------------------------------------------------------------------

const mockAuthRepo = authRepository as {
  login: ReturnType<typeof vi.fn>
  logout: ReturnType<typeof vi.fn>
  refresh: ReturnType<typeof vi.fn>
  getCurrentUser: ReturnType<typeof vi.fn>
}

const mockAuthManager = authManager as {
  storeTokens: ReturnType<typeof vi.fn>
  getAccessToken: ReturnType<typeof vi.fn>
  getRefreshToken: ReturnType<typeof vi.fn>
  clearTokens: ReturnType<typeof vi.fn>
  isTokenExpired: ReturnType<typeof vi.fn>
  getTokenExpiryTime: ReturnType<typeof vi.fn>
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockUser: User = {
  id: 'user-1',
  email: 'admin@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'ADMIN',
}

const mockTokens: AuthTokens = {
  accessToken: 'mock.access.token',
  refreshToken: 'mock.refresh.token',
}

const mockLoginResponse: LoginResponse = { user: mockUser, tokens: mockTokens }

// ---------------------------------------------------------------------------
// Wrapper — provides Router context required by useNavigate
// ---------------------------------------------------------------------------

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

function resetStore() {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    accessTokenExpiryTime: null,
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAuth.login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('sets user in store and stores tokens on success', async () => {
    mockAuthRepo.login.mockResolvedValue(mockLoginResponse)
    mockAuthManager.getTokenExpiryTime.mockReturnValue(9999999999000)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('admin@example.com', 'password')
    })

    expect(mockAuthRepo.login).toHaveBeenCalledWith('admin@example.com', 'password')
    expect(mockAuthManager.storeTokens).toHaveBeenCalledWith(mockTokens)
    expect(useAuthStore.getState().user).toEqual(mockUser)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('sets error in store on API failure', async () => {
    mockAuthRepo.login.mockRejectedValue(new Error('Invalid email or password'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('admin@example.com', 'wrongpass')
    })

    expect(useAuthStore.getState().error).toBe('Invalid email or password')
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('clears previous error before attempting login', async () => {
    useAuthStore.setState({ error: 'old error' })
    mockAuthRepo.login.mockResolvedValue(mockLoginResponse)
    mockAuthManager.getTokenExpiryTime.mockReturnValue(null)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('a@b.com', 'pass')
    })

    expect(useAuthStore.getState().error).toBeNull()
  })
})

describe('useAuth.logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('calls API logout, clears tokens, and resets store', async () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true })
    mockAuthManager.getRefreshToken.mockReturnValue('refresh.token')
    mockAuthRepo.logout.mockResolvedValue(undefined)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.logout()
    })

    expect(mockAuthRepo.logout).toHaveBeenCalledWith('refresh.token')
    expect(mockAuthManager.clearTokens).toHaveBeenCalled()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('still clears locally even if API logout throws', async () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true })
    mockAuthManager.getRefreshToken.mockReturnValue('refresh.token')
    mockAuthRepo.logout.mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.logout()
    })

    expect(mockAuthManager.clearTokens).toHaveBeenCalled()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('skips API call when no refresh token is stored', async () => {
    mockAuthManager.getRefreshToken.mockReturnValue(null)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.logout()
    })

    expect(mockAuthRepo.logout).not.toHaveBeenCalled()
    expect(mockAuthManager.clearTokens).toHaveBeenCalled()
  })
})

describe('useAuth.refreshToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('returns true and stores new tokens on success', async () => {
    mockAuthManager.getRefreshToken.mockReturnValue('old.refresh.token')
    mockAuthRepo.refresh.mockResolvedValue(mockTokens)
    mockAuthManager.getTokenExpiryTime.mockReturnValue(9999999999000)

    const { result } = renderHook(() => useAuth(), { wrapper })

    let success: boolean = false
    await act(async () => {
      success = await result.current.refreshToken()
    })

    expect(success).toBe(true)
    expect(mockAuthManager.storeTokens).toHaveBeenCalledWith(mockTokens)
  })

  it('returns false and clears tokens when refresh API fails', async () => {
    mockAuthManager.getRefreshToken.mockReturnValue('expired.token')
    mockAuthRepo.refresh.mockRejectedValue(new Error('Token expired'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    let success: boolean = true
    await act(async () => {
      success = await result.current.refreshToken()
    })

    expect(success).toBe(false)
    expect(mockAuthManager.clearTokens).toHaveBeenCalled()
  })

  it('returns false immediately when no refresh token stored', async () => {
    mockAuthManager.getRefreshToken.mockReturnValue(null)

    const { result } = renderHook(() => useAuth(), { wrapper })

    let success: boolean = true
    await act(async () => {
      success = await result.current.refreshToken()
    })

    expect(success).toBe(false)
    expect(mockAuthRepo.refresh).not.toHaveBeenCalled()
  })
})

describe('useAuth.initialize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('loads user when a valid access token exists', async () => {
    mockAuthManager.getAccessToken.mockReturnValue('valid.access.token')
    mockAuthManager.isTokenExpired.mockReturnValue(false)
    mockAuthRepo.getCurrentUser.mockResolvedValue(mockUser)
    mockAuthManager.getTokenExpiryTime.mockReturnValue(9999999999000)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.initialize()
    })

    await waitFor(() => {
      expect(useAuthStore.getState().user).toEqual(mockUser)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  it('refreshes token first when access token is expired', async () => {
    mockAuthManager.getAccessToken
      .mockReturnValueOnce('expired.access.token')
      .mockReturnValueOnce('new.access.token')
    mockAuthManager.getRefreshToken.mockReturnValue('valid.refresh.token')
    mockAuthManager.isTokenExpired.mockReturnValue(true)
    mockAuthRepo.refresh.mockResolvedValue(mockTokens)
    mockAuthRepo.getCurrentUser.mockResolvedValue(mockUser)
    mockAuthManager.getTokenExpiryTime.mockReturnValue(9999999999000)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.initialize()
    })

    expect(mockAuthRepo.refresh).toHaveBeenCalled()
    expect(useAuthStore.getState().user).toEqual(mockUser)
  })

  it('skips initialization when no access token stored', async () => {
    mockAuthManager.getAccessToken.mockReturnValue(null)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.initialize()
    })

    expect(mockAuthRepo.getCurrentUser).not.toHaveBeenCalled()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('clears tokens and logs out when getCurrentUser fails', async () => {
    mockAuthManager.getAccessToken.mockReturnValue('valid.access.token')
    mockAuthManager.isTokenExpired.mockReturnValue(false)
    mockAuthRepo.getCurrentUser.mockRejectedValue(new Error('Unauthorized'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.initialize()
    })

    expect(mockAuthManager.clearTokens).toHaveBeenCalled()
    expect(useAuthStore.getState().user).toBeNull()
  })
})
