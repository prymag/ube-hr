import express from 'express';
import request from 'supertest';
import type { RequestHandler } from 'express';
import { createUsersRouter } from '../users.routes';
import type { UsersController } from '../users.controller';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockController(): jest.Mocked<UsersController> {
  return {
    createUser: jest.fn((_req, res) => res.status(201).json({ ok: true })) as unknown as jest.Mocked<UsersController>['createUser'],
    listUsers: jest.fn((_req, res) => res.status(200).json({ data: [] })) as unknown as jest.Mocked<UsersController>['listUsers'],
    updateUser: jest.fn((_req, res) => res.status(200).json({ ok: true })) as unknown as jest.Mocked<UsersController>['updateUser'],
    deleteUser: jest.fn((_req, res) => res.status(204).send()) as unknown as jest.Mocked<UsersController>['deleteUser'],
  } as unknown as jest.Mocked<UsersController>;
}

/** Passes through — simulates authenticated + authorized request */
const allowAll: RequestHandler = (_req, _res, next) => next();

/** Rejects at the authenticate step */
const denyAuth: RequestHandler = (_req, res) => {
  res.status(401).json({ error: 'Not authenticated' });
};

/** Rejects at the authorize step */
const denyAuthz: RequestHandler = (_req, res) => {
  res.status(403).json({ error: 'Forbidden' });
};

function buildApp(
  controller: jest.Mocked<UsersController>,
  authenticate: RequestHandler = allowAll,
  authorize: RequestHandler = allowAll,
) {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/users', createUsersRouter(controller, authenticate, authorize));
  return app;
}

// ─── POST /api/v1/users ───────────────────────────────────────────────────────

describe('POST /api/v1/users', () => {
  it('routes to controller.createUser', async () => {
    const ctrl = makeMockController();
    const res = await request(buildApp(ctrl)).post('/api/v1/users').send({});
    expect(res.status).toBe(201);
    expect(ctrl.createUser).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when authenticate middleware rejects', async () => {
    const ctrl = makeMockController();
    const res = await request(buildApp(ctrl, denyAuth)).post('/api/v1/users').send({});
    expect(res.status).toBe(401);
    expect(ctrl.createUser).not.toHaveBeenCalled();
  });

  it('returns 403 when authorize middleware rejects', async () => {
    const ctrl = makeMockController();
    const res = await request(buildApp(ctrl, allowAll, denyAuthz)).post('/api/v1/users').send({});
    expect(res.status).toBe(403);
    expect(ctrl.createUser).not.toHaveBeenCalled();
  });

  it('returns 404 for GET /users when controller only handles POST', async () => {
    // GET is a different route — it should still route to listUsers, not 404
    const ctrl = makeMockController();
    const res = await request(buildApp(ctrl)).get('/api/v1/users');
    expect(res.status).toBe(200);
    expect(ctrl.listUsers).toHaveBeenCalledTimes(1);
  });
});

// ─── GET /api/v1/users ────────────────────────────────────────────────────────

describe('GET /api/v1/users', () => {
  it('routes to controller.listUsers', async () => {
    const ctrl = makeMockController();
    const res = await request(buildApp(ctrl)).get('/api/v1/users');
    expect(res.status).toBe(200);
    expect(ctrl.listUsers).toHaveBeenCalledTimes(1);
  });

  it('passes query parameters through', async () => {
    const ctrl = makeMockController();
    await request(buildApp(ctrl)).get('/api/v1/users?skip=10&take=5&role=ADMIN');
    expect(ctrl.listUsers).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when authenticate middleware rejects', async () => {
    const ctrl = makeMockController();
    const res = await request(buildApp(ctrl, denyAuth)).get('/api/v1/users');
    expect(res.status).toBe(401);
    expect(ctrl.listUsers).not.toHaveBeenCalled();
  });

  it('returns 403 when authorize middleware rejects', async () => {
    const ctrl = makeMockController();
    const res = await request(buildApp(ctrl, allowAll, denyAuthz)).get('/api/v1/users');
    expect(res.status).toBe(403);
    expect(ctrl.listUsers).not.toHaveBeenCalled();
  });

  it('returns 404 for unknown method on /users', async () => {
    const ctrl = makeMockController();
    const res = await request(buildApp(ctrl)).put('/api/v1/users');
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/v1/users/:userId ─────────────────────────────────────────────

describe('PATCH /api/v1/users/:userId', () => {
  it('routes to controller.updateUser with correct userId param', async () => {
    const ctrl = makeMockController();
    const res = await request(buildApp(ctrl)).patch('/api/v1/users/user-123').send({ firstName: 'X' });
    expect(res.status).toBe(200);
    expect(ctrl.updateUser).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when authenticate middleware rejects', async () => {
    const ctrl = makeMockController();
    const res = await request(buildApp(ctrl, denyAuth)).patch('/api/v1/users/user-123').send({});
    expect(res.status).toBe(401);
    expect(ctrl.updateUser).not.toHaveBeenCalled();
  });

  it('returns 403 when authorize middleware rejects', async () => {
    const ctrl = makeMockController();
    const res = await request(buildApp(ctrl, allowAll, denyAuthz)).patch('/api/v1/users/user-123').send({});
    expect(res.status).toBe(403);
    expect(ctrl.updateUser).not.toHaveBeenCalled();
  });

  it('returns 404 for POST on /:userId', async () => {
    const ctrl = makeMockController();
    const res = await request(buildApp(ctrl)).post('/api/v1/users/user-123');
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/v1/users/:userId ────────────────────────────────────────────

describe('DELETE /api/v1/users/:userId', () => {
  it('routes to controller.deleteUser', async () => {
    const ctrl = makeMockController();
    const res = await request(buildApp(ctrl)).delete('/api/v1/users/user-123');
    expect(res.status).toBe(204);
    expect(ctrl.deleteUser).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when authenticate middleware rejects', async () => {
    const ctrl = makeMockController();
    const res = await request(buildApp(ctrl, denyAuth)).delete('/api/v1/users/user-123');
    expect(res.status).toBe(401);
    expect(ctrl.deleteUser).not.toHaveBeenCalled();
  });

  it('returns 403 when authorize middleware rejects', async () => {
    const ctrl = makeMockController();
    const res = await request(buildApp(ctrl, allowAll, denyAuthz)).delete('/api/v1/users/user-123');
    expect(res.status).toBe(403);
    expect(ctrl.deleteUser).not.toHaveBeenCalled();
  });
});

// ─── Route-level error handler ────────────────────────────────────────────────

describe('Route-level error handler', () => {
  it('returns 500 when a handler throws synchronously', async () => {
    const ctrl = makeMockController();
    ctrl.createUser.mockImplementationOnce(() => {
      throw new Error('Unexpected crash');
    });

    const res = await request(buildApp(ctrl)).post('/api/v1/users').send({});
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal server error');
  });
});
