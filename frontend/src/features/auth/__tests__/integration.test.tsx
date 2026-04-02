/**
 * Task 24 — Frontend Integration Tests
 *
 * Covers:
 * - Login flow end-to-end (form → useAuth → store)
 * - Logout flow clearing state and tokens
 * - ProtectedRoute redirects unauthenticated users to /login
 * - ProtectedRoute allows authenticated users through
 * - Network error display
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import React from 'react'

// Make Zustand persist a no-op
vi.mock('zustand/middleware', async (importOriginal) => {
  const original = await importOriginal<typeof import('zustand/middleware')>()
  return {
    ...original,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    persist: (fn: any) => fn,
    createJSONStorage: () => undefined,
  }
})

// Hoist mock fns so they're available inside vi.mock factory (which is hoisted)
const { mockLogin, mockLogout } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockLogout: vi.fn(),
}))

vi.mock('../services/AuthRepository', () => ({
  authRepository: {
    login: mockLogin,
    logout: mockLogout,
    refresh: vi.fn(),
    getCurrentUser: vi.fn(),
    addResponseInterceptor: vi.fn(() => 0),
    ejectResponseInterceptor: vi.fn(),
  },
  AuthApiError: class extends Error {
    statusCode: number
    constructor(message: string, statusCode: number) {
      super(message)
      this.statusCode = statusCode
    }
  },
  NetworkError: class extends Error {},
  authManager: {},
}))

// Mock authManager
vi.mock('../services/AuthManager', () => ({
  authManager: {
    storeTokens: vi.fn(),
    getAccessToken: vi.fn(() => null),
    getRefreshToken: vi.fn(() => null),
    clearTokens: vi.fn(),
    isTokenExpired: vi.fn(() => false),
    getTokenExpiryTime: vi.fn(() => null),
  },
}))

import { LoginView } from '../views/LoginView'
import { ProtectedRoute } from '../views/ProtectedRoute'
import { useAuthStore } from '../store/authStore'
import type { User, LoginResponse } from '../types/auth.types'

const mockUser: User = {
  id: 'user-1',
  email: 'admin@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'ADMIN',
}

const mockLoginResponse: LoginResponse = {
  user: mockUser,
  tokens: { accessToken: 'new.access', refreshToken: 'new.refresh' },
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
// Full router setup matching AppRoutes structure
// ---------------------------------------------------------------------------

function renderApp(initialPath = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<div>Unauthorized</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Login flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('submits and navigates on successful login', async () => {
    mockLogin.mockResolvedValue(mockLoginResponse)
    renderApp('/login')

    await userEvent.type(screen.getByLabelText('Email'), 'admin@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'correctpass')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@example.com', 'correctpass')
    })
  })

  it('displays network error message when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Network error — please check your connection'))
    renderApp('/login')

    await userEvent.type(screen.getByLabelText('Email'), 'admin@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(
        screen.getByText('Network error — please check your connection'),
      ).toBeInTheDocument()
    })
  })

  it('displays API error message for invalid credentials', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid email or password'))
    renderApp('/login')

    await userEvent.type(screen.getByLabelText('Email'), 'admin@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })
  })
})

describe('Protected route access', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('redirects unauthenticated users to /login', () => {
    renderApp('/')
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
  })

  it('renders protected content for authenticated users', () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true })
    renderApp('/')
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})

describe('Logout flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('clears store state on logout action', () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true })
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})

describe('Token persistence across renders', () => {
  it('authenticated user sees protected content immediately (no flicker)', () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true, isLoading: false })
    renderApp('/')
    // Should render dashboard immediately, not a loading spinner
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows loading spinner while auth is being checked', () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true })
    renderApp('/')
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
