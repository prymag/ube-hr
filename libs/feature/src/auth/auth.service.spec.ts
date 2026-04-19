import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role, UserStatus } from '@ube-hr/backend';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

const mockUser = {
  id: 1,
  email: 'user@example.com',
  role: Role.USER,
  status: UserStatus.ACTIVE,
  refreshTokenVersion: 2,
  password: 'hashed',
  name: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'findByEmailAndPassword' | 'findById' | 'incrementTokenVersion'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync' | 'verify'>>;
  let configService: jest.Mocked<Pick<ConfigService, 'getOrThrow'>>;

  beforeEach(async () => {
    usersService = {
      findByEmailAndPassword: jest.fn(),
      findById: jest.fn(),
      incrementTokenVersion: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
      verify: jest.fn(),
    };

    configService = {
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        const cfg: Record<string, string> = {
          JWT_SECRET: 'test-secret',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
        };
        return cfg[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── validateUser ──────────────────────────────────────────────────────────

  describe('validateUser', () => {
    it('delegates to usersService.findByEmailAndPassword', async () => {
      usersService.findByEmailAndPassword.mockResolvedValue(mockUser);

      const result = await service.validateUser('user@example.com', 'pw');

      expect(usersService.findByEmailAndPassword).toHaveBeenCalledWith('user@example.com', 'pw');
      expect(result).toBe(mockUser);
    });

    it('returns null when credentials are invalid', async () => {
      usersService.findByEmailAndPassword.mockResolvedValue(null);

      await expect(service.validateUser('x@y.com', 'wrong')).resolves.toBeNull();
    });
  });

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('increments token version and returns both tokens', async () => {
      usersService.incrementTokenVersion.mockResolvedValue(3);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login(mockUser);

      expect(usersService.incrementTokenVersion).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ access_token: 'access-token', refresh_token: 'refresh-token' });
    });

    it('signs the access token with JWT_SECRET and 15m expiry', async () => {
      usersService.incrementTokenVersion.mockResolvedValue(1);
      jwtService.signAsync.mockResolvedValue('token');

      await service.login(mockUser);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email, role: mockUser.role },
        { secret: 'test-secret', expiresIn: '15m' },
      );
    });

    it('signs the refresh token with JWT_REFRESH_SECRET and 7d expiry', async () => {
      usersService.incrementTokenVersion.mockResolvedValue(5);
      jwtService.signAsync.mockResolvedValue('token');

      await service.login(mockUser);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, ver: 5 },
        { secret: 'test-refresh-secret', expiresIn: '7d' },
      );
    });
  });

  // ── refresh ───────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('throws UnauthorizedException when token verification fails', async () => {
      jwtService.verify.mockImplementation(() => { throw new Error('expired'); });

      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user no longer exists', async () => {
      jwtService.verify.mockReturnValue({ sub: 1, ver: 2 });
      usersService.findById.mockResolvedValue(null);

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('detects token reuse, invalidates all sessions, and throws', async () => {
      jwtService.verify.mockReturnValue({ sub: 1, ver: 99 }); // stale version
      usersService.findById.mockResolvedValue({ ...mockUser, refreshTokenVersion: 2 });
      usersService.incrementTokenVersion.mockResolvedValue(3);

      await expect(service.refresh('stale-token')).rejects.toThrow('Token reuse detected');
      expect(usersService.incrementTokenVersion).toHaveBeenCalledWith(mockUser.id);
    });

    it('issues new tokens when refresh token is valid', async () => {
      jwtService.verify.mockReturnValue({ sub: 1, ver: 2 });
      usersService.findById.mockResolvedValue({ ...mockUser, refreshTokenVersion: 2 });
      usersService.incrementTokenVersion.mockResolvedValue(3);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh');

      const result = await service.refresh('valid-token');

      expect(result).toEqual({ access_token: 'new-access', refresh_token: 'new-refresh' });
    });

    it('verifies with JWT_REFRESH_SECRET', async () => {
      jwtService.verify.mockReturnValue({ sub: 1, ver: 2 });
      usersService.findById.mockResolvedValue({ ...mockUser, refreshTokenVersion: 2 });
      usersService.incrementTokenVersion.mockResolvedValue(3);
      jwtService.signAsync.mockResolvedValue('token');

      await service.refresh('valid-token');

      expect(jwtService.verify).toHaveBeenCalledWith(
        'valid-token',
        { secret: 'test-refresh-secret' },
      );
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('increments token version to invalidate all sessions', async () => {
      usersService.incrementTokenVersion.mockResolvedValue(4);

      await service.logout(mockUser.id);

      expect(usersService.incrementTokenVersion).toHaveBeenCalledWith(mockUser.id);
    });
  });

  // ── impersonate ───────────────────────────────────────────────────────────

  describe('impersonate', () => {
    it('throws NotFoundException when target user does not exist', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(service.impersonate(99, 1)).rejects.toThrow(NotFoundException);
    });

    it('returns a short-lived access token carrying impersonatedBy', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('impersonation-token');

      const result = await service.impersonate(99, mockUser.id);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, email: mockUser.email, role: mockUser.role, impersonatedBy: 99 },
        { secret: 'test-secret', expiresIn: '30m' },
      );
      expect(result).toEqual({ access_token: 'impersonation-token' });
    });

    it('does not issue a refresh token for impersonation', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('token');

      const result = await service.impersonate(99, mockUser.id);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(1);
      expect(result).not.toHaveProperty('refresh_token');
    });
  });
});
