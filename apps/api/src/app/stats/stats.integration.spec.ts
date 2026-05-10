import { INestApplication } from '@nestjs/common';
import { Role } from '@ube-hr/backend';
import supertest from 'supertest';
import { createTestApp } from '../../../test/helpers/app';
import { truncateAll, seedDefaultPermissions } from '../../../test/helpers/db';
import { seedAndLogin } from '../../../test/helpers/seed';

describe('Stats (integration)', () => {
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

  describe('GET /api/stats', () => {
    it('returns 401 without a token', async () => {
      await request.get('/api/stats').expect(401);
    });

    it('returns 403 for a user without users:read', async () => {
      const { token } = await seedAndLogin(app, request, {
        email: 'user@test.com',
        role: Role.USER,
      });

      await request
        .get('/api/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('returns valid StatsResponse for a user with users:read', async () => {
      const { token } = await seedAndLogin(app, request, {
        email: 'admin@test.com',
        role: Role.ADMIN,
      });

      const res = await request
        .get('/api/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(typeof res.body.totalUsers).toBe('number');
      expect(typeof res.body.totalTeams).toBe('number');
      expect(typeof res.body.totalDepartments).toBe('number');
      expect(typeof res.body.totalPendingLeaves).toBe('number');
    });

    it('counts reflect seeded data', async () => {
      const { token } = await seedAndLogin(app, request, {
        email: 'admin@test.com',
        role: Role.ADMIN,
      });

      const res1 = await request
        .get('/api/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res1.body.totalUsers).toBeGreaterThanOrEqual(1);
      expect(res1.body.totalPendingLeaves).toBe(0);
    });
  });
});
