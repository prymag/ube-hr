import { INestApplication } from '@nestjs/common';
import { Role } from '@ube-hr/backend';
import supertest from 'supertest';
import { createTestApp } from '../../../test/helpers/app';
import { truncateAll, seedDefaultPermissions } from '../../../test/helpers/db';
import { seedAndLogin } from '../../../test/helpers/seed';

describe('Permissions (integration)', () => {
  let app: INestApplication;
  let request: ReturnType<typeof supertest>;
  let superAdminToken: string;

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
    ({ token: superAdminToken } = await seedAndLogin(app, request, {
      email: 'superadmin@test.com',
      role: Role.SUPER_ADMIN,
    }));
  });

  // ── GET /api/permissions ───────────────────────────────────────────────────

  describe('GET /api/permissions', () => {
    it('returns all role permissions grouped by role', async () => {
      const res = await request
        .get('/api/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('ADMIN');
      expect(res.body).toHaveProperty('SUPER_ADMIN');
      expect(Array.isArray(res.body['ADMIN'])).toBe(true);
    });

    it('returns 403 for ADMIN role (no admins:manage)', async () => {
      const { token } = await seedAndLogin(app, request, {
        email: 'admin@test.com',
        role: Role.ADMIN,
      });

      await request.get('/api/permissions').set('Authorization', `Bearer ${token}`).expect(403);
    });

    it('returns 401 without a token', async () => {
      await request.get('/api/permissions').expect(401);
    });
  });

  // ── GET /api/permissions/available ────────────────────────────────────────

  describe('GET /api/permissions/available', () => {
    it('returns all known permission strings', async () => {
      const res = await request
        .get('/api/permissions/available')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toContain('users:read');
      expect(res.body).toContain('admins:manage');
    });
  });

  // ── GET /api/permissions/:role ─────────────────────────────────────────────

  describe('GET /api/permissions/:role', () => {
    it('returns the permissions for the given role', async () => {
      const res = await request
        .get('/api/permissions/ADMIN')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toContain('users:read');
      expect(res.body).toContain('users:create');
    });

    it('returns an empty array for USER which has no default permissions', async () => {
      const res = await request
        .get('/api/permissions/USER')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('returns 400 for an invalid role value', async () => {
      await request
        .get('/api/permissions/INVALID_ROLE')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(400);
    });
  });

  // ── POST /api/permissions/:role/:permission ────────────────────────────────

  describe('POST /api/permissions/:role/:permission', () => {
    it('grants a permission and it appears in subsequent getForRole', async () => {
      await request
        .post('/api/permissions/USER/users:read')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(201);

      const res = await request
        .get('/api/permissions/USER')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.body).toContain('users:read');
    });

    it('returns 409 when the permission is already granted', async () => {
      // ADMIN already has users:read by default
      await request
        .post('/api/permissions/ADMIN/users:read')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(409);
    });
  });

  // ── DELETE /api/permissions/:role/:permission ──────────────────────────────

  describe('DELETE /api/permissions/:role/:permission', () => {
    it('revokes a permission and it no longer appears in getForRole', async () => {
      await request
        .delete('/api/permissions/ADMIN/users:read')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(204);

      const res = await request
        .get('/api/permissions/ADMIN')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.body).not.toContain('users:read');
    });

    it('returns 404 when revoking a permission the role does not have', async () => {
      // USER has no permissions by default
      await request
        .delete('/api/permissions/USER/users:read')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);
    });
  });
});
