/**
 * Auth Module Exports
 * This file serves as the public API for the auth module
 */

export { AuthRepository } from './auth.repository';
export type {
  CreateUserInput,
  UpdateUserInput,
  UserFilters,
  PaginationInput,
  PaginationResponse,
} from './auth.repository';

export { AuthService } from './auth.service';
export type {
  TokenPayload,
  GeneratedTokens,
  LoginResult,
} from './auth.service';

export { AuthController } from './auth.controller';
export type { AuthenticatedRequest } from './auth.controller';

export {
  loginSchema,
  refreshTokenSchema,
  createUserSchema,
  updateUserSchema,
  RoleEnum,
} from './auth.validator';
export type {
  LoginInput,
  RefreshTokenInput,
  CreateUserInput as ValidatorCreateUserInput,
  UpdateUserInput as ValidatorUpdateUserInput,
  Role,
} from './auth.validator';

export { createAuthRouter } from './auth.routes';

export { authenticate } from './authenticate.middleware';
