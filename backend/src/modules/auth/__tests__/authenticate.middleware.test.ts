import type { NextFunction, Response } from 'express';
import { authenticate } from '../authenticate.middleware';
import type { AuthenticatedRequest } from '../auth.controller';
import type { AuthService, TokenPayload } from '../auth.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockResponse(): jest.Mocked<Response> {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as jest.Mocked<Response>;
  res.status.mockReturnValue(res);
  return res;
}

function makeMockAuthService(
  overrides: Partial<AuthService> = {},
): jest.Mocked<AuthService> {
  return {
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
    generateTokens: jest.fn(),
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
    ...overrides,
  } as unknown as jest.Mocked<AuthService>;
}

function makeRequest(authHeader?: string): AuthenticatedRequest {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as AuthenticatedRequest;
}

const mockPayload: TokenPayload = { userId: '1', email: 'user@example.com', role: 'USER' };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('authenticate middleware', () => {
  let service: jest.Mocked<AuthService>;
  let res: jest.Mocked<Response>;
  let next: jest.MockedFunction<NextFunction>;
  let middleware: ReturnType<typeof authenticate>;

  beforeEach(() => {
    service = makeMockAuthService();
    res = makeMockResponse();
    next = jest.fn();
    middleware = authenticate(service);
  });

  // ─── Token extraction ──────────────────────────────────────────────────────

  it('should call next() and set req.user when token is valid', async () => {
    service.verifyAccessToken.mockResolvedValue(mockPayload);
    const req = makeRequest('Bearer valid.access.token');

    await middleware(req, res, next);

    expect(service.verifyAccessToken).toHaveBeenCalledWith('valid.access.token');
    expect(req.user).toEqual(mockPayload);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header is missing', async () => {
    const req = makeRequest();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header does not start with Bearer', async () => {
    const req = makeRequest('Basic dXNlcjpwYXNz');

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when Bearer token is empty', async () => {
    const req = makeRequest('Bearer ');

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // ─── Token verification errors ─────────────────────────────────────────────

  it('should return 401 with "Token has expired" when token is expired', async () => {
    service.verifyAccessToken.mockRejectedValue(new Error('Access token has expired'));
    const req = makeRequest('Bearer expired.token');

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token has expired' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 with "Invalid token" when token signature is wrong', async () => {
    service.verifyAccessToken.mockRejectedValue(new Error('Invalid access token'));
    const req = makeRequest('Bearer tampered.token');

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 with "Invalid token" on unexpected verification error', async () => {
    service.verifyAccessToken.mockRejectedValue(new Error('Something went wrong'));
    const req = makeRequest('Bearer some.token');

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  // ─── Payload attachment ────────────────────────────────────────────────────

  it('should attach the full payload (userId, email, role) to req.user', async () => {
    const fullPayload: TokenPayload = { userId: 'abc-123', email: 'admin@test.com', role: 'ADMIN' };
    service.verifyAccessToken.mockResolvedValue(fullPayload);
    const req = makeRequest('Bearer admin.token');

    await middleware(req, res, next);

    expect(req.user).toStrictEqual(fullPayload);
  });
});
