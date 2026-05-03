import { Test } from '@nestjs/testing';
import { PrismaService, Role, LeaveStatus, ApprovalStage } from '@ube-hr/backend';
import { LeavesService } from './leaves.service';
import { HolidaysService } from '../holidays/holidays.service';
import { LeaveBalanceService } from '../leave-balance/leave-balance.service';
import { QueueService } from '../queue/queue.service';

const createPrismaMock = () => ({
  membership: { findMany: jest.fn() },
  user: { findUnique: jest.fn(), findMany: jest.fn() },
  leaveRequest: { create: jest.fn() },
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
