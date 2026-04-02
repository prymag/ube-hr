import React, { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { loginFormSchema } from '../types/auth.schemas'

interface FieldErrors {
  email?: string
  password?: string
}

/**
 * LoginForm — controlled form with Zod validation.
 * Delegates authentication to the useAuth hook.
 */
export function LoginForm() {
  const { login, isLoading, error } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const result = loginFormSchema.safeParse({ email, password })
    if (!result.success) {
      const errors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors
        if (!errors[field]) errors[field] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    await login(email, password)
    // On success, useAuth navigates away — no need to reset here
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Login form">
      {error && (
        <div role="alert" className="form-error-banner">
          {error}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          autoComplete="email"
        />
        {fieldErrors.email && (
          <span id="email-error" role="alert" className="field-error">
            {fieldErrors.email}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          aria-describedby={fieldErrors.password ? 'password-error' : undefined}
          autoComplete="current-password"
        />
        {fieldErrors.password && (
          <span id="password-error" role="alert" className="field-error">
            {fieldErrors.password}
          </span>
        )}
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary">
        {isLoading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
