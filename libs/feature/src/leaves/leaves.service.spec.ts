import { Test } from '@nestjs/testing';
import { PrismaService, Role, LeaveStatus, ApprovalStage, LeaveType } from '@ube-hr/backend';
import { LeavesService } from './leaves.service';
import { HolidaysService } from '../holidays/holidays.service';
import { LeaveBalanceService } from '../leave-balance/leave-balance.service';
import { QueueService } from '../queue/queue.service';

const createPrismaMock = () => ({
  membership: { findMany: jest.fn() },
  user: { findUnique: jest.fn(), findMany: jest.fn() },
  leaveRequest: { create: jest.fn(), count: jest.fn(), findMany: jest.fn() },
  leaveBalance: { findUnique: jest.fn() },
  leaveApprovalStep: { findMany: jest.fn() },
  $transaction: jest.fn(),
});

describe('LeavesService — buildApprovalChain (USER role)', () => {
  let service: LeavesService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const holidaysService = { countWorkingDays: jest.fn() };
  const leaveBalanceService = { addPending: jest.fn() };
  const queue = { dispatch: jest.fn() };

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module = await Test.createTestingModule({
      providers: [
        LeavesService,
        { provide: PrismaService, useValue: prisma },
        { provide: HolidaysService, useValue: holidaysService },
        { provide: LeaveBalanceService, useValue: leaveBalanceService },
        { provide: QueueService, useValue: queue },
      ],
    }).compile();
    service = module.get(LeavesService);
  });

  afterEach(() => jest.clearAllMocks());

  const chain = (userId: number) =>
    (service as any).buildApprovalChain(userId, Role.USER);

  it('routes to non-owner MANAGER member in team', async () => {
    prisma.membership.findMany
      .mockResolvedValueOnce([{ teamId: 1 }])
      .mockResolvedValueOnce([{ userId: 2 }]);

    const result = await chain(99);

    expect(result).toEqual({
      status: LeaveStatus.PENDING_MANAGER,
      approverIds: [2],
      stage: ApprovalStage.MANAGER,
    });
  });

  it('deduplicates MANAGER members across multiple teams', async () => {
    prisma.membership.findMany
      .mockResolvedValueOnce([{ teamId: 1 }, { teamId: 2 }])
      .mockResolvedValueOnce([{ userId: 2 }, { userId: 2 }, { userId: 3 }]);

    const result = await chain(99);

    expect(result).toEqual({
      status: LeaveStatus.PENDING_MANAGER,
      approverIds: [2, 3],
      stage: ApprovalStage.MANAGER,
    });
  });

  it('falls back to department head when team has no MANAGER members', async () => {
    prisma.membership.findMany
      .mockResolvedValueOnce([{ teamId: 1 }])
      .mockResolvedValueOnce([]);
    prisma.user.findUnique.mockResolvedValue({
      department: { head: { id: 5, deletedAt: null } },
    });

    const result = await chain(99);

    expect(result).toEqual({
      status: LeaveStatus.PENDING_MANAGER,
      approverIds: [5],
      stage: ApprovalStage.MANAGER,
    });
  });

  it('routes to department head when user has no team', async () => {
    prisma.membership.findMany.mockResolvedValueOnce([]);
    prisma.user.findUnique.mockResolvedValue({
      department: { head: { id: 5, deletedAt: null } },
    });

    const result = await chain(99);

    expect(result).toEqual({
      status: LeaveStatus.PENDING_MANAGER,
      approverIds: [5],
      stage: ApprovalStage.MANAGER,
    });
  });

  it('skips department head when head is the filer; falls back to admins', async () => {
    const userId = 99;
    prisma.membership.findMany.mockResolvedValueOnce([]);
    prisma.user.findUnique.mockResolvedValue({
      department: { head: { id: userId, deletedAt: null } },
    });
    prisma.user.findMany.mockResolvedValue([{ id: 10 }]);

    const result = await chain(userId);

    expect(result).toEqual({
      status: LeaveStatus.PENDING_ADMIN,
      approverIds: [10],
      stage: ApprovalStage.ADMIN,
    });
  });

  it('skips soft-deleted department head; falls back to admins', async () => {
    prisma.membership.findMany.mockResolvedValueOnce([]);
    prisma.user.findUnique.mockResolvedValue({
      department: { head: { id: 5, deletedAt: new Date() } },
    });
    prisma.user.findMany.mockResolvedValue([{ id: 10 }]);

    const result = await chain(99);

    expect(result).toEqual({
      status: LeaveStatus.PENDING_ADMIN,
      approverIds: [10],
      stage: ApprovalStage.ADMIN,
    });
  });

  it('routes directly to admins when user has no team and no department', async () => {
    prisma.membership.findMany.mockResolvedValueOnce([]);
    prisma.user.findUnique.mockResolvedValue({ department: null });
    prisma.user.findMany.mockResolvedValue([{ id: 10 }, { id: 11 }]);

    const result = await chain(99);

    expect(result).toEqual({
      status: LeaveStatus.PENDING_ADMIN,
      approverIds: [10, 11],
      stage: ApprovalStage.ADMIN,
    });
  });
});

describe('LeavesService — findMyApprovalHistory', () => {
  let service: LeavesService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const holidaysService = { countWorkingDays: jest.fn() };
  const leaveBalanceService = { addPending: jest.fn() };
  const queue = { dispatch: jest.fn() };

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module = await Test.createTestingModule({
      providers: [
        LeavesService,
        { provide: PrismaService, useValue: prisma },
        { provide: HolidaysService, useValue: holidaysService },
        { provide: LeaveBalanceService, useValue: leaveBalanceService },
        { provide: QueueService, useValue: queue },
      ],
    }).compile();
    service = module.get(LeavesService);
  });

  afterEach(() => jest.clearAllMocks());

  const makeLeaveRow = (id: number, stepStatus: LeaveStatus, comment: string | null = null) => ({
    id,
    userId: 10,
    leaveType: LeaveType.ANNUAL,
    status: LeaveStatus.APPROVED,
    startDate: new Date('2025-01-10'),
    endDate: new Date('2025-01-12'),
    isHalfDay: false,
    halfDayPeriod: null,
    durationDays: 3,
    reason: null,
    deletedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    user: { name: 'Alice', email: 'alice@test.com' },
    approvalSteps: [
      {
        id: id * 100,
        leaveRequestId: id,
        approverId: 99,
        stage: ApprovalStage.ADMIN,
        status: stepStatus,
        comment,
        decidedAt: new Date('2025-01-05'),
        createdAt: new Date('2025-01-01'),
        approver: { name: 'Bob', email: 'bob@test.com' },
      },
    ],
  });

  it('returns empty result when caller has no decided steps', async () => {
    prisma.leaveRequest.count.mockResolvedValue(0);
    prisma.leaveRequest.findMany.mockResolvedValue([]);

    const result = await service.findMyApprovalHistory(99);

    expect(result).toEqual({
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      pageCount: 1,
    });
  });

  it('maps myDecision from the step status, not the leave status', async () => {
    const row = makeLeaveRow(1, LeaveStatus.REJECTED, 'Too short notice');
    prisma.leaveRequest.count.mockResolvedValue(1);
    prisma.leaveRequest.findMany.mockResolvedValue([row]);

    const result = await service.findMyApprovalHistory(99);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].myDecision).toBe('REJECTED');
    expect(result.data[0].myComment).toBe('Too short notice');
    expect(result.data[0].userName).toBe('Alice');
    expect(result.data[0].myDecidedAt).toEqual(new Date('2025-01-05'));
  });

  it('returns correct pagination metadata', async () => {
    prisma.leaveRequest.count.mockResolvedValue(25);
    prisma.leaveRequest.findMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => makeLeaveRow(i + 1, LeaveStatus.APPROVED)),
    );

    const result = await service.findMyApprovalHistory(99, { page: '2', pageSize: '10' });

    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.total).toBe(25);
    expect(result.pageCount).toBe(3);
  });

  it('does not include steps that are still PENDING', async () => {
    // The where clause passed to prisma filters by step status APPROVED/REJECTED
    // We verify findMany is called with the correct where clause
    prisma.leaveRequest.count.mockResolvedValue(0);
    prisma.leaveRequest.findMany.mockResolvedValue([]);

    await service.findMyApprovalHistory(42);

    const call = (prisma.leaveRequest.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.approvalSteps.some.status.in).toEqual(
      expect.arrayContaining([LeaveStatus.APPROVED, LeaveStatus.REJECTED]),
    );
    expect(call.where.approvalSteps.some.status.in).not.toContain(LeaveStatus.PENDING);
  });
});
