import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { PrismaService } from '@ube-hr/backend';
import { JOB_QUEUES, LEAVE_JOBS } from '@ube-hr/shared';
import { LeaveAccrualService } from './leave-accrual.service';

const createPrismaMock = () => ({
  user: { findMany: jest.fn() },
  leaveAccrualConfig: { findMany: jest.fn() },
});

const createQueueMock = () => ({
  add: jest.fn(),
});

describe('LeaveAccrualService', () => {
  let service: LeaveAccrualService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let queue: ReturnType<typeof createQueueMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    queue = createQueueMock();

    const module = await Test.createTestingModule({
      providers: [
        LeaveAccrualService,
        { provide: PrismaService, useValue: prisma },
        { provide: getQueueToken(JOB_QUEUES.LEAVE), useValue: queue },
      ],
    }).compile();

    service = module.get(LeaveAccrualService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('triggerAccrualRun', () => {
    it('dispatches activeUsers × optedInLeaveTypes jobs', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
      prisma.leaveAccrualConfig.findMany.mockResolvedValue([
        { leaveType: 'ANNUAL' },
        { leaveType: 'SICK' },
      ]);

      const result = await service.triggerAccrualRun(2026, 4);

      expect(result.jobsEnqueued).toBe(6);
      expect(queue.add).toHaveBeenCalledTimes(6);
    });

    it('returns correct runId shared by all jobs', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.leaveAccrualConfig.findMany.mockResolvedValue([
        { leaveType: 'ANNUAL' },
      ]);

      const result = await service.triggerAccrualRun(2026, 4);

      const calls = queue.add.mock.calls;
      const runIds = calls.map(
        (c: unknown[]) => (c[1] as { runId: string }).runId,
      );
      expect(runIds.every((id: string) => id === result.runId)).toBe(true);
    });

    it('generates correct jobId format', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 42 }]);
      prisma.leaveAccrualConfig.findMany.mockResolvedValue([
        { leaveType: 'ANNUAL' },
      ]);

      await service.triggerAccrualRun(2026, 4);

      expect(queue.add).toHaveBeenCalledWith(
        LEAVE_JOBS.ACCRUE_BALANCE,
        expect.objectContaining({
          userId: 42,
          leaveType: 'ANNUAL',
          year: 2026,
          month: 4,
        }),
        { jobId: 'accrual:42:ANNUAL:2026:4' },
      );
    });

    it('defaults to previous calendar month when no args given', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.leaveAccrualConfig.findMany.mockResolvedValue([
        { leaveType: 'ANNUAL' },
      ]);

      jest.useFakeTimers();
      // May 15, 2026 → previous month = April 2026
      jest.setSystemTime(new Date(2026, 4, 15).getTime());

      await service.triggerAccrualRun();

      const payload = queue.add.mock.calls[0][1] as {
        year: number;
        month: number;
      };
      expect(payload.year).toBe(2026);
      expect(payload.month).toBe(4);

      jest.useRealTimers();
    });

    it('handles year rollback when current month is January (Jan → Dec of prior year)', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.leaveAccrualConfig.findMany.mockResolvedValue([
        { leaveType: 'ANNUAL' },
      ]);

      jest.useFakeTimers();
      // January 10, 2026 → previous month = December 2025
      jest.setSystemTime(new Date(2026, 0, 10).getTime());

      await service.triggerAccrualRun();

      const payload = queue.add.mock.calls[0][1] as {
        year: number;
        month: number;
      };
      expect(payload.year).toBe(2025);
      expect(payload.month).toBe(12);

      jest.useRealTimers();
    });

    it('excludes soft-deleted users', async () => {
      // Prisma query already filters deletedAt: null — verify the where clause
      prisma.user.findMany.mockResolvedValue([]);
      prisma.leaveAccrualConfig.findMany.mockResolvedValue([
        { leaveType: 'ANNUAL' },
      ]);

      const result = await service.triggerAccrualRun(2026, 4);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      );
      expect(result.jobsEnqueued).toBe(0);
    });

    it('excludes leave types without a LeaveAccrualConfig row', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.leaveAccrualConfig.findMany.mockResolvedValue([]); // no configs

      const result = await service.triggerAccrualRun(2026, 4);

      expect(result.jobsEnqueued).toBe(0);
      expect(queue.add).not.toHaveBeenCalled();
    });

    it('enqueues zero jobs when there are no active users', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.leaveAccrualConfig.findMany.mockResolvedValue([
        { leaveType: 'ANNUAL' },
      ]);

      const result = await service.triggerAccrualRun(2026, 4);

      expect(result.jobsEnqueued).toBe(0);
    });
  });
});
