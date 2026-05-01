import { INestApplication } from '@nestjs/common';
import { Role } from '@ube-hr/backend';
import supertest from 'supertest';
import { createTestApp } from '../../../test/helpers/app';
import { truncateAll, seedDefaultPermissions } from '../../../test/helpers/db';
import { seedAndLogin, seedUser } from '../../../test/helpers/seed';

describe('Teams (integration)', () => {
  let app: INestApplication;
  let request: ReturnType<typeof supertest>;
  let adminToken: string;
  let adminId: number;

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
    adminId = result.user.id;
  });

  // ── POST /api/teams ────────────────────────────────────────────────────────

  describe('POST /api/teams', () => {
    it('creates a team and returns the wire type', async () => {
      const res = await request
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Engineering', description: 'Eng team' })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Engineering',
        description: 'Eng team',
        ownerId: adminId,
      });
      expect(typeof res.body.createdAt).toBe('string');
      expect(typeof res.body.updatedAt).toBe('string');
    });

    it('returns 403 for a role without teams:create', async () => {
      const { token } = await seedAndLogin(app, request, {
        email: 'user@test.com',
        role: Role.USER,
      });

      await request
        .post('/api/teams')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Blocked Team' })
        .expect(403);
    });

    it('returns 401 without a token', async () => {
      await request.post('/api/teams').send({ name: 'No Auth' }).expect(401);
    });
  });

  // ── GET /api/teams ─────────────────────────────────────────────────────────

  describe('GET /api/teams', () => {
    it('returns a paginated list of teams', async () => {
      await request.post('/api/teams').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Alpha' });
      await request.post('/api/teams').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Beta' });

      const res = await request
        .get('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body).toHaveProperty('total');
    });

    it('filters by search term', async () => {
      await request.post('/api/teams').set('Authorization', `Bearer ${adminToken}`).send({ name: 'UniqueTeamXYZ' });

      const res = await request
        .get('/api/teams?search=UniqueTeamXYZ')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('UniqueTeamXYZ');
    });
  });

  // ── GET /api/teams/:id ─────────────────────────────────────────────────────

  describe('GET /api/teams/:id', () => {
    it('returns the team when found', async () => {
      const created = await request
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'DevTeam' });

      const res = await request
        .get(`/api/teams/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ name: 'DevTeam', ownerId: adminId });
    });

    it('returns 404 for a non-existent team', async () => {
      await request
        .get('/api/teams/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ── PATCH /api/teams/:id ───────────────────────────────────────────────────

  describe('PATCH /api/teams/:id', () => {
    it('updates the team name and description', async () => {
      const created = await request
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'OldName' });

      const res = await request
        .patch(`/api/teams/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'NewName', description: 'Updated' })
        .expect(200);

      expect(res.body).toMatchObject({ name: 'NewName', description: 'Updated' });
    });
  });

  // ── DELETE /api/teams/:id ──────────────────────────────────────────────────

  describe('DELETE /api/teams/:id', () => {
    it('deletes the team and returns 204', async () => {
      const created = await request
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'ToDelete' });

      await request
        .delete(`/api/teams/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request
        .get(`/api/teams/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ── GET /api/teams/:id/users ───────────────────────────────────────────────

  describe('GET /api/teams/:teamId/users', () => {
    it('returns only the owner for a new team', async () => {
      const created = await request
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'EmptyTeam' });

      const res = await request
        .get(`/api/teams/${created.body.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(adminId);
    });
  });

  // ── POST /api/teams/:id/users ──────────────────────────────────────────────

  describe('POST /api/teams/:teamId/users', () => {
    it('adds a member and the member appears in the list', async () => {
      const member = await seedUser(app, { email: 'member@test.com' });
      const team = await request
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'WithMembers' });

      await request
        .post(`/api/teams/${team.body.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: member.id })
        .expect(201);

      const members = await request
        .get(`/api/teams/${team.body.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(members.body).toHaveLength(2);
      expect(members.body.map((m: { email: string }) => m.email)).toContain('member@test.com');
    });
  });

  // ── DELETE /api/teams/:id/users/:userId ────────────────────────────────────

  describe('DELETE /api/teams/:teamId/users/:userId', () => {
    it('removes the member and they no longer appear in the list', async () => {
      const member = await seedUser(app, { email: 'todelete@test.com' });
      const team = await request
        .post('/api/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'RemoveTest' });

      await request
        .post(`/api/teams/${team.body.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: member.id });

      await request
        .delete(`/api/teams/${team.body.id}/users/${member.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const members = await request
        .get(`/api/teams/${team.body.id}/users`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(members.body).toHaveLength(1);
      expect(members.body[0].id).toBe(adminId);
    });
  });
});
