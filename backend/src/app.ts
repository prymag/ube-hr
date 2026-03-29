import express from 'express';
import type { StringValue } from 'ms';
import type { PrismaClient } from '@/generated/prisma/client';
import helloRoutes from '@/modules/hello';

import {
  AuthRepository,
  AuthService,
  AuthController,
  createAuthRouter,
  authenticate,
  authorize,
} from '@/modules/auth';

import {
  UsersRepository,
  UsersService,
  UsersController,
  createUsersRouter,
} from '@/modules/users';

/**
 * Application factory — accepts an injected PrismaClient.
 *
 * Wires the full dependency graph: Repository → Service → Controller → Router.
 * The caller (server.ts or tests) is responsible for providing the client,
 * enabling clean dependency injection in both production and test contexts.
 */
export function createApp(prisma: PrismaClient): express.Express {
  const app = express();

  // ─── Dependency wiring ────────────────────────────────────────────────────

  // Auth module
  const authRepository = new AuthRepository(prisma);
  const authService = new AuthService(
    process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    (process.env.JWT_ACCESS_EXPIRY || '15m') as StringValue,
    (process.env.JWT_REFRESH_EXPIRY || '7d') as StringValue,
    authRepository,
  );
  const authController = new AuthController(authService);
  const authenticateMiddleware = authenticate(authService);

  // Users module
  const usersRepository = new UsersRepository(prisma);
  const usersService = new UsersService(usersRepository, authService);
  const usersController = new UsersController(usersService);
  const authorizeAdminMiddleware = authorize(['ADMIN', 'SYSTEM_ADMIN']);

  // ─── Global middleware ────────────────────────────────────────────────────

  app.use(express.json());

  // ─── Routes ───────────────────────────────────────────────────────────────

  app.get('/', (_req, res) => {
    res.json({ message: 'UBE HR Backend is running!' });
  });

  app.use('/api', helloRoutes);
  app.use('/api/v1/auth', createAuthRouter(authController, authenticateMiddleware));
  app.use(
    '/api/v1/users',
    createUsersRouter(usersController, authenticateMiddleware, authorizeAdminMiddleware),
  );

  return app;
}
