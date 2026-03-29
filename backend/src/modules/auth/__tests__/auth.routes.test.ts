import express from 'express';
import request from 'supertest';
import type { RequestHandler } from 'express';
import { createAuthRouter } from '../auth.routes';
import type { AuthController } from '../auth.controller';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockController(): jest.Mocked<AuthController> {
  return {
    login: jest.fn((_req, res) => res.status(200).json({ ok: true })) as unknown as jest.Mocked<AuthController>['login'],
    refresh: jest.fn((_req, res) => res.status(200).json({ ok: true })) as unknown as jest.Mocked<AuthController>['refresh'],
    logout: jest.fn((_req, res) => res.status(200).json({ ok: true })) as unknown as jest.Mocked<AuthController>['logout'],
    getCurrentUser: jest.fn((_req, res) => res.status(200).json({ ok: true })) as unknown as jest.Mocked<AuthController>['getCurrentUser'],
  } as unknown as jest.Mocked<AuthController>;
}

/** Middleware that passes through — simulates authenticated user */
const allowAuth: RequestHandler = (_req, _res, next) => next();

/** Middleware that rejects — simulates unauthenticated request */
const denyAuth: RequestHandler = (_req, res, _next) => {
  res.status(401).json({ error: 'Not authenticated' });
};

function buildApp(controller: jest.Mocked<AuthController>, authenticate: RequestHandler) {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', createAuthRouter(controller, authenticate));
  return app;
}

// ─── POST /login ──────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {
  let controller: jest.Mocked<AuthController>;

  beforeEach(() => {
    controller = makeMockController();
  });

  it('should route to controller.login', async () => {
    const app = buildApp(controller, allowAuth);
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'a@b.com', password: 'x' });
    expect(res.status).toBe(200);
    expect(controller.login).toHaveBeenCalledTimes(1);
  });

  it('should not require authentication middleware', async () => {
    const app = buildApp(controller, denyAuth);
    // denyAuth is only on protected routes; login should still reach the controller
    await request(app).post('/api/v1/auth/login').send({});
    expect(controller.login).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for GET /login', async () => {
    const app = buildApp(controller, allowAuth);
    const res = await request(app).get('/api/v1/auth/login');
    expect(res.status).toBe(404);
  });
});

// ─── POST /refresh ────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/refresh', () => {
  let controller: jest.Mocked<AuthController>;

  beforeEach(() => {
    controller = makeMockController();
  });

  it('should route to controller.refresh', async () => {
    const app = buildApp(controller, allowAuth);
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: 'tok' });
    expect(res.status).toBe(200);
    expect(controller.refresh).toHaveBeenCalledTimes(1);
  });

  it('should not require authentication middleware', async () => {
    const app = buildApp(controller, denyAuth);
    await request(app).post('/api/v1/auth/refresh').send({});
    expect(controller.refresh).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for GET /refresh', async () => {
    const app = buildApp(controller, allowAuth);
    const res = await request(app).get('/api/v1/auth/refresh');
    expect(res.status).toBe(404);
  });
});

// ─── POST /logout ─────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/logout', () => {
  let controller: jest.Mocked<AuthController>;

  beforeEach(() => {
    controller = makeMockController();
  });

  it('should route to controller.logout when authenticated', async () => {
    const app = buildApp(controller, allowAuth);
    const res = await request(app).post('/api/v1/auth/logout').send({ refreshToken: 'tok' });
    expect(res.status).toBe(200);
    expect(controller.logout).toHaveBeenCalledTimes(1);
  });

  it('should return 401 when authentication middleware rejects', async () => {
    const app = buildApp(controller, denyAuth);
    const res = await request(app).post('/api/v1/auth/logout').send({ refreshToken: 'tok' });
    expect(res.status).toBe(401);
    expect(controller.logout).not.toHaveBeenCalled();
  });

  it('should return 404 for GET /logout', async () => {
    const app = buildApp(controller, allowAuth);
    const res = await request(app).get('/api/v1/auth/logout');
    expect(res.status).toBe(404);
  });
});

// ─── GET /me ──────────────────────────────────────────────────────────────────

describe('GET /api/v1/auth/me', () => {
  let controller: jest.Mocked<AuthController>;

  beforeEach(() => {
    controller = makeMockController();
  });

  it('should route to controller.getCurrentUser when authenticated', async () => {
    const app = buildApp(controller, allowAuth);
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(200);
    expect(controller.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('should return 401 when authentication middleware rejects', async () => {
    const app = buildApp(controller, denyAuth);
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(controller.getCurrentUser).not.toHaveBeenCalled();
  });

  it('should return 404 for POST /me', async () => {
    const app = buildApp(controller, allowAuth);
    const res = await request(app).post('/api/v1/auth/me');
    expect(res.status).toBe(404);
  });
});

// ─── Route-level error handler ────────────────────────────────────────────────

describe('Route-level error handler', () => {
  it('should catch errors thrown by route handlers and return 500', async () => {
    const controller = makeMockController();
    controller.login.mockImplementationOnce(() => {
      throw new Error('Unexpected crash');
    });

    const app = buildApp(controller, allowAuth);
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal server error');
  });
});
