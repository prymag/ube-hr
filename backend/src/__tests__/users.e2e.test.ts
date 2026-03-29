/**
 * Users Module — End-to-End Integration Tests
 *
 * Tests the full users management stack (app → router → controller → service)
 * with a mocked PrismaClient. Tokens are signed with the dev secret so
 * authenticate middleware validates them correctly.
 */
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import type { PrismaClient } from '@/generated/prisma/client';

// ─── Constants & helpers ──────────────────────────────────────────────────────

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
let HASHED_PASSWORD: string;

function makeToken(role: 'SYSTEM_ADMIN' | 'ADMIN' | 'USER', userId = 'actor-1'): string {
  return jwt.sign({ userId, email: 'actor@test.com', role }, ACCESS_SECRET, { expiresIn: '15m' });
}

const userFixture = {
  id: 'user-1',
  email: 'alice@example.com',
  password: 'hashed',
  firstName: 'Alice',
  lastName: 'Smith',
  role: 'USER' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const safeUserFixture = { ...userFixture };
delete (safeUserFixture as Partial<typeof safeUserFixture>).password;

const sysAdminFixture = { ...userFixture, id: 'sys-1', role: 'SYSTEM_ADMIN' as const };

function makeMockPrisma(overrides: Partial<{
  findUnique: jest.Mock;
  findMany: jest.Mock;
  count: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  del: jest.Mock;
}> = {}) {
  return {
    user: {
      findUnique: overrides.findUnique ?? jest.fn().mockResolvedValue(null),
      findMany: overrides.findMany ?? jest.fn().mockResolvedValue([userFixture]),
      count: overrides.count ?? jest.fn().mockResolvedValue(1),
      create: overrides.create ?? jest.fn().mockResolvedValue(userFixture),
      update: overrides.update ?? jest.fn().mockResolvedValue(userFixture),
      delete: overrides.del ?? jest.fn().mockResolvedValue(userFixture),
    },
  } as unknown as jest.Mocked<PrismaClient>;
}

beforeAll(async () => {
  HASHED_PASSWORD = await bcrypt.hash('TestPass1', 10);
});

// ─── POST /api/v1/users ───────────────────────────────────────────────────────

describe('POST /api/v1/users', () => {
  const createBody = {
    email: 'new@example.com',
    password: 'SecurePass1',
    firstName: 'New',
    lastName: 'User',
  };

  it('returns 201 when SYSTEM_ADMIN creates a user', async () => {
    const mockPrisma = makeMockPrisma({
      findUnique: jest.fn().mockResolvedValue(null), // email not taken
      create: jest.fn().mockResolvedValue({ ...userFixture, email: 'new@example.com' }),
    });
    const app = createApp(mockPrisma);

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${makeToken('SYSTEM_ADMIN')}`)
      .send(createBody);

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('new@example.com');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('returns 201 when ADMIN creates a USER', async () => {
    const mockPrisma = makeMockPrisma({
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(userFixture),
    });
    const app = createApp(mockPrisma);

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${makeToken('ADMIN')}`)
      .send(createBody);

    expect(res.status).toBe(201);
  });

  it('returns 401 when no Authorization header is provided', async () => {
    const app = createApp(makeMockPrisma());
    const res = await request(app).post('/api/v1/users').send(createBody);
    expect(res.status).toBe(401);
  });

  it('returns 403 when USER tries to create a user', async () => {
    const app = createApp(makeMockPrisma());
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${makeToken('USER')}`)
      .send(createBody);
    expect(res.status).toBe(403);
  });

  it('returns 403 when ADMIN tries to create an ADMIN', async () => {
    const mockPrisma = makeMockPrisma({ findUnique: jest.fn().mockResolvedValue(null) });
    const app = createApp(mockPrisma);

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${makeToken('ADMIN')}`)
      .send({ ...createBody, role: 'ADMIN' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('ADMIN cannot assign');
  });

  it('returns 409 when email already exists', async () => {
    const mockPrisma = makeMockPrisma({
      findUnique: jest.fn().mockResolvedValue(userFixture), // email taken
    });
    const app = createApp(mockPrisma);

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${makeToken('SYSTEM_ADMIN')}`)
      .send(createBody);

    expect(res.status).toBe(409);
  });

  it('returns 400 when password is too weak', async () => {
    const app = createApp(makeMockPrisma());
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${makeToken('SYSTEM_ADMIN')}`)
      .send({ ...createBody, password: 'weak' });
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/v1/users ────────────────────────────────────────────────────────

describe('GET /api/v1/users', () => {
  it('returns 200 with user list for ADMIN', async () => {
    const mockPrisma = makeMockPrisma({
      findMany: jest.fn().mockResolvedValue([userFixture]),
      count: jest.fn().mockResolvedValue(1),
    });
    const app = createApp(mockPrisma);

    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0]).not.toHaveProperty('password');
  });

  it('returns 200 with user list for SYSTEM_ADMIN', async () => {
    const app = createApp(makeMockPrisma());

    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${makeToken('SYSTEM_ADMIN')}`);

    expect(res.status).toBe(200);
  });

  it('returns 401 without Authorization header', async () => {
    const res = await request(createApp(makeMockPrisma())).get('/api/v1/users');
    expect(res.status).toBe(401);
  });

  it('returns 403 when USER tries to list users', async () => {
    const res = await request(createApp(makeMockPrisma()))
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${makeToken('USER')}`);
    expect(res.status).toBe(403);
  });

  it('accepts pagination query params', async () => {
    const mockPrisma = makeMockPrisma({
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    });
    const app = createApp(mockPrisma);

    const res = await request(app)
      .get('/api/v1/users?skip=10&take=5')
      .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

    expect(res.status).toBe(200);
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 5 }),
    );
  });
});

// ─── PATCH /api/v1/users/:userId ─────────────────────────────────────────────

describe('PATCH /api/v1/users/:userId', () => {
  it('returns 200 when SYSTEM_ADMIN updates a user', async () => {
    const mockPrisma = makeMockPrisma({
      findUnique: jest.fn().mockResolvedValue(userFixture),
      update: jest.fn().mockResolvedValue({ ...userFixture, firstName: 'Updated' }),
    });
    const app = createApp(mockPrisma);

    const res = await request(app)
      .patch('/api/v1/users/user-1')
      .set('Authorization', `Bearer ${makeToken('SYSTEM_ADMIN')}`)
      .send({ firstName: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.user.firstName).toBe('Updated');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('returns 401 without Authorization header', async () => {
    const res = await request(createApp(makeMockPrisma()))
      .patch('/api/v1/users/user-1')
      .send({ firstName: 'X' });
    expect(res.status).toBe(401);
  });

  it('returns 403 when USER tries to update', async () => {
    const res = await request(createApp(makeMockPrisma()))
      .patch('/api/v1/users/user-1')
      .set('Authorization', `Bearer ${makeToken('USER')}`)
      .send({ firstName: 'X' });
    expect(res.status).toBe(403);
  });

  it('returns 403 when ADMIN tries to update SYSTEM_ADMIN', async () => {
    const mockPrisma = makeMockPrisma({
      findUnique: jest.fn().mockResolvedValue(sysAdminFixture),
    });
    const app = createApp(mockPrisma);

    const res = await request(app)
      .patch('/api/v1/users/sys-1')
      .set('Authorization', `Bearer ${makeToken('ADMIN')}`)
      .send({ firstName: 'Hacked' });

    expect(res.status).toBe(403);
  });

  it('returns 404 when user does not exist', async () => {
    const mockPrisma = makeMockPrisma({
      findUnique: jest.fn().mockResolvedValue(null),
    });
    const app = createApp(mockPrisma);

    const res = await request(app)
      .patch('/api/v1/users/ghost')
      .set('Authorization', `Bearer ${makeToken('SYSTEM_ADMIN')}`)
      .send({ firstName: 'X' });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/v1/users/:userId ────────────────────────────────────────────

describe('DELETE /api/v1/users/:userId', () => {
  it('returns 204 when SYSTEM_ADMIN deletes a USER', async () => {
    const mockPrisma = makeMockPrisma({
      findUnique: jest.fn().mockResolvedValue(userFixture),
      del: jest.fn().mockResolvedValue(userFixture),
    });
    const app = createApp(mockPrisma);

    const res = await request(app)
      .delete('/api/v1/users/user-1')
      .set('Authorization', `Bearer ${makeToken('SYSTEM_ADMIN')}`);

    expect(res.status).toBe(204);
  });

  it('returns 204 when ADMIN deletes a USER', async () => {
    const mockPrisma = makeMockPrisma({
      findUnique: jest.fn().mockResolvedValue(userFixture),
      del: jest.fn().mockResolvedValue(userFixture),
    });
    const app = createApp(mockPrisma);

    const res = await request(app)
      .delete('/api/v1/users/user-1')
      .set('Authorization', `Bearer ${makeToken('ADMIN')}`);

    expect(res.status).toBe(204);
  });

  it('returns 401 without Authorization header', async () => {
    const res = await request(createApp(makeMockPrisma())).delete('/api/v1/users/user-1');
    expect(res.status).toBe(401);
  });

  it('returns 403 when USER tries to delete', async () => {
    const res = await request(createApp(makeMockPrisma()))
      .delete('/api/v1/users/user-1')
      .set('Authorization', `Bearer ${makeToken('USER')}`);
    expect(res.status).toBe(403);
  });

  it('returns 404 when target user does not exist', async () => {
    const mockPrisma = makeMockPrisma({
      findUnique: jest.fn().mockResolvedValue(null),
    });
    const app = createApp(mockPrisma);

    const res = await request(app)
      .delete('/api/v1/users/ghost')
      .set('Authorization', `Bearer ${makeToken('SYSTEM_ADMIN')}`);

    expect(res.status).toBe(404);
  });
});
