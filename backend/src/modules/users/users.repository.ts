import { PrismaClient } from '@/generated/prisma/client';
import type { Role } from '@/generated/prisma/enums';
import {
  AuthRepository,
  type PaginationInput,
  type PaginationResponse,
} from '../auth/auth.repository';

/**
 * Extended DTOs for Users module — include role field
 */
export interface UsersCreateInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
}

export interface UsersUpdateInput {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
}

export interface UsersFilters {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
}

/**
 * Users Repository - Extends AuthRepository with user management operations.
 *
 * Additions over the base:
 *  - `create` / `update` accept `role`
 *  - `findAll` supports filtering by `role`
 *  - `delete` guards against removing SYSTEM_ADMIN accounts
 */
export class UsersRepository extends AuthRepository {
  /** Own reference to PrismaClient needed for overridden / new methods */
  private readonly db: PrismaClient;

  constructor(prisma: PrismaClient) {
    super(prisma);
    this.db = prisma;
  }

  // ─── findById ─────────────────────────────────────────────────────────────

  /**
   * Find a user by their ID (delegates to base class, typed here for clarity)
   */
  override async findById(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }

  // ─── findAll (with role filtering) ────────────────────────────────────────

  /**
   * List users with optional role, email, firstName, lastName filters and pagination.
   */
  async findAll(
    filters?: UsersFilters,
    pagination?: PaginationInput,
  ): Promise<PaginationResponse<any>> {
    const where: Record<string, unknown> = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.email) {
      where.email = { contains: filters.email };
    }

    if (filters?.firstName) {
      where.firstName = { contains: filters.firstName };
    }

    if (filters?.lastName) {
      where.lastName = { contains: filters.lastName };
    }

    const skip = pagination?.skip ?? 0;
    const take = pagination?.take ?? 10;

    const [data, total] = await Promise.all([
      this.db.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          // password intentionally excluded from list results
        },
      }),
      this.db.user.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  // ─── create (with role) ───────────────────────────────────────────────────

  /**
   * Create a new user with an optional role (defaults to USER in the schema).
   */
  async create(userData: UsersCreateInput) {
    return this.db.user.create({
      data: {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        ...(userData.role ? { role: userData.role } : {}),
      },
    });
  }

  // ─── update (with role) ───────────────────────────────────────────────────

  /**
   * Update a user by ID. Accepts optional role change.
   */
  async update(userId: string, data: UsersUpdateInput) {
    return this.db.user.update({
      where: { id: userId },
      data: {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.password !== undefined && { password: data.password }),
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.role !== undefined && { role: data.role }),
      },
    });
  }

  // ─── delete (SYSTEM_ADMIN protected) ─────────────────────────────────────

  /**
   * Delete a user by ID.
   * Throws if the target user is a SYSTEM_ADMIN to prevent accidental lockout.
   */
  async delete(userId: string) {
    const user = await this.db.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'SYSTEM_ADMIN') {
      throw new Error('Cannot delete a SYSTEM_ADMIN account');
    }

    return this.db.user.delete({ where: { id: userId } });
  }
}
