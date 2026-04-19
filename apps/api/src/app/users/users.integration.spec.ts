import { INestApplication } from '@nestjs/common';
import { Role } from '@ube-hr/backend';
import supertest from 'supertest';
import { createTestApp } from '../../../test/helpers/app';
import { truncateAll, seedDefaultPermissions } from '../../../test/helpers/db';
import { seedAndLogin, seedUser } from '../../../test/helpers/seed';

describe('Users (integration)', () => {
  let app: INestApplication;
  let request: ReturnType<typeof supertest>;
  let adminToken: string;

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
    ({ token: adminToken } = await seedAndLogin(app, request, {
      email: 'admin@test.com',
      role: Role.ADMIN,
    }));
  });

  // ── POST /api/users ────────────────────────────────────────────────────────

  describe('POST /api/users', () => {
    it('creates a user and returns the wire type', async () => {
      const res = await request
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'new@test.com', password: 'pass123', name: 'New User' })
        .expect(201);

      expect(res.body).toMatchObject({
        email: 'new@test.com',
        name: 'New User',
        role: 'USER',
        status: 'ACTIVE',
      });
      expect(typeof res.body.createdAt).toBe('string');
    });

    it('returns 409 when email is already taken', async () => {
      await seedUser(app, { email: 'taken@test.com' });

      await request
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'taken@test.com', password: 'pass123' })
        .expect(409);
    });

    it('returns 403 for a role without users:create', async () => {
      const { token } = await seedAndLogin(app, request, {
        email: 'manager@test.com',
        role: Role.MANAGER,
      });

      await request
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'x@test.com', password: 'pass123' })
        .expect(403);
    });

    it('returns 401 without a token', async () => {
      await request.post('/api/users').send({ email: 'x@test.com', password: 'pw' }).expect(401);
    });
  });

  // ── GET /api/users ─────────────────────────────────────────────────────────

  describe('GET /api/users', () => {
    it('returns a paginated list of users', async () => {
      await seedUser(app, { email: 'alice@test.com' });
      await seedUser(app, { email: 'bob@test.com' });

      const res = await request
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('pageCount');
    });

    it('filters by search term', async () => {
      await seedUser(app, { email: 'unique-xyz@test.com', name: 'XYZ Person' });

      const res = await request
        .get('/api/users?search=unique-xyz')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].email).toBe('unique-xyz@test.com');
    });

    it('returns 403 for a USER role', async () => {
      const { token } = await seedAndLogin(app, request, {
        email: 'plainuser@test.com',
        role: Role.USER,
      });

      await request.get('/api/users').set('Authorization', `Bearer ${token}`).expect(403);
    });
  });

  // ── GET /api/users/:id ─────────────────────────────────────────────────────

  describe('GET /api/users/:id', () => {
    it('returns the user when found', async () => {
      const user = await seedUser(app, { email: 'findme@test.com', name: 'Find Me' });

      const res = await request
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ email: 'findme@test.com', name: 'Find Me' });
    });

    it('returns an empty body for a non-existent user', async () => {
      const res = await request
        .get('/api/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // NestJS serialises a null return as an empty response body
      expect(res.body).not.toHaveProperty('id');
    });
  });

  // ── GET /api/users/:id/teams ───────────────────────────────────────────────

  describe('GET /api/users/:id/teams', () => {
    it('returns an empty list when the user has no team memberships', async () => {
      const user = await seedUser(app, { email: 'noteams@test.com' });

      const res = await request
        .get(`/api/users/${user.id}/teams`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  // ── DELETE /api/users/:id ──────────────────────────────────────────────────

  describe('DELETE /api/users/:id', () => {
    it('soft-deletes the user and returns 204', async () => {
      const user = await seedUser(app, { email: 'delete-me@test.com' });

      await request
        .delete(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // User should no longer appear in the list
      const listRes = await request
        .get('/api/users?search=delete-me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.body.data).toHaveLength(0);
    });

    it('returns 403 when trying to delete a user of equal or higher rank', async () => {
      const peer = await seedUser(app, { email: 'peer@test.com', role: Role.ADMIN });

      await request
        .delete(`/api/users/${peer.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('returns 404 for a non-existent user', async () => {
      await request
        .delete('/api/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
