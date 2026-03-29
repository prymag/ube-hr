/**
 * Auth Module — End-to-End Integration Tests
 *
 * Tests the full stack (app → router → controller → service) with a mocked
 * PrismaClient. No real database connection is required.
 */
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import type { PrismaClient } from '@/generated/prisma/client';

// ─── Mocks & fixtures ─────────────────────────────────────────────────────────

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
const PLAIN_PASSWORD = 'TestPass1';
let HASHED_PASSWORD: string;

const baseUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'USER' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeMockPrisma(findUniqueResult: Record<string, unknown> | null = null) {
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue(findUniqueResult),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaClient>;
}

function makeAccessToken(userId: string, role: string): string {
  return jwt.sign({ userId, email: 'test@example.com', role }, ACCESS_SECRET, { expiresIn: '15m' });
}

beforeAll(async () => {
  HASHED_PASSWORD = await bcrypt.hash(PLAIN_PASSWORD, 10);
});

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {
  it('returns 200 with user and tokens on valid credentials', async () => {
    const mockPrisma = makeMockPrisma({ ...baseUser, password: HASHED_PASSWORD });
    const app = createApp(mockPrisma);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: PLAIN_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: 'test@example.com', role: 'USER' });
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.tokens.refreshToken).toBeDefined();
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('returns 401 when password is wrong', async () => {
    const mockPrisma = makeMockPrisma({ ...baseUser, password: HASHED_PASSWORD });
    const app = createApp(mockPrisma);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('returns 401 when user is not found', async () => {
    const mockPrisma = makeMockPrisma(null);
    const app = createApp(mockPrisma);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: PLAIN_PASSWORD });

    expect(res.status).toBe(401);
  });

  it('returns 400 when email is invalid format', async () => {
    const app = createApp(makeMockPrisma());

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: PLAIN_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 400 when body is empty', async () => {
    const app = createApp(makeMockPrisma());
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('does not reveal whether the email exists (same error for both cases)', async () => {
    const app = createApp(makeMockPrisma({ ...baseUser, password: HASHED_PASSWORD }));

    const [wrongPw, noUser] = await Promise.all([
      request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'WrongPass1' }),
      request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'ghost@example.com', password: 'WrongPass1' }),
    ]);

    expect(wrongPw.body.error).toBe(noUser.body.error);
  });
});

// ─── POST /api/v1/auth/refresh ────────────────────────────────────────────────

describe('POST /api/v1/auth/refresh', () => {
  async function loginAndGetTokens(mockPrisma: jest.Mocked<PrismaClient>) {
    const app = createApp(mockPrisma);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: PLAIN_PASSWORD });
    return { app, tokens: res.body.tokens };
  }

  it('returns 200 with new tokens on valid refresh token', async () => {
    const mockPrisma = makeMockPrisma({ ...baseUser, password: HASHED_PASSWORD });
    const { app, tokens } = await loginAndGetTokens(mockPrisma);

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.tokens.refreshToken).toBeDefined();
  });

  it('returns 401 on invalid refresh token', async () => {
    const app = createApp(makeMockPrisma({ ...baseUser, password: HASHED_PASSWORD }));

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'not.a.valid.token' });

    expect(res.status).toBe(401);
  });

  it('returns 401 when refresh token is reused (rotation)', async () => {
    const mockPrisma = makeMockPrisma({ ...baseUser, password: HASHED_PASSWORD });
    const { app, tokens } = await loginAndGetTokens(mockPrisma);

    // First refresh — should succeed
    await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken });

    // Second use of same token — should be rejected (token rotation)
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken });

    expect(res.status).toBe(401);
  });

  it('returns 400 when refreshToken field is missing', async () => {
    const app = createApp(makeMockPrisma());
    const res = await request(app).post('/api/v1/auth/refresh').send({});
    expect(res.status).toBe(400);
  });
});

// ─── POST /api/v1/auth/logout ─────────────────────────────────────────────────

describe('POST /api/v1/auth/logout', () => {
  it('returns 200 on successful logout', async () => {
    const mockPrisma = makeMockPrisma({ ...baseUser, password: HASHED_PASSWORD });
    const app = createApp(mockPrisma);

    // First login to get tokens
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: PLAIN_PASSWORD });

    const accessToken = loginRes.body.tokens.accessToken;
    const refreshToken = loginRes.body.tokens.refreshToken;

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });

  it('returns 401 when no Authorization header provided', async () => {
    const app = createApp(makeMockPrisma({ ...baseUser, password: HASHED_PASSWORD }));

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: 'some.token' });

    expect(res.status).toBe(401);
  });

  it('invalidates refresh token after logout (cannot refresh after logout)', async () => {
    const mockPrisma = makeMockPrisma({ ...baseUser, password: HASHED_PASSWORD });
    const app = createApp(mockPrisma);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: PLAIN_PASSWORD });

    const { accessToken, refreshToken } = loginRes.body.tokens;

    await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(401);
  });
});

// ─── GET /api/v1/auth/me ─────────────────────────────────────────────────────

describe('GET /api/v1/auth/me', () => {
  it('returns 200 with user payload when authenticated', async () => {
    const mockPrisma = makeMockPrisma({ ...baseUser, password: HASHED_PASSWORD });
    const app = createApp(mockPrisma);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: PLAIN_PASSWORD });

    const accessToken = loginRes.body.tokens.accessToken;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.userId).toBe('user-1');
  });

  it('returns 401 without Authorization header', async () => {
    const app = createApp(makeMockPrisma());
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with expired/invalid token', async () => {
    const app = createApp(makeMockPrisma());

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.jwt.token');

    expect(res.status).toBe(401);
  });

  it('returns 401 with token signed by wrong secret', async () => {
    const app = createApp(makeMockPrisma());
    const badToken = jwt.sign({ userId: '1', email: 'a@b.com', role: 'USER' }, 'wrong-secret');

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${badToken}`);

    expect(res.status).toBe(401);
  });
});

// ─── Root health check ────────────────────────────────────────────────────────

describe('GET /', () => {
  it('returns 200 with running message', async () => {
    const app = createApp(makeMockPrisma());
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('running');
  });
});
