import { INestApplication } from '@nestjs/common';
import { Role } from '@ube-hr/backend';
import supertest from 'supertest';
import { createTestApp } from '../../../test/helpers/app';
import { truncateAll, seedDefaultPermissions } from '../../../test/helpers/db';
import { seedUser } from '../../../test/helpers/seed';

describe('Auth (integration)', () => {
  let app: INestApplication;
  let request: ReturnType<typeof supertest>;

  beforeAll(async () => {
    app = await createTestApp();
    request = supertest(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAll(app);
    await seedDefaultPermissions(app);
  });

  // ── POST /api/auth/login ───────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('returns an access token and sets a refresh cookie on valid credentials', async () => {
      await seedUser(app, { email: 'alice@test.com', password: 'secret123' });

      const res = await request
        .post('/api/auth/login')
        .send({ email: 'alice@test.com', password: 'secret123' })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
      expect(typeof res.body.access_token).toBe('string');

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
    });

    it('returns 401 on wrong password', async () => {
      await seedUser(app, { email: 'bob@test.com', password: 'correct' });

      await request
        .post('/api/auth/login')
        .send({ email: 'bob@test.com', password: 'wrong' })
        .expect(401);
    });

    it('returns 401 for a blocked user', async () => {
      await seedUser(app, {
        email: 'blocked@test.com',
        password: 'password123',
        status: 'BLOCKED',
      });

      await request
        .post('/api/auth/login')
        .send({ email: 'blocked@test.com', password: 'password123' })
        .expect(401);
    });

    it('returns 401 for a non-existent user', async () => {
      await request
        .post('/api/auth/login')
        .send({ email: 'ghost@test.com', password: 'password123' })
        .expect(401);
    });
  });

  // ── POST /api/auth/refresh ─────────────────────────────────────────────────

  describe('POST /api/auth/refresh', () => {
    it('issues a new access token and rotates the refresh cookie', async () => {
      await seedUser(app, { email: 'refresh@test.com', password: 'password123' });

      const loginRes = await request
        .post('/api/auth/login')
        .send({ email: 'refresh@test.com', password: 'password123' });

      const refreshCookie = (loginRes.headers['set-cookie'] as unknown as string[]).find(
        (c) => c.startsWith('refresh_token='),
      )!;

      const res = await request
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie)
        .expect(200);

      expect(res.body).toHaveProperty('access_token');

      const newCookies = res.headers['set-cookie'] as unknown as string[];
      expect(newCookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
      expect(newCookies[0]).not.toBe(refreshCookie);
    });

    it('returns 401 when no refresh cookie is present', async () => {
      await request.post('/api/auth/refresh').expect(401);
    });

    it('returns 401 and invalidates all sessions on token reuse', async () => {
      await seedUser(app, { email: 'reuse@test.com', password: 'password123' });

      const loginRes = await request
        .post('/api/auth/login')
        .send({ email: 'reuse@test.com', password: 'password123' });

      const refreshCookie = (loginRes.headers['set-cookie'] as unknown as string[]).find(
        (c) => c.startsWith('refresh_token='),
      )!;

      await request.post('/api/auth/refresh').set('Cookie', refreshCookie).expect(200);
      await request.post('/api/auth/refresh').set('Cookie', refreshCookie).expect(401);
    });
  });

  // ── POST /api/auth/logout ──────────────────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    it('invalidates the session so the refresh token no longer works', async () => {
      await seedUser(app, { email: 'logout@test.com', password: 'password123' });

      const loginRes = await request
        .post('/api/auth/login')
        .send({ email: 'logout@test.com', password: 'password123' });

      const accessToken = loginRes.body.access_token;
      const refreshCookie = (loginRes.headers['set-cookie'] as unknown as string[]).find(
        (c) => c.startsWith('refresh_token='),
      )!;

      await request
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      await request.post('/api/auth/refresh').set('Cookie', refreshCookie).expect(401);
    });
  });

  // ── GET /api/auth/me ───────────────────────────────────────────────────────

  describe('GET /api/auth/me', () => {
    it('returns the authenticated user profile with their permissions', async () => {
      await seedUser(app, {
        email: 'me@test.com',
        password: 'password123',
        role: Role.MANAGER,
      });

      const loginRes = await request
        .post('/api/auth/login')
        .send({ email: 'me@test.com', password: 'password123' });

      const res = await request
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.access_token}`)
        .expect(200);

      expect(res.body).toMatchObject({
        email: 'me@test.com',
        role: 'MANAGER',
      });
      expect(Array.isArray(res.body.permissions)).toBe(true);
    });

    it('returns 401 without a token', async () => {
      await request.get('/api/auth/me').expect(401);
    });
  });
});
