import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { Role } from '../types/auth.types'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** One or more roles that are permitted to access this route */
  requiredRole?: Role | Role[]
  /** Where to send unauthenticated users (default: '/login') */
  redirectTo?: string
  /** Where to send users that lack the required role (default: '/unauthorized') */
  unauthorizedRedirectTo?: string
}

/**
 * ProtectedRoute — route guard that enforces authentication and optional RBAC.
 *
 * Usage:
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 *
 *   <ProtectedRoute requiredRole={['ADMIN', 'SYSTEM_ADMIN']}>
 *     <AdminPanel />
 *   </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login',
  unauthorizedRedirectTo = '/unauthorized',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore()

  if (isLoading) {
    return (
      <div role="status" aria-label="Checking authentication">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!user || !allowed.includes(user.role)) {
      return <Navigate to={unauthorizedRedirectTo} replace />
    }
  }

  return <>{children}</>
}
