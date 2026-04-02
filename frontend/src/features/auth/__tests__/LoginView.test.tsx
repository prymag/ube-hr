import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

// Mock the useAuth hook
const mockLogin = vi.fn()
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    login: mockLogin,
    isLoading: false,
    error: null,
  })),
}))

import { LoginView } from '../views/LoginView'
import { useAuth } from '../hooks/useAuth'

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>

function renderLoginView() {
  return render(
    <MemoryRouter>
      <LoginView />
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ login: mockLogin, isLoading: false, error: null })
  })

  it('renders the page heading', () => {
    renderLoginView()
    expect(screen.getByText('UBE HR System')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
  })

  it('renders email and password inputs', () => {
    renderLoginView()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    renderLoginView()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })
})

describe('LoginForm validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ login: mockLogin, isLoading: false, error: null })
  })

  it('shows email required error when submitting empty email', async () => {
    renderLoginView()
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('shows invalid email error for bad format', async () => {
    renderLoginView()
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email')
    await userEvent.type(screen.getByLabelText('Password'), 'anypass')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('shows password required error when submitting empty password', async () => {
    renderLoginView()
    await userEvent.type(screen.getByLabelText('Email'), 'admin@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('calls login with correct values on valid submit', async () => {
    mockLogin.mockResolvedValue(undefined)
    renderLoginView()
    await userEvent.type(screen.getByLabelText('Email'), 'admin@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@example.com', 'secret123')
    })
  })
})

describe('LoginForm loading state', () => {
  it('shows loading text and disables button while isLoading', () => {
    mockUseAuth.mockReturnValue({ login: mockLogin, isLoading: true, error: null })
    renderLoginView()
    const button = screen.getByRole('button', { name: 'Signing in…' })
    expect(button).toBeDisabled()
    expect(screen.getByLabelText('Email')).toBeDisabled()
    expect(screen.getByLabelText('Password')).toBeDisabled()
  })
})

describe('LoginForm API error display', () => {
  it('shows API error message from useAuth', () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Invalid email or password',
    })
    renderLoginView()
    expect(screen.getByRole('alert', { name: undefined })).toHaveTextContent(
      'Invalid email or password',
    )
  })
})
