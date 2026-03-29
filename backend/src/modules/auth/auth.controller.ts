import type { Request, Response } from 'express';
import type { AuthService } from './auth.service';
import type { TokenPayload } from './auth.service';
import { loginSchema, refreshTokenSchema } from './auth.validator';

/**
 * Augment Express Request to carry the authenticated user payload
 * set by the authenticate middleware
 */
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Auth Controller - Handles HTTP request/response for authentication endpoints
 * Delegates business logic to AuthService; validates inputs with Zod schemas
 */
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/login
   * Authenticates a user and returns access + refresh tokens
   */
  login = async (req: Request, res: Response): Promise<void> => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
      return;
    }

    try {
      const result = await this.authService.login(parsed.data.email, parsed.data.password);
      res.status(200).json({
        user: result.user,
        tokens: result.tokens,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      const status = message === 'Invalid email or password' ? 401 : 500;
      res.status(status).json({ error: message });
    }
  };

  /**
   * POST /api/v1/auth/refresh
   * Issues a new token pair from a valid refresh token
   */
  refresh = async (req: Request, res: Response): Promise<void> => {
    const parsed = refreshTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
      return;
    }

    try {
      const tokens = await this.authService.refreshTokens(parsed.data.refreshToken);
      res.status(200).json({ tokens });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      const isAuthError =
        message.includes('expired') ||
        message.includes('invalid') ||
        message.includes('invalidated') ||
        message.includes('Invalid') ||
        message.includes('not found');
      res.status(isAuthError ? 401 : 500).json({ error: message });
    }
  };

  /**
   * POST /api/v1/auth/logout
   * Invalidates the provided refresh token
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    const parsed = refreshTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
      return;
    }

    try {
      await this.authService.logout(parsed.data.refreshToken);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      res.status(500).json({ error: message });
    }
  };

  /**
   * GET /api/v1/auth/me
   * Returns the currently authenticated user's profile
   * Requires authenticate middleware to have run first
   */
  getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    try {
      res.status(200).json({ user: req.user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve user';
      res.status(500).json({ error: message });
    }
  };
}
