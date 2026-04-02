import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginView } from '../../features/auth/views/LoginView'
import { ProtectedRoute } from '../../features/auth/views/ProtectedRoute'

/**
 * Application route definitions.
 *
 * /login         — public login page
 * /              — protected dashboard (placeholder)
 * /unauthorized  — shown when a user lacks the required role
 * *              — fallback redirect to /login
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div>
              <h1>Dashboard</h1>
              <p>Welcome! More features coming soon.</p>
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/unauthorized"
        element={
          <main>
            <h1>Access Denied</h1>
            <p>You do not have permission to view this page.</p>
          </main>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
