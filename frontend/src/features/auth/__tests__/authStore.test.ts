import { describe, it, expect, beforeEach, vi } from 'vitest'

// Make Zustand's `persist` middleware a no-op so tests don't need localStorage
vi.mock('zustand/middleware', async (importOriginal) => {
  const original = await importOriginal<typeof import('zustand/middleware')>()
  return {
    ...original,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    persist: (fn: any) => fn,
    createJSONStorage: () => undefined,
  }
})

import { useAuthStore } from '../store/authStore'
import type { User } from '../types/auth.types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUser: User = {
  id: 'user-1',
  email: 'admin@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'ADMIN',
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

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('has correct initial state', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.accessTokenExpiryTime).toBeNull()
  })

  it('setUser sets user and marks isAuthenticated true', () => {
    useAuthStore.getState().setUser(mockUser)
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('setUser(null) clears user and marks isAuthenticated false', () => {
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().setUser(null)
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('setLoading updates isLoading', () => {
    useAuthStore.getState().setLoading(true)
    expect(useAuthStore.getState().isLoading).toBe(true)
    useAuthStore.getState().setLoading(false)
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('setError updates error message', () => {
    useAuthStore.getState().setError('Something went wrong')
    expect(useAuthStore.getState().error).toBe('Something went wrong')
  })

  it('setError(null) clears the error', () => {
    useAuthStore.getState().setError('oops')
    useAuthStore.getState().setError(null)
    expect(useAuthStore.getState().error).toBeNull()
  })

  it('setAccessTokenExpiryTime updates the expiry time', () => {
    useAuthStore.getState().setAccessTokenExpiryTime(9999999999000)
    expect(useAuthStore.getState().accessTokenExpiryTime).toBe(9999999999000)
  })

  it('logout clears user, isAuthenticated, error, and accessTokenExpiryTime', () => {
    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
      error: 'some error',
      accessTokenExpiryTime: 9999999999000,
      isLoading: false,
    })
    useAuthStore.getState().logout()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.error).toBeNull()
    expect(state.accessTokenExpiryTime).toBeNull()
  })

  it('logout does not change isLoading', () => {
    useAuthStore.setState({ isLoading: true })
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isLoading).toBe(true)
  })
})
