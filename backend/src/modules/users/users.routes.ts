import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { UsersController } from './users.controller';

/**
 * Route-level error handler — catches any unhandled errors thrown by handlers.
 */
const routeErrorHandler: (
  err: Error,
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction,
) => void = (err, _req, res, _next) => {
  console.error('[UsersRoutes] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
};

/**
 * Creates the users Express router.
 *
 * All routes require:
 *   1. `authenticate` — verifies the JWT access token and populates `req.user`
 *   2. `authorize`    — restricts access to ADMIN and SYSTEM_ADMIN roles
 *
 * Routes:
 *   POST   /          — create a new user
 *   GET    /          — list users (supports ?skip, ?take, ?role, ?email, ?firstName, ?lastName)
 *   PATCH  /:userId   — update a user by ID
 *   DELETE /:userId   — delete a user by ID
 *
 * @param controller  - UsersController instance
 * @param authenticate - JWT authentication middleware
 * @param authorize    - Role-based authorization middleware (pre-configured for ADMIN/SYSTEM_ADMIN)
 */
export function createUsersRouter(
  controller: UsersController,
  authenticate: RequestHandler,
  authorize: RequestHandler,
): Router {
  const router = Router();

  // POST / — create user
  router.post('/', authenticate, authorize, controller.createUser);

  // GET / — list users with filters and pagination
  router.get('/', authenticate, authorize, controller.listUsers);

  // PATCH /:userId — update user
  router.patch('/:userId', authenticate, authorize, controller.updateUser);

  // DELETE /:userId — delete user
  router.delete('/:userId', authenticate, authorize, controller.deleteUser);

  // Route-level error handler (must be last)
  router.use(routeErrorHandler);

  return router;
}
