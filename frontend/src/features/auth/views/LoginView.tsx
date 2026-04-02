import React from 'react'
import { LoginForm } from './LoginForm'

/**
 * LoginView — full-page login screen.
 * Renders the LoginForm centred on the page.
 */
export function LoginView() {
  return (
    <main className="login-page" aria-label="Login page">
      <div className="login-card">
        <h1 className="login-title">UBE HR System</h1>
        <p className="login-subtitle">Sign in to your account</p>
        <LoginForm />
      </div>
    </main>
  )
}
