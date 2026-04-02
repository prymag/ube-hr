import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios'
import type {
  LoginRequest,
  LoginResponse,
  AuthTokens,
  User,
  Role,
} from '../types/auth.types'

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'AuthApiError'
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network error — please check your connection') {
    super(message)
    this.name = 'NetworkError'
  }
}

// ---------------------------------------------------------------------------
// Backend response shapes
// ---------------------------------------------------------------------------

interface BackendLoginResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
  }
  tokens: {
    accessToken: string
    refreshToken: string
  }
}

interface BackendRefreshResponse {
  tokens: {
    accessToken: string
    refreshToken: string
  }
}

/** /me returns the JWT token payload, not the full user record */
interface BackendMeResponse {
  user: {
    userId: string
    email: string
    role?: string
  }
}

interface BackendError {
  error?: string
  message?: string
}

// ---------------------------------------------------------------------------
// AuthRepository
// ---------------------------------------------------------------------------

export class AuthRepository {
  /** Exposed so the AuthProvider can attach response interceptors */
  public readonly http: AxiosInstance

  constructor(baseURL?: string) {
    const apiBase =
      baseURL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

    this.http = axios.create({
      baseURL: `${apiBase}/api/v1/auth`,
      headers: { 'Content-Type': 'application/json' },
      withCredentials: false,
    })
  }

  // -------------------------------------------------------------------------
  // login
  // -------------------------------------------------------------------------

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const payload: LoginRequest = { email, password }
      const { data } = await this.http.post<BackendLoginResponse>('/login', payload)
      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          role: data.user.role as Role,
        },
        tokens: {
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
        },
      }
    } catch (err) {
      throw this.normalise(err)
    }
  }

  // -------------------------------------------------------------------------
  // refresh
  // -------------------------------------------------------------------------

  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const { data } = await this.http.post<BackendRefreshResponse>('/refresh', {
        refreshToken,
      })
      return {
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
      }
    } catch (err) {
      throw this.normalise(err)
    }
  }

  // -------------------------------------------------------------------------
  // logout
  // -------------------------------------------------------------------------

  async logout(refreshToken: string): Promise<void> {
    try {
      await this.http.post('/logout', { refreshToken })
    } catch (err) {
      throw this.normalise(err)
    }
  }

  // -------------------------------------------------------------------------
  // getCurrentUser
  // Maps JWT token payload (userId, email, role) → User shape
  // -------------------------------------------------------------------------

  async getCurrentUser(accessToken: string): Promise<User> {
    try {
      const { data } = await this.http.get<BackendMeResponse>('/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      return {
        id: data.user.userId,
        email: data.user.email,
        firstName: '',
        lastName: '',
        role: (data.user.role ?? 'USER') as Role,
      }
    } catch (err) {
      throw this.normalise(err)
    }
  }

  // -------------------------------------------------------------------------
  // Interceptor helpers
  // -------------------------------------------------------------------------

  addResponseInterceptor(
    onFulfilled: (value: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
    onRejected: (error: unknown) => unknown,
  ): number {
    return this.http.interceptors.response.use(onFulfilled, onRejected)
  }

  ejectResponseInterceptor(id: number): void {
    this.http.interceptors.response.eject(id)
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private normalise(err: unknown): AuthApiError | NetworkError {
    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError<BackendError>
      if (!axiosErr.response) {
        return new NetworkError()
      }
      const status = axiosErr.response.status
      const message =
        axiosErr.response.data?.error ??
        axiosErr.response.data?.message ??
        axiosErr.message ??
        'Request failed'
      return new AuthApiError(message, status)
    }
    if (err instanceof Error) {
      return new NetworkError(err.message)
    }
    return new NetworkError()
  }
}

// Singleton for convenience — consumers can also instantiate their own
export const authRepository = new AuthRepository()
