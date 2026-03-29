import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from './auth.controller';
import { AuthService } from './auth.service';

const defaultAuthService = new AuthService();

/**
 * authenticate middleware
 *
 * Extracts the Bearer token from the Authorization header, verifies it as a
 * JWT access token, and attaches the decoded payload to `req.user`.
 *
 * Usage:
 *   router.get('/protected', authenticate, controller.handler)
 *   router.get('/protected', authenticate(), controller.handler)  // with custom service
 */
export function authenticate(
  authService: AuthService = defaultAuthService,
) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header missing or malformed' });
      return;
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    if (!token) {
      res.status(401).json({ error: 'Token is missing' });
      return;
    }

    try {
      const payload = await authService.verifyAccessToken(token);
      req.user = payload;
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      const isExpired = message.includes('expired');
      res.status(401).json({
        error: isExpired ? 'Token has expired' : 'Invalid token',
      });
    }
  };
}
