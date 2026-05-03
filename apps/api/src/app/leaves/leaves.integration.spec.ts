import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { Role, PrismaService } from '@ube-hr/backend';
import { createTestApp } from '../../../test/helpers/app';
import { truncateAll, seedDefaultPermissions } from '../../../test/helpers/db';
import { seedAndLogin, seedUser } from '../../../test/helpers/seed';

describe('GET /api/leaves/approvals/history (integration)', () => {
  let app: INestApplication;
  let request: ReturnType<typeof supertest>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    request = supertest(app.getHttpServer());
    prisma = app.get(PrismaService);
  });

  afterAll(() => app.close());

  beforeEach(async () => {
    await truncateAll(app);
    await seedDefaultPermissions(app);
  });

  it('returns 401 when unauthenticated', async () => {
    await request.get('/api/leaves/approvals/history').expect(401);
  });

  it('returns 403 when caller lacks leaves:approve permission', async () => {
    const { token } = await seedAndLogin(app, request, {
      email: 'user@test.com',
      role: Role.USER,
    });

    await request
      .get('/api/leaves/approvals/history')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('returns empty list when caller has not decided on any leaves', async () => {
    const { token } = await seedAndLogin(app, request, {
      email: 'manager@test.com',
      role: Role.MANAGER,
    });

    const res = await request
      .get('/api/leaves/approvals/history')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      data: [],
      total: 0,
      page: 1,
      pageCount: 1,
    });
  });

  it('returns leaves the caller approved, with correct myDecision', async () => {
    const { user: manager, token } = await seedAndLogin(app, request, {
      email: 'manager@test.com',
      role: Role.MANAGER,
    });
    const filer = await seedUser(app, { email: 'filer@test.com', role: Role.USER });

    // Seed a leave request that the manager already approved
    const leave = await prisma.leaveRequest.create({
      data: {
        userId: filer.id,
        leaveType: 'ANNUAL',
        status: 'APPROVED',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-03'),
        isHalfDay: false,
        durationDays: 3,
        approvalSteps: {
          create: {
            approverId: manager.id,
            stage: 'MANAGER',
            status: 'APPROVED',
            decidedAt: new Date('2025-02-28'),
          },
        },
      },
    });

    const res = await request
      .get('/api/leaves/approvals/history')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.data[0]).toMatchObject({
      id: leave.id,
      myDecision: 'APPROVED',
      myComment: null,
    });
  });

  it('returns leaves the caller rejected, with myDecision REJECTED and comment', async () => {
    const { user: manager, token } = await seedAndLogin(app, request, {
      email: 'manager@test.com',
      role: Role.MANAGER,
    });
    const filer = await seedUser(app, { email: 'filer@test.com', role: Role.USER });

    await prisma.leaveRequest.create({
      data: {
        userId: filer.id,
        leaveType: 'SICK',
        status: 'REJECTED',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-01'),
        isHalfDay: false,
        durationDays: 1,
        approvalSteps: {
          create: {
            approverId: manager.id,
            stage: 'MANAGER',
            status: 'REJECTED',
            comment: 'Not enough notice',
            decidedAt: new Date('2025-03-31'),
          },
        },
      },
    });

    const res = await request
      .get('/api/leaves/approvals/history')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.data[0]).toMatchObject({
      myDecision: 'REJECTED',
      myComment: 'Not enough notice',
    });
  });

  it('does not include leaves where the caller step is still PENDING', async () => {
    const { user: manager, token } = await seedAndLogin(app, request, {
      email: 'manager@test.com',
      role: Role.MANAGER,
    });
    const filer = await seedUser(app, { email: 'filer@test.com', role: Role.USER });

    await prisma.leaveRequest.create({
      data: {
        userId: filer.id,
        leaveType: 'ANNUAL',
        status: 'PENDING_MANAGER',
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-05-02'),
        isHalfDay: false,
        durationDays: 2,
        approvalSteps: {
          create: {
            approverId: manager.id,
            stage: 'MANAGER',
            status: 'PENDING',
          },
        },
      },
    });

    const res = await request
      .get('/api/leaves/approvals/history')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.total).toBe(0);
    expect(res.body.data).toHaveLength(0);
  });

  it('respects pagination params', async () => {
    const { user: manager, token } = await seedAndLogin(app, request, {
      email: 'manager@test.com',
      role: Role.MANAGER,
    });
    const filer = await seedUser(app, { email: 'filer@test.com', role: Role.USER });

    // Seed 3 decided leave requests
    for (let i = 1; i <= 3; i++) {
      await prisma.leaveRequest.create({
        data: {
          userId: filer.id,
          leaveType: 'ANNUAL',
          status: 'APPROVED',
          startDate: new Date(`2025-0${i}-01`),
          endDate: new Date(`2025-0${i}-01`),
          isHalfDay: false,
          durationDays: 1,
          approvalSteps: {
            create: {
              approverId: manager.id,
              stage: 'MANAGER',
              status: 'APPROVED',
              decidedAt: new Date(`2025-0${i}-01`),
            },
          },
        },
      });
    }

    const res = await request
      .get('/api/leaves/approvals/history?page=1&pageSize=2')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.total).toBe(3);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pageCount).toBe(2);
    expect(res.body.page).toBe(1);
  });
});
