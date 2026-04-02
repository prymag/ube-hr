import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthStore } from '../types/auth.types'

/**
 * Zustand auth store.
 *
 * Only `user` and `isAuthenticated` are persisted to localStorage so that
 * transient states (isLoading, error, expiryTime) never survive a page reload.
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // --- state ---
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      accessTokenExpiryTime: null,

      // --- actions ---
      setUser: (user) =>
        set({ user, isAuthenticated: user !== null }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      setError: (error) =>
        set({ error }),

      setAccessTokenExpiryTime: (time) =>
        set({ accessTokenExpiryTime: time }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          accessTokenExpiryTime: null,
        }),
    }),
    {
      name: 'ube-hr-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
