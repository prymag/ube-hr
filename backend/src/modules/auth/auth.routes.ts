import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { AuthController } from './auth.controller';

/**
 * Route-level error handler — catches any unhandled errors thrown by handlers
 */
const routeErrorHandler: (
  err: Error,
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction,
) => void = (err, _req, res, _next) => {
  console.error('[AuthRoutes] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
};

/**
 * Creates the auth Express router.
 *
 * Routes:
 *   POST   /login    — public, validates body in controller
 *   POST   /refresh  — public, validates body in controller
 *   POST   /logout   — requires authenticate middleware
 *   GET    /me       — requires authenticate middleware
 *
 * @param controller   - AuthController instance
 * @param authenticate - JWT authentication middleware (from authenticate.middleware.ts)
 */
export function createAuthRouter(
  controller: AuthController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  // POST /login — public endpoint
  router.post('/login', controller.login);

  // POST /refresh — public endpoint
  router.post('/refresh', controller.refresh);

  // POST /logout — requires valid refresh token in body (authenticate guards access token)
  router.post('/logout', authenticate, controller.logout);

  // GET /me — requires authenticated user
  router.get('/me', authenticate, controller.getCurrentUser);

  // Route-level error handler (must be last)
  router.use(routeErrorHandler);

  return router;
}
