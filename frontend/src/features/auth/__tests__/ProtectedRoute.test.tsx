import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

import { ProtectedRoute } from '../views/ProtectedRoute'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types/auth.types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUser: User = {
  id: 'user-1',
  email: 'user@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  role: 'USER',
}

const adminUser: User = { ...mockUser, role: 'ADMIN' }

function setStoreState(patch: Partial<ReturnType<typeof useAuthStore.getState>>) {
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    accessTokenExpiryTime: null,
    ...patch,
  })
}

/**
 * Renders ProtectedRoute inside a router where:
 * - /protected — the protected page
 * - /login — the login redirect target
 * - /unauthorized — the role-error redirect target
 */
function renderRoute(
  props: React.ComponentProps<typeof ProtectedRoute> = { children: null },
  initialPath = '/protected',
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/protected"
          element={<ProtectedRoute {...props}>
            <div>Protected content</div>
          </ProtectedRoute>}
        />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized page</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProtectedRoute — authenticated user', () => {
  beforeEach(() => setStoreState({ user: mockUser, isAuthenticated: true }))

  it('renders children when user is authenticated', () => {
    renderRoute()
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('renders children when requiredRole matches user role', () => {
    setStoreState({ user: mockUser, isAuthenticated: true })
    renderRoute({ requiredRole: 'USER', children: null })
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('renders children when requiredRole array includes user role', () => {
    setStoreState({ user: adminUser, isAuthenticated: true })
    renderRoute({ requiredRole: ['ADMIN', 'SYSTEM_ADMIN'], children: null })
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})

describe('ProtectedRoute — unauthenticated user', () => {
  beforeEach(() => setStoreState({ user: null, isAuthenticated: false }))

  it('redirects to /login when not authenticated', () => {
    renderRoute()
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('uses custom redirectTo when provided', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute redirectTo="/dashboard">
                <div>Secret</div>
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})

describe('ProtectedRoute — wrong role', () => {
  beforeEach(() => setStoreState({ user: mockUser, isAuthenticated: true }))

  it('redirects to /unauthorized when user role is insufficient', () => {
    renderRoute({ requiredRole: 'ADMIN', children: null })
    expect(screen.getByText('Unauthorized page')).toBeInTheDocument()
  })

  it('redirects to /unauthorized when role array does not include user role', () => {
    renderRoute({ requiredRole: ['ADMIN', 'SYSTEM_ADMIN'], children: null })
    expect(screen.getByText('Unauthorized page')).toBeInTheDocument()
  })
})

describe('ProtectedRoute — loading state', () => {
  beforeEach(() =>
    setStoreState({ user: null, isAuthenticated: false, isLoading: true }),
  )

  it('shows a loading indicator while checking authentication', () => {
    renderRoute()
    expect(screen.getByRole('status')).toHaveTextContent('Loading…')
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })
})
