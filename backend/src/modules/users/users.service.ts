import type { Role } from '@/generated/prisma/enums';
import type { AuthService } from '../auth/auth.service';
import type { PaginationInput, PaginationResponse } from '../auth/auth.repository';
import type { UsersRepository, UsersCreateInput, UsersUpdateInput, UsersFilters } from './users.repository';

/**
 * User shape returned by the service — password is always omitted.
 */
export interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Permission helpers ───────────────────────────────────────────────────────

const ELEVATED_ROLES: Role[] = ['ADMIN', 'SYSTEM_ADMIN'];

function requireElevated(actorRole: Role, action: string): void {
  if (!ELEVATED_ROLES.includes(actorRole)) {
    throw new Error(`Insufficient permissions to ${action}`);
  }
}

function stripPassword(user: Record<string, unknown>): SafeUser {
  const { password: _pw, ...safe } = user;
  return safe as unknown as SafeUser;
}

// ─── UsersService ─────────────────────────────────────────────────────────────

/**
 * Users Service — business logic for user management.
 *
 * Permission model:
 *  - Only ADMIN or SYSTEM_ADMIN may create / update / delete users.
 *  - ADMIN cannot assign or modify ADMIN / SYSTEM_ADMIN roles.
 *  - ADMIN cannot touch a SYSTEM_ADMIN account (update or delete).
 *  - SYSTEM_ADMIN has no restrictions (repository still blocks deleting
 *    a SYSTEM_ADMIN as a last-resort safety net).
 */
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly authService: AuthService,
  ) {}

  // ─── createUser ─────────────────────────────────────────────────────────────

  /**
   * Create a new user.
   *
   * @param userData  - Validated user data (plain-text password expected).
   * @param actorRole - Role of the user performing the action.
   */
  async createUser(userData: UsersCreateInput, actorRole: Role): Promise<SafeUser> {
    requireElevated(actorRole, 'create users');

    const targetRole = userData.role ?? 'USER';

    if (actorRole === 'ADMIN' && targetRole !== 'USER') {
      throw new Error('ADMIN cannot assign ADMIN or SYSTEM_ADMIN role');
    }

    const existingUser = await this.repository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    const hashedPassword = await this.authService.hashPassword(userData.password);

    const created = await this.repository.create({
      ...userData,
      password: hashedPassword,
      role: targetRole,
    });

    return stripPassword(created as Record<string, unknown>);
  }

  // ─── updateUser ─────────────────────────────────────────────────────────────

  /**
   * Update an existing user.
   *
   * @param userId    - ID of the user to update.
   * @param data      - Fields to update (plain-text password if changing it).
   * @param actorRole - Role of the user performing the action.
   */
  async updateUser(userId: string, data: UsersUpdateInput, actorRole: Role): Promise<SafeUser> {
    requireElevated(actorRole, 'update users');

    const target = await this.repository.findById(userId);
    if (!target) {
      throw new Error('User not found');
    }

    if (actorRole === 'ADMIN') {
      if (target.role === 'SYSTEM_ADMIN') {
        throw new Error('ADMIN cannot modify a SYSTEM_ADMIN account');
      }
      if (data.role !== undefined && data.role !== 'USER') {
        throw new Error('ADMIN cannot assign ADMIN or SYSTEM_ADMIN role');
      }
    }

    const updatePayload: UsersUpdateInput = { ...data };

    if (data.password !== undefined) {
      updatePayload.password = await this.authService.hashPassword(data.password);
    }

    const updated = await this.repository.update(userId, updatePayload);
    return stripPassword(updated as Record<string, unknown>);
  }

  // ─── deleteUser ─────────────────────────────────────────────────────────────

  /**
   * Delete a user by ID.
   * Repository enforces SYSTEM_ADMIN cannot be deleted regardless of actorRole.
   *
   * @param userId    - ID of the user to delete.
   * @param actorRole - Role of the user performing the action.
   */
  async deleteUser(userId: string, actorRole: Role): Promise<void> {
    requireElevated(actorRole, 'delete users');
    await this.repository.delete(userId);
  }

  // ─── listUsers ──────────────────────────────────────────────────────────────

  /**
   * List users with optional role / field filters and pagination.
   * Authorization is enforced at the route layer (ADMIN or SYSTEM_ADMIN only).
   */
  async listUsers(
    filters?: UsersFilters,
    pagination?: PaginationInput,
  ): Promise<PaginationResponse<SafeUser>> {
    const result = await this.repository.findAll(filters, pagination);
    return {
      ...result,
      data: result.data.map((u: Record<string, unknown>) => stripPassword(u)),
    };
  }
}
