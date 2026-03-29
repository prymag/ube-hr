import { z } from 'zod';

/**
 * Role enum matching Prisma schema
 */
export const RoleEnum = z.enum(['SYSTEM_ADMIN', 'ADMIN', 'USER']);

/**
 * Login request schema
 * Validates email format and password presence
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Refresh token request schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Create user schema
 * Validates all required fields for user creation including role assignment
 */
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  role: RoleEnum.optional().default('USER'),
});

/**
 * Update user schema
 * All fields are optional; validates only fields provided
 */
export const updateUserSchema = z
  .object({
    email: z.string().email('Invalid email address').optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .optional(),
    firstName: z.string().min(1, 'First name is required').max(100, 'First name is too long').optional(),
    lastName: z.string().min(1, 'Last name is required').max(100, 'Last name is too long').optional(),
    role: RoleEnum.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Inferred TypeScript types from Zod schemas
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type Role = z.infer<typeof RoleEnum>;
