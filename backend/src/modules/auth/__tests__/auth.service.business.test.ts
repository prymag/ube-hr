/**
 * Auth Service Business Logic Integration Tests
 * Tests for login, refreshTokens, and logout flows
 */
import { AuthService } from '../auth.service';
import type { AuthRepository } from '../auth.repository';

// Mock user matching Prisma User shape
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  password: '',
  firstName: 'John',
  lastName: 'Doe',
  role: 'USER' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRepository(overrides: Partial<typeof mockUser> = {}): jest.Mocked<AuthRepository> {
  const user = { ...mockUser, ...overrides };
  return {
    findByEmail: jest.fn().mockResolvedValue(user),
    findById: jest.fn().mockResolvedValue(user),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
  } as unknown as jest.Mocked<AuthRepository>;
}

describe('AuthService - Business Logic', () => {
  let authService: AuthService;
  let repository: jest.Mocked<AuthRepository>;
  const plainPassword = 'TestPassword123!';

  beforeAll(async () => {
    // Pre-hash so we can inject it into the mock user
    const tempService = new AuthService(
      'test-access-secret-long',
      'test-refresh-secret-long',
      '15m',
      '7d',
    );
    mockUser.password = await tempService.hashPassword(plainPassword);
  });

  beforeEach(() => {
    repository = makeRepository();
    authService = new AuthService(
      'test-access-secret-long',
      'test-refresh-secret-long',
      '15m',
      '7d',
      repository,
    );
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('should return user and tokens on valid credentials', async () => {
      const result = await authService.login('test@example.com', plainPassword);

      expect(result.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
      });
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should include role in the token payload', async () => {
      const result = await authService.login('test@example.com', plainPassword);
      const payload = await authService.verifyAccessToken(result.tokens.accessToken);

      expect(payload.userId).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
    });

    it('should throw when user is not found', async () => {
      repository.findByEmail.mockResolvedValue(null);

      await expect(authService.login('unknown@example.com', plainPassword)).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should throw on wrong password', async () => {
      await expect(authService.login('test@example.com', 'WrongPassword!')).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should not reveal whether email exists (same error for missing user vs wrong password)', async () => {
      repository.findByEmail.mockResolvedValue(null);
      const missingUserError = await authService
        .login('noone@example.com', 'any')
        .catch((e: Error) => e.message);

      const wrongPasswordError = await authService
        .login('test@example.com', 'WrongPassword!')
        .catch((e: Error) => e.message);

      expect(missingUserError).toBe(wrongPasswordError);
    });

    it('should throw when no repository is provided', async () => {
      const serviceWithoutRepo = new AuthService(
        'test-access-secret-long',
        'test-refresh-secret-long',
        '15m',
        '7d',
      );

      await expect(serviceWithoutRepo.login('test@example.com', plainPassword)).rejects.toThrow(
        'Repository is required for login',
      );
    });
  });

  // ─── refreshTokens ────────────────────────────────────────────────────────

  describe('refreshTokens', () => {
    it('should return new token pair for a valid refresh token', async () => {
      const { tokens: initial } = await authService.login('test@example.com', plainPassword);
      const newTokens = await authService.refreshTokens(initial.refreshToken);

      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
    });

    it('should rotate the refresh token (old token is invalidated)', async () => {
      const { tokens: initial } = await authService.login('test@example.com', plainPassword);
      await authService.refreshTokens(initial.refreshToken);

      await expect(authService.refreshTokens(initial.refreshToken)).rejects.toThrow(
        'Refresh token has been invalidated',
      );
    });

    it('should throw for an already-invalidated token', async () => {
      const { tokens } = await authService.login('test@example.com', plainPassword);
      await authService.logout(tokens.refreshToken);

      await expect(authService.refreshTokens(tokens.refreshToken)).rejects.toThrow(
        'Refresh token has been invalidated',
      );
    });

    it('should throw for an invalid token string', async () => {
      await expect(authService.refreshTokens('not.a.valid.token')).rejects.toThrow();
    });

    it('should throw when user no longer exists', async () => {
      const { tokens } = await authService.login('test@example.com', plainPassword);
      repository.findById.mockResolvedValue(null);

      await expect(authService.refreshTokens(tokens.refreshToken)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw when no repository is provided', async () => {
      // Generate a token via a service that has a repository, then use one without
      const { tokens } = await authService.login('test@example.com', plainPassword);

      const serviceWithoutRepo = new AuthService(
        'test-access-secret-long',
        'test-refresh-secret-long',
        '15m',
        '7d',
      );

      await expect(serviceWithoutRepo.refreshTokens(tokens.refreshToken)).rejects.toThrow(
        'Repository is required for token refresh',
      );
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should invalidate the refresh token', async () => {
      const { tokens } = await authService.login('test@example.com', plainPassword);
      await authService.logout(tokens.refreshToken);

      await expect(authService.refreshTokens(tokens.refreshToken)).rejects.toThrow(
        'Refresh token has been invalidated',
      );
    });

    it('should resolve without error', async () => {
      const { tokens } = await authService.login('test@example.com', plainPassword);
      await expect(authService.logout(tokens.refreshToken)).resolves.toBeUndefined();
    });

    it('should be idempotent (calling logout twice does not throw)', async () => {
      const { tokens } = await authService.login('test@example.com', plainPassword);
      await authService.logout(tokens.refreshToken);
      await expect(authService.logout(tokens.refreshToken)).resolves.toBeUndefined();
    });
  });

  // ─── Full flow integration ─────────────────────────────────────────────────

  describe('Full login → refresh → logout flow', () => {
    it('should handle a complete session lifecycle', async () => {
      // 1. Login
      const { user, tokens: t1 } = await authService.login('test@example.com', plainPassword);
      expect(user.email).toBe(mockUser.email);

      // 2. Refresh
      const t2 = await authService.refreshTokens(t1.refreshToken);
      expect(t2.accessToken).toBeDefined();

      // 3. Old refresh token no longer works
      await expect(authService.refreshTokens(t1.refreshToken)).rejects.toThrow(
        'Refresh token has been invalidated',
      );

      // 4. Logout with new refresh token
      await authService.logout(t2.refreshToken);

      // 5. New refresh token also invalidated
      await expect(authService.refreshTokens(t2.refreshToken)).rejects.toThrow(
        'Refresh token has been invalidated',
      );
    });
  });
});
