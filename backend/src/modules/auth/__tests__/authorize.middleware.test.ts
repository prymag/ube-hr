import type { NextFunction, Response } from 'express';
import { authorize } from '../authorize.middleware';
import type { AuthenticatedRequest } from '../auth.controller';
import type { TokenPayload } from '../auth.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockResponse(): jest.Mocked<Response> {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as jest.Mocked<Response>;
  res.status.mockReturnValue(res);
  return res;
}

function makeRequest(user?: TokenPayload): AuthenticatedRequest {
  return { user } as unknown as AuthenticatedRequest;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('authorize middleware', () => {
  let res: jest.Mocked<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    res = makeMockResponse();
    next = jest.fn();
  });

  // ─── Unauthenticated requests ──────────────────────────────────────────────

  it('should return 401 when req.user is not set', () => {
    const middleware = authorize('ADMIN');
    const req = makeRequest(undefined);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  // ─── Single role requirement ───────────────────────────────────────────────

  it('should call next() when user role matches single required role', () => {
    const middleware = authorize('ADMIN');
    const req = makeRequest({ userId: '1', email: 'admin@test.com', role: 'ADMIN' });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 403 when user role does not match single required role', () => {
    const middleware = authorize('ADMIN');
    const req = makeRequest({ userId: '1', email: 'user@test.com', role: 'USER' });

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: insufficient permissions' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow SYSTEM_ADMIN when SYSTEM_ADMIN is required', () => {
    const middleware = authorize('SYSTEM_ADMIN');
    const req = makeRequest({ userId: '1', email: 'sysadmin@test.com', role: 'SYSTEM_ADMIN' });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should deny ADMIN when SYSTEM_ADMIN is required', () => {
    const middleware = authorize('SYSTEM_ADMIN');
    const req = makeRequest({ userId: '1', email: 'admin@test.com', role: 'ADMIN' });

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // ─── Array role requirement ────────────────────────────────────────────────

  it('should call next() when user role is in the allowed roles array', () => {
    const middleware = authorize(['ADMIN', 'SYSTEM_ADMIN']);
    const req = makeRequest({ userId: '1', email: 'admin@test.com', role: 'ADMIN' });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should call next() when user is SYSTEM_ADMIN and array includes SYSTEM_ADMIN', () => {
    const middleware = authorize(['ADMIN', 'SYSTEM_ADMIN']);
    const req = makeRequest({ userId: '1', email: 'sysadmin@test.com', role: 'SYSTEM_ADMIN' });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should return 403 when user role is not in the allowed roles array', () => {
    const middleware = authorize(['ADMIN', 'SYSTEM_ADMIN']);
    const req = makeRequest({ userId: '1', email: 'user@test.com', role: 'USER' });

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: insufficient permissions' });
    expect(next).not.toHaveBeenCalled();
  });

  // ─── Missing role on payload ───────────────────────────────────────────────

  it('should return 403 when user payload has no role field', () => {
    const middleware = authorize('USER');
    const req = makeRequest({ userId: '1', email: 'user@test.com' } as TokenPayload);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // ─── All roles ─────────────────────────────────────────────────────────────

  it('should allow USER role when USER is the only requirement', () => {
    const middleware = authorize('USER');
    const req = makeRequest({ userId: '1', email: 'user@test.com', role: 'USER' });

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should allow all three roles when all are listed as requirements', () => {
    const middleware = authorize(['USER', 'ADMIN', 'SYSTEM_ADMIN']);

    for (const role of ['USER', 'ADMIN', 'SYSTEM_ADMIN'] as const) {
      const req = makeRequest({ userId: '1', email: 'test@test.com', role });
      const localRes = makeMockResponse();
      const localNext = jest.fn();
      middleware(req, localRes, localNext);
      expect(localNext).toHaveBeenCalledTimes(1);
      expect(localRes.status).not.toHaveBeenCalled();
    }
  });
});
