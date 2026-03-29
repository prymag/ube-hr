import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from './auth.controller';
import type { Role } from './auth.validator';

/**
 * authorize middleware factory
 *
 * Returns a middleware that checks whether the authenticated user (`req.user`)
 * holds at least one of the required roles. Must be used AFTER `authenticate`.
 *
 * Usage:
 *   router.delete('/users/:id', authenticate, authorize('SYSTEM_ADMIN'), controller.delete)
 *   router.post('/users',       authenticate, authorize(['ADMIN', 'SYSTEM_ADMIN']), controller.create)
 */
export function authorize(requiredRoles: Role | Role[]) {
  const roles: Role[] = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const userRole = req.user.role as Role | undefined;

    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({
        error: 'Forbidden: insufficient permissions',
      });
      return;
    }

    next();
  };
}
