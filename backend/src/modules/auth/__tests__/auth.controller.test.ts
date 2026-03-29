import type { Response } from 'express';
import { AuthController, type AuthenticatedRequest } from '../auth.controller';
import type { AuthService } from '../auth.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockResponse(): jest.Mocked<Response> {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as jest.Mocked<Response>;
  // Allow chaining: res.status(200).json(...)
  res.status.mockReturnValue(res);
  return res;
}

function makeMockService(overrides: Partial<AuthService> = {}): jest.Mocked<AuthService> {
  return {
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
    generateTokens: jest.fn(),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
    ...overrides,
  } as unknown as jest.Mocked<AuthService>;
}

function makeRequest(body: unknown = {}, user?: object): AuthenticatedRequest {
  return { body, user } as AuthenticatedRequest;
}

const mockLoginResult = {
  user: { id: '1', email: 'user@example.com', firstName: 'John', lastName: 'Doe', role: 'USER' },
  tokens: { accessToken: 'access.token', refreshToken: 'refresh.token' },
};

const mockTokens = { accessToken: 'new.access.token', refreshToken: 'new.refresh.token' };

// ─── login ────────────────────────────────────────────────────────────────────

describe('AuthController.login', () => {
  let service: jest.Mocked<AuthService>;
  let controller: AuthController;
  let res: jest.Mocked<Response>;

  beforeEach(() => {
    service = makeMockService();
    controller = new AuthController(service);
    res = makeMockResponse();
  });

  it('should return 200 with user and tokens on valid credentials', async () => {
    service.login.mockResolvedValue(mockLoginResult);
    const req = makeRequest({ email: 'user@example.com', password: 'secret' });

    await controller.login(req, res);

    expect(service.login).toHaveBeenCalledWith('user@example.com', 'secret');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      user: mockLoginResult.user,
      tokens: mockLoginResult.tokens,
    });
  });

  it('should return 400 when email is missing', async () => {
    const req = makeRequest({ password: 'secret' });
    await controller.login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Validation failed' }));
    expect(service.login).not.toHaveBeenCalled();
  });

  it('should return 400 when email is invalid', async () => {
    const req = makeRequest({ email: 'not-an-email', password: 'secret' });
    await controller.login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(service.login).not.toHaveBeenCalled();
  });

  it('should return 400 when password is empty', async () => {
    const req = makeRequest({ email: 'user@example.com', password: '' });
    await controller.login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(service.login).not.toHaveBeenCalled();
  });

  it('should return 401 when service throws invalid credentials error', async () => {
    service.login.mockRejectedValue(new Error('Invalid email or password'));
    const req = makeRequest({ email: 'user@example.com', password: 'wrong' });

    await controller.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
  });

  it('should return 500 on unexpected service error', async () => {
    service.login.mockRejectedValue(new Error('Database connection failed'));
    const req = makeRequest({ email: 'user@example.com', password: 'secret' });

    await controller.login(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should include validation details in 400 response', async () => {
    const req = makeRequest({});
    await controller.login(req, res);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg).toHaveProperty('details');
    expect(Array.isArray(jsonArg.details)).toBe(true);
  });
});

// ─── refresh ──────────────────────────────────────────────────────────────────

describe('AuthController.refresh', () => {
  let service: jest.Mocked<AuthService>;
  let controller: AuthController;
  let res: jest.Mocked<Response>;

  beforeEach(() => {
    service = makeMockService();
    controller = new AuthController(service);
    res = makeMockResponse();
  });

  it('should return 200 with new tokens on valid refresh token', async () => {
    service.refreshTokens.mockResolvedValue(mockTokens);
    const req = makeRequest({ refreshToken: 'valid.refresh.token' });

    await controller.refresh(req, res);

    expect(service.refreshTokens).toHaveBeenCalledWith('valid.refresh.token');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ tokens: mockTokens });
  });

  it('should return 400 when refreshToken is missing', async () => {
    const req = makeRequest({});
    await controller.refresh(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(service.refreshTokens).not.toHaveBeenCalled();
  });

  it('should return 400 when refreshToken is empty string', async () => {
    const req = makeRequest({ refreshToken: '' });
    await controller.refresh(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(service.refreshTokens).not.toHaveBeenCalled();
  });

  it('should return 401 when token is expired', async () => {
    service.refreshTokens.mockRejectedValue(new Error('Refresh token has expired'));
    const req = makeRequest({ refreshToken: 'expired.token' });

    await controller.refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 401 when token has been invalidated', async () => {
    service.refreshTokens.mockRejectedValue(new Error('Refresh token has been invalidated'));
    const req = makeRequest({ refreshToken: 'used.token' });

    await controller.refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 401 when user not found', async () => {
    service.refreshTokens.mockRejectedValue(new Error('User not found'));
    const req = makeRequest({ refreshToken: 'orphan.token' });

    await controller.refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 500 on unexpected error', async () => {
    service.refreshTokens.mockRejectedValue(new Error('Database error'));
    const req = makeRequest({ refreshToken: 'valid.token' });

    await controller.refresh(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe('AuthController.logout', () => {
  let service: jest.Mocked<AuthService>;
  let controller: AuthController;
  let res: jest.Mocked<Response>;

  beforeEach(() => {
    service = makeMockService();
    controller = new AuthController(service);
    res = makeMockResponse();
  });

  it('should return 200 on successful logout', async () => {
    service.logout.mockResolvedValue(undefined);
    const req = makeRequest({ refreshToken: 'valid.refresh.token' });

    await controller.logout(req, res);

    expect(service.logout).toHaveBeenCalledWith('valid.refresh.token');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
  });

  it('should return 400 when refreshToken is missing', async () => {
    const req = makeRequest({});
    await controller.logout(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(service.logout).not.toHaveBeenCalled();
  });

  it('should return 400 when refreshToken is empty', async () => {
    const req = makeRequest({ refreshToken: '' });
    await controller.logout(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 500 on unexpected service error', async () => {
    service.logout.mockRejectedValue(new Error('Unexpected error'));
    const req = makeRequest({ refreshToken: 'valid.token' });

    await controller.logout(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getCurrentUser ───────────────────────────────────────────────────────────

describe('AuthController.getCurrentUser', () => {
  let service: jest.Mocked<AuthService>;
  let controller: AuthController;
  let res: jest.Mocked<Response>;

  const mockUserPayload = { userId: '1', email: 'user@example.com', role: 'USER' };

  beforeEach(() => {
    service = makeMockService();
    controller = new AuthController(service);
    res = makeMockResponse();
  });

  it('should return 200 with user payload when authenticated', async () => {
    const req = makeRequest({}, mockUserPayload);

    await controller.getCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user: mockUserPayload });
  });

  it('should return 401 when req.user is not set', async () => {
    const req = makeRequest({});

    await controller.getCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
  });
});
