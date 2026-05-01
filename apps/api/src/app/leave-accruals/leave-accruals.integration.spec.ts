import { jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import supertest from 'supertest';
import { Role } from '@ube-hr/backend';
import { LeaveAccrualService, type AccrualRunResult } from '@ube-hr/feature';
import { AppModule } from '../../app.module';
import { truncateAll, seedDefaultPermissions } from '../../../test/helpers/db';
import { seedAndLogin } from '../../../test/helpers/seed';

describe('LeaveAccruals (integration)', () => {
  let app: INestApplication;
  let request: ReturnType<typeof supertest>;

  const mockTrigger = jest.fn<() => Promise<AccrualRunResult>>();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(LeaveAccrualService)
      .useValue({ triggerAccrualRun: mockTrigger })
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    await app.init();

    request = supertest(app.getHttpServer());
  });

  afterAll(() => app.close());

  beforeEach(async () => {
    await truncateAll(app);
    await seedDefaultPermissions(app);
    mockTrigger.mockReset();
    mockTrigger.mockResolvedValue({ runId: 'test-run-id', jobsEnqueued: 3 });
  });

  describe('POST /api/leave-accruals/run', () => {
    it('returns 401 when unauthenticated', async () => {
      await request.post('/api/leave-accruals/run').expect(401);
    });

    it('returns 403 for USER role', async () => {
      const { token } = await seedAndLogin(app, request, {
        email: 'user@test.com',
        role: Role.USER,
      });
      await request
        .post('/api/leave-accruals/run')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('returns 403 for MANAGER role', async () => {
      const { token } = await seedAndLogin(app, request, {
        email: 'manager@test.com',
        role: Role.MANAGER,
      });
      await request
        .post('/api/leave-accruals/run')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('ADMIN: returns 201 with runId and jobsEnqueued when no body is given', async () => {
      const { token } = await seedAndLogin(app, request, {
        email: 'admin@test.com',
        role: Role.ADMIN,
      });

      const res = await request
        .post('/api/leave-accruals/run')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(res.body).toEqual({ runId: 'test-run-id', jobsEnqueued: 3 });
      expect(mockTrigger).toHaveBeenCalledWith(undefined, undefined);
    });

    it('ADMIN: passes explicit year and month to the service', async () => {
      const { token } = await seedAndLogin(app, request, {
        email: 'admin@test.com',
        role: Role.ADMIN,
      });

      const res = await request
        .post('/api/leave-accruals/run')
        .set('Authorization', `Bearer ${token}`)
        .send({ year: 2025, month: 3 })
        .expect(201);

      expect(res.body).toEqual({ runId: 'test-run-id', jobsEnqueued: 3 });
      expect(mockTrigger).toHaveBeenCalledWith(2025, 3);
    });

    it('SUPER_ADMIN: returns 201', async () => {
      const { token } = await seedAndLogin(app, request, {
        email: 'superadmin@test.com',
        role: Role.SUPER_ADMIN,
      });

      const res = await request
        .post('/api/leave-accruals/run')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(res.body).toMatchObject({ runId: expect.any(String), jobsEnqueued: expect.any(Number) });
    });
  });
});
