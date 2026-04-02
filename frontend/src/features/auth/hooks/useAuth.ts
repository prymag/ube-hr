import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authRepository } from '../services/AuthRepository'
import { authManager } from '../services/AuthManager'

/**
 * useAuth — orchestrates authentication flows.
 *
 * Data flow: useAuth → AuthRepository (API) + AuthManager (tokens) → authStore (state)
 *
 * Usage:
 *   const { login, logout, refreshToken, initialize, user, isLoading, error } = useAuth()
 *
 * Call `initialize()` once on app mount (via AuthProvider) to restore session.
 */
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    setLoading,
    setError,
    logout: logoutStore,
    setAccessTokenExpiryTime,
  } = useAuthStore()

  const navigate = useNavigate()

  // ---------------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------------

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const response = await authRepository.login(email, password)
        authManager.storeTokens(response.tokens)
        setUser(response.user)
        setAccessTokenExpiryTime(
          authManager.getTokenExpiryTime(response.tokens.accessToken),
        )
        navigate('/', { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed')
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setError, setUser, setAccessTokenExpiryTime, navigate],
  )

  // ---------------------------------------------------------------------------
  // logout
  // ---------------------------------------------------------------------------

  const logout = useCallback(async (): Promise<void> => {
    const storedRefreshToken = authManager.getRefreshToken()
    if (storedRefreshToken) {
      try {
        await authRepository.logout(storedRefreshToken)
      } catch {
        // Always clear locally even if the API call fails
      }
    }
    authManager.clearTokens()
    logoutStore()
    navigate('/login', { replace: true })
  }, [logoutStore, navigate])

  // ---------------------------------------------------------------------------
  // refreshToken
  // ---------------------------------------------------------------------------

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const storedRefreshToken = authManager.getRefreshToken()
    if (!storedRefreshToken) return false

    try {
      const tokens = await authRepository.refresh(storedRefreshToken)
      authManager.storeTokens(tokens)
      setAccessTokenExpiryTime(
        authManager.getTokenExpiryTime(tokens.accessToken),
      )
      return true
    } catch {
      authManager.clearTokens()
      logoutStore()
      return false
    }
  }, [setAccessTokenExpiryTime, logoutStore])

  // ---------------------------------------------------------------------------
  // initialize — call on app mount to restore session from stored tokens
  // ---------------------------------------------------------------------------

  const initialize = useCallback(async (): Promise<void> => {
    const accessToken = authManager.getAccessToken()
    if (!accessToken) return

    setLoading(true)
    try {
      let tokenToUse = accessToken

      if (authManager.isTokenExpired(accessToken)) {
        const refreshed = await refreshToken()
        if (!refreshed) return
        tokenToUse = authManager.getAccessToken()!
      }

      const currentUser = await authRepository.getCurrentUser(tokenToUse)
      setUser(currentUser)
      setAccessTokenExpiryTime(authManager.getTokenExpiryTime(tokenToUse))
    } catch {
      authManager.clearTokens()
      logoutStore()
    } finally {
      setLoading(false)
    }
  }, [setLoading, setUser, setAccessTokenExpiryTime, logoutStore, refreshToken])

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshToken,
    initialize,
  }
}
