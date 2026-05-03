import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { Role } from '@ube-hr/backend';
import { createTestApp } from '../../../test/helpers/app';
import { truncateAll, seedDefaultPermissions } from '../../../test/helpers/db';
import { seedAndLogin } from '../../../test/helpers/seed';

describe('LeaveBalance config (integration)', () => {
  let app: INestApplication;
  let request: ReturnType<typeof supertest>;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    request = supertest(app.getHttpServer());
  });

  afterAll(() => app.close());

  beforeEach(async () => {
    await truncateAll(app);
    await seedDefaultPermissions(app);
    const { token } = await seedAndLogin(app, request, {
      email: 'admin@test.com',
      role: Role.ADMIN,
    });
    adminToken = token;
  });

  describe('PUT /api/leave-balance/config/:type', () => {
    it('returns 401 when unauthenticated', async () => {
      await request
        .put('/api/leave-balance/config/ANNUAL')
        .send({ monthlyRate: 1 })
        .expect(401);
    });

    it.each(['MATERNITY', 'PATERNITY', 'BEREAVEMENT'])(
      'returns 400 for manual leave type %s',
      async (type) => {
        await request
          .put(`/api/leave-balance/config/${type}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ monthlyRate: 1 })
          .expect(400);
      },
    );

    it('returns 200 for ANNUAL', async () => {
      const res = await request
        .put('/api/leave-balance/config/ANNUAL')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ monthlyRate: 2 })
        .expect(200);

      expect(res.body).toMatchObject({ leaveType: 'ANNUAL', monthlyRate: 2 });
    });

    it('returns 200 for SICK', async () => {
      const res = await request
        .put('/api/leave-balance/config/SICK')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ monthlyRate: 1 })
        .expect(200);

      expect(res.body).toMatchObject({ leaveType: 'SICK', monthlyRate: 1 });
    });
  });
});
