import { PrismaClient } from '@/generated/prisma/client';

/**
 * Data Transfer Objects (DTOs) for the Auth Repository
 */
export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export interface UserFilters {
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface PaginationInput {
  skip: number;
  take: number;
}

export interface PaginationResponse<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
}

/**
 * Auth Repository - Handles all user-related database operations
 * Responsible for data access only, no business logic
 */
export class AuthRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find user by email address
   * @param email - User email address
   * @returns User object or null if not found
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by ID
   * @param id - User ID
   * @returns User object or null if not found
   */
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new user
   * @param userData - User creation data (email, password, firstName, lastName)
   * @returns Created user object
   */
  async create(userData: CreateUserInput) {
    return this.prisma.user.create({
      data: {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
      },
    });
  }

  /**
   * Update user data
   * @param userId - User ID to update
   * @param data - Partial user data to update
   * @returns Updated user object
   */
  async update(userId: string, data: UpdateUserInput) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.password && { password: data.password }),
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
      },
    });
  }

  /**
   * Delete user by ID
   * @param userId - User ID to delete
   * @returns Deleted user object
   */
  async delete(userId: string) {
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Find all users with optional filtering and pagination
   * @param filters - Optional filters (email, firstName, lastName)
   * @param pagination - Pagination input (skip, take)
   * @returns Paginated user list with total count
   */
  async findAll(
    filters?: UserFilters,
    pagination?: PaginationInput,
  ): Promise<PaginationResponse<any>> {
    const where: any = {};

    if (filters?.email) {
      where.email = {
        contains: filters.email,
      };
    }

    if (filters?.firstName) {
      where.firstName = {
        contains: filters.firstName,
      };
    }

    if (filters?.lastName) {
      where.lastName = {
        contains: filters.lastName,
      };
    }

    const skip = pagination?.skip || 0;
    const take = pagination?.take || 10;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      total,
      skip,
      take,
    };
  }
}
