import { INestApplication } from '@nestjs/common';
import { Role } from '@ube-hr/backend';
import supertest from 'supertest';
import { createTestApp } from '../../../test/helpers/app';
import { truncateAll, seedDefaultPermissions } from '../../../test/helpers/db';
import { seedAndLogin } from '../../../test/helpers/seed';

describe('Holidays (integration)', () => {
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
    const result = await seedAndLogin(app, request, {
      email: 'admin@test.com',
      role: Role.ADMIN,
    });
    adminToken = result.token;
  });

  // ── POST /api/holidays ─────────────────────────────────────────────────────

  describe('POST /api/holidays', () => {
    it('creates a holiday and returns the wire type', async () => {
      const res = await request
        .post('/api/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: "New Year's Day",
          date: '2025-01-01',
          description: 'Public holiday',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        name: "New Year's Day",
        description: 'Public holiday',
      });
      expect(typeof res.body.id).toBe('number');
      expect(typeof res.body.date).toBe('string');
      expect(typeof res.body.createdAt).toBe('string');
    });

    it('returns 409 for a duplicate date', async () => {
      await request
        .post('/api/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: "New Year's Day", date: '2025-01-01' })
        .expect(201);

      await request
        .post('/api/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Another Holiday', date: '2025-01-01' })
        .expect(409);
    });

    it('returns 401 without a token', async () => {
      await request
        .post('/api/holidays')
        .send({ name: "New Year's Day", date: '2025-01-01' })
        .expect(401);
    });

    it('returns 403 for a role without holidays:manage', async () => {
      const { token } = await seedAndLogin(app, request, {
        email: 'user@test.com',
        role: Role.USER,
      });

      await request
        .post('/api/holidays')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: "New Year's Day", date: '2025-01-01' })
        .expect(403);
    });
  });

  // ── GET /api/holidays ──────────────────────────────────────────────────────

  describe('GET /api/holidays', () => {
    it('returns a paginated list of holidays', async () => {
      await request
        .post('/api/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: "New Year's Day", date: '2025-01-01' });
      await request
        .post('/api/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Labour Day', date: '2025-05-01' });

      const res = await request
        .get('/api/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(typeof res.body.total).toBe('number');
      expect(typeof res.body.pageCount).toBe('number');
    });

    it('filters by year', async () => {
      await request
        .post('/api/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: "New Year's Day", date: '2025-01-01' });
      await request
        .post('/api/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Some 2026 Holiday', date: '2026-03-15' });

      const res = await request
        .get('/api/holidays?year=2025')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("New Year's Day");
    });
  });

  // ── GET /api/holidays/:id ──────────────────────────────────────────────────

  describe('GET /api/holidays/:id', () => {
    it('returns the holiday when found', async () => {
      const created = await request
        .post('/api/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Christmas Day', date: '2025-12-25' });

      const res = await request
        .get(`/api/holidays/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.name).toBe('Christmas Day');
    });

    it('returns 404 for a missing holiday', async () => {
      await request
        .get('/api/holidays/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ── PATCH /api/holidays/:id ────────────────────────────────────────────────

  describe('PATCH /api/holidays/:id', () => {
    it('updates the holiday name and description', async () => {
      const created = await request
        .post('/api/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Old Name', date: '2025-06-01' });

      const res = await request
        .patch(`/api/holidays/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Name', description: 'Updated desc' })
        .expect(200);

      expect(res.body.name).toBe('New Name');
      expect(res.body.description).toBe('Updated desc');
    });
  });

  // ── DELETE /api/holidays/:id ───────────────────────────────────────────────

  describe('DELETE /api/holidays/:id', () => {
    it('returns 204 and subsequent GET returns 404', async () => {
      const created = await request
        .post('/api/holidays')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'To Delete', date: '2025-07-04' });

      await request
        .delete(`/api/holidays/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request
        .get(`/api/holidays/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
