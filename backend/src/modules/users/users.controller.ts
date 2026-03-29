import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../auth/auth.controller';
import { createUserSchema, updateUserSchema } from '../auth/auth.validator';
import type { UsersService } from './users.service';
import type { Role } from '@/generated/prisma/enums';

// ─── Query param schema for listUsers ─────────────────────────────────────────

const listQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).optional().default(0),
  take: z.coerce.number().int().min(1).max(100).optional().default(10),
  role: z.enum(['SYSTEM_ADMIN', 'ADMIN', 'USER']).optional(),
  email: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// ─── Error → HTTP status mapping ──────────────────────────────────────────────

function resolveErrorStatus(message: string): number {
  if (
    message.startsWith('Insufficient permissions') ||
    message.startsWith('ADMIN cannot')
  ) {
    return 403;
  }
  if (message === 'User not found') return 404;
  if (message === 'A user with this email already exists') return 409;
  return 500;
}

// ─── UsersController ──────────────────────────────────────────────────────────

/**
 * Users Controller — HTTP handlers for user management endpoints.
 * Validates inputs, extracts actor role from req.user, delegates to UsersService.
 */
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── POST /api/v1/users ───────────────────────────────────────────────────

  /**
   * Create a new user.
   * Requires ADMIN or SYSTEM_ADMIN role.
   */
  createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
      return;
    }

    const actorRole = req.user?.role as Role | undefined;
    if (!actorRole) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    try {
      const user = await this.usersService.createUser(
        {
          email: parsed.data.email,
          password: parsed.data.password,
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          role: parsed.data.role as Role | undefined,
        },
        actorRole,
      );
      res.status(201).json({ user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      res.status(resolveErrorStatus(message)).json({ error: message });
    }
  };

  // ─── GET /api/v1/users ────────────────────────────────────────────────────

  /**
   * List users with optional filters and pagination.
   * Requires ADMIN or SYSTEM_ADMIN role.
   */
  listUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid query parameters',
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
      return;
    }

    const { skip, take, role, email, firstName, lastName } = parsed.data;

    try {
      const result = await this.usersService.listUsers(
        { role: role as Role | undefined, email, firstName, lastName },
        { skip, take },
      );
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list users';
      res.status(500).json({ error: message });
    }
  };

  // ─── PATCH /api/v1/users/:userId ─────────────────────────────────────────

  /**
   * Update a user by ID.
   * Requires ADMIN or SYSTEM_ADMIN role.
   */
  updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { userId } = req.params;

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      });
      return;
    }

    const actorRole = req.user?.role as Role | undefined;
    if (!actorRole) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    try {
      const user = await this.usersService.updateUser(
        userId,
        {
          email: parsed.data.email,
          password: parsed.data.password,
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          role: parsed.data.role as Role | undefined,
        },
        actorRole,
      );
      res.status(200).json({ user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      res.status(resolveErrorStatus(message)).json({ error: message });
    }
  };

  // ─── DELETE /api/v1/users/:userId ─────────────────────────────────────────

  /**
   * Delete a user by ID.
   * Requires ADMIN or SYSTEM_ADMIN role.
   */
  deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { userId } = req.params;

    const actorRole = req.user?.role as Role | undefined;
    if (!actorRole) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    try {
      await this.usersService.deleteUser(userId, actorRole);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      res.status(resolveErrorStatus(message)).json({ error: message });
    }
  };
}
