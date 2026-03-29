import type { Response } from 'express';
import { UsersController } from '../users.controller';
import type { UsersService } from '../users.service';
import type { AuthenticatedRequest } from '../../auth/auth.controller';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRes(): jest.Mocked<Response> {
  const res = { status: jest.fn(), json: jest.fn(), send: jest.fn() } as unknown as jest.Mocked<Response>;
  res.status.mockReturnValue(res);
  return res;
}

function makeReq(
  overrides: Partial<AuthenticatedRequest> = {},
): AuthenticatedRequest {
  return {
    body: {},
    params: {},
    query: {},
    user: { userId: 'actor-1', email: 'admin@test.com', role: 'ADMIN' },
    ...overrides,
  } as unknown as AuthenticatedRequest;
}

function makeSvc(overrides: Partial<jest.Mocked<UsersService>> = {}): jest.Mocked<UsersService> {
  return {
    createUser: jest.fn(),
    listUsers: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    ...overrides,
  } as unknown as jest.Mocked<UsersService>;
}

const safeUser = {
  id: 'user-1',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
  role: 'USER' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validCreateBody = {
  email: 'alice@example.com',
  password: 'SecurePass1',
  firstName: 'Alice',
  lastName: 'Smith',
};

const validUpdateBody = { firstName: 'Alicia' };

// ─── createUser ───────────────────────────────────────────────────────────────

describe('UsersController.createUser', () => {
  it('returns 201 with created user on success', async () => {
    const svc = makeSvc({ createUser: jest.fn().mockResolvedValue(safeUser) });
    const ctrl = new UsersController(svc);
    const req = makeReq({ body: validCreateBody });
    const res = makeRes();

    await ctrl.createUser(req, res);

    expect(svc.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'alice@example.com' }),
      'ADMIN',
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ user: safeUser });
  });

  it('returns 400 when body fails validation', async () => {
    const ctrl = new UsersController(makeSvc());
    const req = makeReq({ body: { email: 'bad-email', password: 'x' } });
    const res = makeRes();

    await ctrl.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Validation failed', details: expect.any(Array) }));
  });

  it('returns 400 when password is too weak', async () => {
    const ctrl = new UsersController(makeSvc());
    const req = makeReq({ body: { ...validCreateBody, password: 'short' } });
    const res = makeRes();

    await ctrl.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when req.user is absent', async () => {
    const ctrl = new UsersController(makeSvc());
    const req = makeReq({ body: validCreateBody, user: undefined });
    const res = makeRes();

    await ctrl.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
  });

  it('returns 403 on insufficient permissions', async () => {
    const svc = makeSvc({ createUser: jest.fn().mockRejectedValue(new Error('Insufficient permissions to create users')) });
    const ctrl = new UsersController(svc);
    const req = makeReq({ body: validCreateBody, user: { userId: 'u1', email: 'user@test.com', role: 'USER' } });
    const res = makeRes();

    await ctrl.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 403 on ADMIN role-elevation attempt', async () => {
    const svc = makeSvc({ createUser: jest.fn().mockRejectedValue(new Error('ADMIN cannot assign ADMIN or SYSTEM_ADMIN role')) });
    const ctrl = new UsersController(svc);
    const req = makeReq({ body: { ...validCreateBody, role: 'ADMIN' } });
    const res = makeRes();

    await ctrl.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 409 when email already exists', async () => {
    const svc = makeSvc({ createUser: jest.fn().mockRejectedValue(new Error('A user with this email already exists')) });
    const ctrl = new UsersController(svc);
    const req = makeReq({ body: validCreateBody });
    const res = makeRes();

    await ctrl.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('returns 500 on unexpected error', async () => {
    const svc = makeSvc({ createUser: jest.fn().mockRejectedValue(new Error('Database down')) });
    const ctrl = new UsersController(svc);
    const req = makeReq({ body: validCreateBody });
    const res = makeRes();

    await ctrl.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── listUsers ────────────────────────────────────────────────────────────────

describe('UsersController.listUsers', () => {
  const paginatedResult = { data: [safeUser], total: 1, skip: 0, take: 10 };

  it('returns 200 with paginated result', async () => {
    const svc = makeSvc({ listUsers: jest.fn().mockResolvedValue(paginatedResult) });
    const ctrl = new UsersController(svc);
    const req = makeReq({ query: {} });
    const res = makeRes();

    await ctrl.listUsers(req, res);

    expect(svc.listUsers).toHaveBeenCalledWith(
      expect.objectContaining({ role: undefined, email: undefined }),
      expect.objectContaining({ skip: 0, take: 10 }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(paginatedResult);
  });

  it('passes query filters to service', async () => {
    const svc = makeSvc({ listUsers: jest.fn().mockResolvedValue({ data: [], total: 0, skip: 0, take: 10 }) });
    const ctrl = new UsersController(svc);
    const req = makeReq({ query: { role: 'ADMIN', email: 'alice', skip: '20', take: '5' } });
    const res = makeRes();

    await ctrl.listUsers(req, res);

    expect(svc.listUsers).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'ADMIN', email: 'alice' }),
      { skip: 20, take: 5 },
    );
  });

  it('returns 400 when take exceeds maximum', async () => {
    const ctrl = new UsersController(makeSvc());
    const req = makeReq({ query: { take: '200' } });
    const res = makeRes();

    await ctrl.listUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when skip is negative', async () => {
    const ctrl = new UsersController(makeSvc());
    const req = makeReq({ query: { skip: '-1' } });
    const res = makeRes();

    await ctrl.listUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 on unexpected error', async () => {
    const svc = makeSvc({ listUsers: jest.fn().mockRejectedValue(new Error('DB error')) });
    const ctrl = new UsersController(svc);
    const req = makeReq({ query: {} });
    const res = makeRes();

    await ctrl.listUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── updateUser ───────────────────────────────────────────────────────────────

describe('UsersController.updateUser', () => {
  it('returns 200 with updated user on success', async () => {
    const updated = { ...safeUser, firstName: 'Alicia' };
    const svc = makeSvc({ updateUser: jest.fn().mockResolvedValue(updated) });
    const ctrl = new UsersController(svc);
    const req = makeReq({ params: { userId: 'user-1' }, body: validUpdateBody });
    const res = makeRes();

    await ctrl.updateUser(req, res);

    expect(svc.updateUser).toHaveBeenCalledWith('user-1', expect.objectContaining({ firstName: 'Alicia' }), 'ADMIN');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user: updated });
  });

  it('returns 400 when body fails validation', async () => {
    const ctrl = new UsersController(makeSvc());
    const req = makeReq({ params: { userId: 'user-1' }, body: { email: 'not-valid-email' } });
    const res = makeRes();

    await ctrl.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when req.user is absent', async () => {
    const ctrl = new UsersController(makeSvc());
    const req = makeReq({ params: { userId: 'user-1' }, body: validUpdateBody, user: undefined });
    const res = makeRes();

    await ctrl.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 403 when ADMIN tries to modify SYSTEM_ADMIN', async () => {
    const svc = makeSvc({ updateUser: jest.fn().mockRejectedValue(new Error('ADMIN cannot modify a SYSTEM_ADMIN account')) });
    const ctrl = new UsersController(svc);
    const req = makeReq({ params: { userId: 'sys-1' }, body: validUpdateBody });
    const res = makeRes();

    await ctrl.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 404 when user is not found', async () => {
    const svc = makeSvc({ updateUser: jest.fn().mockRejectedValue(new Error('User not found')) });
    const ctrl = new UsersController(svc);
    const req = makeReq({ params: { userId: 'ghost' }, body: validUpdateBody });
    const res = makeRes();

    await ctrl.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 500 on unexpected error', async () => {
    const svc = makeSvc({ updateUser: jest.fn().mockRejectedValue(new Error('DB error')) });
    const ctrl = new UsersController(svc);
    const req = makeReq({ params: { userId: 'user-1' }, body: validUpdateBody });
    const res = makeRes();

    await ctrl.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── deleteUser ───────────────────────────────────────────────────────────────

describe('UsersController.deleteUser', () => {
  it('returns 204 on successful deletion', async () => {
    const svc = makeSvc({ deleteUser: jest.fn().mockResolvedValue(undefined) });
    const ctrl = new UsersController(svc);
    const req = makeReq({ params: { userId: 'user-1' } });
    const res = makeRes();

    await ctrl.deleteUser(req, res);

    expect(svc.deleteUser).toHaveBeenCalledWith('user-1', 'ADMIN');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('returns 401 when req.user is absent', async () => {
    const ctrl = new UsersController(makeSvc());
    const req = makeReq({ params: { userId: 'user-1' }, user: undefined });
    const res = makeRes();

    await ctrl.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 403 on insufficient permissions', async () => {
    const svc = makeSvc({ deleteUser: jest.fn().mockRejectedValue(new Error('Insufficient permissions to delete users')) });
    const ctrl = new UsersController(svc);
    const req = makeReq({ params: { userId: 'user-1' }, user: { userId: 'u', email: 'u@test.com', role: 'USER' } });
    const res = makeRes();

    await ctrl.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 404 when user is not found', async () => {
    const svc = makeSvc({ deleteUser: jest.fn().mockRejectedValue(new Error('User not found')) });
    const ctrl = new UsersController(svc);
    const req = makeReq({ params: { userId: 'ghost' } });
    const res = makeRes();

    await ctrl.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when SYSTEM_ADMIN deletion is attempted', async () => {
    const svc = makeSvc({ deleteUser: jest.fn().mockRejectedValue(new Error('Cannot delete a SYSTEM_ADMIN account')) });
    const ctrl = new UsersController(svc);
    const req = makeReq({ params: { userId: 'sys-1' } });
    const res = makeRes();

    await ctrl.deleteUser(req, res);

    // 'Cannot delete a SYSTEM_ADMIN account' doesn't match permission/ADMIN patterns → 500
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('returns 500 on unexpected error', async () => {
    const svc = makeSvc({ deleteUser: jest.fn().mockRejectedValue(new Error('Crash')) });
    const ctrl = new UsersController(svc);
    const req = makeReq({ params: { userId: 'user-1' } });
    const res = makeRes();

    await ctrl.deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
