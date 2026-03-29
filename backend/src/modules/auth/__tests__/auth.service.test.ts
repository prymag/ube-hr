import { AuthService, TokenPayload } from '../auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeAll(() => {
    authService = new AuthService(
      'test-access-secret-long-enough-for-development',
      'test-refresh-secret-long-enough-for-development',
      '15m',
      '7d',
    );
  });

  describe('hashPassword', () => {
    it('should hash a password with default salt rounds', async () => {
      const password = 'testPassword123!';
      const hash = await authService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toEqual(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should hash a password with custom salt rounds', async () => {
      const password = 'testPassword123!';
      const hash = await authService.hashPassword(password, 12);

      expect(hash).toBeDefined();
      expect(hash).not.toEqual(password);
    });

    it('should throw error if salt rounds less than 10', async () => {
      const password = 'testPassword123!';

      await expect(authService.hashPassword(password, 9)).rejects.toThrow(
        'Salt rounds must be at least 10 for security',
      );
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testPassword123!';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);

      expect(hash1).not.toEqual(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'testPassword123!';
      const hash = await authService.hashPassword(password);
      const isMatch = await authService.comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'testPassword123!';
      const hash = await authService.hashPassword(password);
      const isMatch = await authService.comparePassword('wrongPassword', hash);

      expect(isMatch).toBe(false);
    });

    it('should handle special characters in password', async () => {
      const password = 'p@ssw0rd!#$%^&*()';
      const hash = await authService.hashPassword(password);
      const isMatch = await authService.comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', async () => {
      const user: TokenPayload = {
        userId: 'user123',
        email: 'test@example.com',
      };

      const tokens = await authService.generateTokens(user);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate tokens with valid JWT structure', async () => {
      const user: TokenPayload = {
        userId: 'user123',
        email: 'test@example.com',
      };

      const tokens = await authService.generateTokens(user);

      // JWT tokens have 3 parts separated by dots: header.payload.signature
      const accessParts = tokens.accessToken.split('.');
      const refreshParts = tokens.refreshToken.split('.');

      expect(accessParts).toHaveLength(3);
      expect(refreshParts).toHaveLength(3);

      // Verify tokens can be verified and contain correct payload
      const accessPayload = await authService.verifyAccessToken(tokens.accessToken);
      const refreshPayload = await authService.verifyRefreshToken(tokens.refreshToken);

      expect(accessPayload.userId).toEqual(user.userId);
      expect(refreshPayload.userId).toEqual(user.userId);
    });

    it('should include user data in token payload', async () => {
      const user: TokenPayload = {
        userId: 'user456',
        email: 'another@example.com',
      };

      const tokens = await authService.generateTokens(user);

      // Verify by decoding the token
      const decoded = await authService.verifyAccessToken(tokens.accessToken);
      expect(decoded.userId).toEqual(user.userId);
      expect(decoded.email).toEqual(user.email);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', async () => {
      const user: TokenPayload = {
        userId: 'user789',
        email: 'verify@example.com',
      };

      const tokens = await authService.generateTokens(user);
      const decoded = await authService.verifyAccessToken(tokens.accessToken);

      expect(decoded.userId).toEqual(user.userId);
      expect(decoded.email).toEqual(user.email);
    });

    it('should throw error for invalid access token', async () => {
      const invalidToken = 'invalid.token.here';

      await expect(authService.verifyAccessToken(invalidToken)).rejects.toThrow(
        'Invalid access token',
      );
    });

    it('should throw error for malformed token', async () => {
      const malformedToken = 'not-a-valid-jwt';

      await expect(authService.verifyAccessToken(malformedToken)).rejects.toThrow(
        'Invalid access token',
      );
    });

    it('should throw error for token with wrong secret', async () => {
      const user: TokenPayload = {
        userId: 'user999',
        email: 'wrongsecret@example.com',
      };

      const wrongSecretService = new AuthService(
        'different-access-secret',
        'test-refresh-secret',
        '15m',
        '7d',
      );
      const tokens = await authService.generateTokens(user);

      await expect(wrongSecretService.verifyAccessToken(tokens.accessToken)).rejects.toThrow(
        'Invalid access token',
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', async () => {
      const user: TokenPayload = {
        userId: 'refreshUser',
        email: 'refresh@example.com',
      };

      const tokens = await authService.generateTokens(user);
      const decoded = await authService.verifyRefreshToken(tokens.refreshToken);

      expect(decoded.userId).toEqual(user.userId);
      expect(decoded.email).toEqual(user.email);
    });

    it('should throw error for invalid refresh token', async () => {
      const invalidToken = 'invalid.refresh.token';

      await expect(authService.verifyRefreshToken(invalidToken)).rejects.toThrow(
        'Invalid refresh token',
      );
    });

    it('should throw error for access token used as refresh token', async () => {
      const user: TokenPayload = {
        userId: 'mixedTokenUser',
        email: 'mixedtoken@example.com',
      };

      const tokens = await authService.generateTokens(user);

      // Try to verify access token as refresh token - should fail
      await expect(authService.verifyRefreshToken(tokens.accessToken)).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });

  describe('Token Separation', () => {
    it('should not allow access token to verify with refresh secret', async () => {
      const user: TokenPayload = {
        userId: 'tokenSepUser',
        email: 'tokensep@example.com',
      };

      const tokens = await authService.generateTokens(user);

      // Access token should fail refresh verification
      await expect(authService.verifyRefreshToken(tokens.accessToken)).rejects.toThrow();
    });

    it('should not allow refresh token to verify with access secret', async () => {
      const user: TokenPayload = {
        userId: 'tokenSepUser2',
        email: 'tokensep2@example.com',
      };

      const tokens = await authService.generateTokens(user);

      // Refresh token should fail access verification
      await expect(authService.verifyAccessToken(tokens.refreshToken)).rejects.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete password reset flow', async () => {
      const oldPassword = 'oldPassword123!';
      const newPassword = 'newPassword456!';

      const oldHash = await authService.hashPassword(oldPassword);
      const isOldMatch = await authService.comparePassword(oldPassword, oldHash);
      expect(isOldMatch).toBe(true);

      const newHash = await authService.hashPassword(newPassword);
      const isNewMatch = await authService.comparePassword(newPassword, newHash);
      expect(isNewMatch).toBe(true);

      const isOldWithNew = await authService.comparePassword(oldPassword, newHash);
      expect(isOldWithNew).toBe(false);
    });

    it('should handle complete authentication flow', async () => {
      const user: TokenPayload = {
        userId: 'flowUser',
        email: 'flow@example.com',
      };
      const password = 'flowPassword123!';

      // 1. Create password hash during registration
      const passwordHash = await authService.hashPassword(password);
      expect(passwordHash).toBeDefined();

      // 2. Verify password during login
      const isPasswordValid = await authService.comparePassword(password, passwordHash);
      expect(isPasswordValid).toBe(true);

      // 3. Generate tokens on successful login
      const tokens = await authService.generateTokens(user);
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();

      // 4. Verify access token is valid
      const accessPayload = await authService.verifyAccessToken(tokens.accessToken);
      expect(accessPayload.userId).toEqual(user.userId);

      // 5. Verify refresh token is valid
      const refreshPayload = await authService.verifyRefreshToken(tokens.refreshToken);
      expect(refreshPayload.userId).toEqual(user.userId);
    });
  });
});
