import React, { useEffect, useRef } from 'react'
import type { AxiosResponse } from 'axios'
import { authRepository } from '../../features/auth/services/AuthRepository'
import { authManager } from '../../features/auth/services/AuthManager'
import { useAuthStore } from '../../features/auth/store/authStore'
import { useAuth } from '../../features/auth/hooks/useAuth'

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * AuthProvider — renders once at the app root.
 *
 * Responsibilities:
 * 1. Calls `useAuth().initialize()` on mount to restore an existing session.
 * 2. Attaches an Axios response interceptor to `authRepository.http` that
 *    automatically refreshes the access token on 401 responses and retries
 *    the original request. If refresh fails the user is logged out.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize } = useAuth()
  const { logout: logoutStore } = useAuthStore()
  const interceptorId = useRef<number | null>(null)

  // Set up the 401 → token-refresh → retry interceptor once on mount
  useEffect(() => {
    interceptorId.current = authRepository.addResponseInterceptor(
      (response: AxiosResponse) => response,
      async (error: unknown) => {
        const axiosError = error as {
          response?: { status: number }
          config?: { _retried?: boolean; headers?: Record<string, string> }
        }

        const config = axiosError.config
        const status = axiosError.response?.status

        if (status === 401 && config && !config._retried) {
          config._retried = true
          const refreshToken = authManager.getRefreshToken()
          if (refreshToken) {
            try {
              const tokens = await authRepository.refresh(refreshToken)
              authManager.storeTokens(tokens)
              if (config.headers) {
                config.headers['Authorization'] = `Bearer ${tokens.accessToken}`
              }
              return authRepository.http(config)
            } catch {
              // Refresh failed — clear session
              authManager.clearTokens()
              logoutStore()
            }
          }
        }

        return Promise.reject(error)
      },
    )

    return () => {
      if (interceptorId.current !== null) {
        authRepository.ejectResponseInterceptor(interceptorId.current)
      }
    }
    // logoutStore is stable (Zustand) — no need to list as dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Restore session from stored tokens on first render
  useEffect(() => {
    initialize()
    // initialize is stable within a navigation context
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
