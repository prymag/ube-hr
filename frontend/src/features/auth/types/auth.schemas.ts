import { z } from 'zod'

/**
 * Login form validation schema
 */
export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

/**
 * Refresh token request schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

/**
 * Inferred TypeScript types from Zod schemas
 */
export type LoginFormValues = z.infer<typeof loginFormSchema>
export type RefreshTokenValues = z.infer<typeof refreshTokenSchema>
