import { Test } from '@nestjs/testing';
import { PrismaService } from '@ube-hr/backend';
import { LeaveAccrualProcessor } from './leave.processor';
import type { AccrueBalancePayload } from '@ube-hr/shared';
import type { Job } from 'bullmq';

type PrismaTx = {
  leaveBalance: { upsert: jest.Mock };
  leaveBalanceAudit: { create: jest.Mock };
};

type MockPrisma = {
  leaveAccrualConfig: { findUnique: jest.Mock };
  leaveBalance: { findUnique: jest.Mock; upsert: jest.Mock };
  leaveBalanceAudit: { create: jest.Mock };
  $transaction: jest.Mock;
};

const makeJob = (data: AccrueBalancePayload): Job =>
  ({ name: 'accrue-balance', data } as unknown as Job);

describe('LeaveAccrualProcessor', () => {
  let processor: LeaveAccrualProcessor;
  let prisma: MockPrisma;

  const payload: AccrueBalancePayload = {
    runId: 'run-001',
    userId: 1,
    leaveType: 'ANNUAL',
    year: 2026,
    month: 4,
  };

  beforeEach(async () => {
    prisma = {
      leaveAccrualConfig: { findUnique: jest.fn() },
      leaveBalance: { findUnique: jest.fn(), upsert: jest.fn() },
      leaveBalanceAudit: { create: jest.fn() },
      $transaction: jest.fn().mockImplementation(async (cb: (tx: PrismaTx) => Promise<void>) =>
        cb(prisma as unknown as PrismaTx),
      ),
    };

    const module = await Test.createTestingModule({
      providers: [
        LeaveAccrualProcessor,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    processor = module.get(LeaveAccrualProcessor);
  });

  afterEach(() => jest.clearAllMocks());

  it('silently skips when no LeaveAccrualConfig exists', async () => {
    prisma.leaveAccrualConfig.findUnique.mockResolvedValue(null);

    await processor.process(makeJob(payload));

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('silently skips when already accrued for the same month', async () => {
    prisma.leaveAccrualConfig.findUnique.mockResolvedValue({ monthlyRate: 1.25 });
    prisma.leaveBalance.findUnique.mockResolvedValue({
      lastAccruedYear: 2026,
      lastAccruedMonth: 4,
    });

    await processor.process(makeJob(payload));

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('silently skips when lastAccruedYear is ahead of payload year', async () => {
    prisma.leaveAccrualConfig.findUnique.mockResolvedValue({ monthlyRate: 1.25 });
    prisma.leaveBalance.findUnique.mockResolvedValue({
      lastAccruedYear: 2027,
      lastAccruedMonth: 1,
    });

    await processor.process(makeJob(payload));

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('silently skips when lastAccruedMonth is ahead within the same year', async () => {
    prisma.leaveAccrualConfig.findUnique.mockResolvedValue({ monthlyRate: 1.25 });
    prisma.leaveBalance.findUnique.mockResolvedValue({
      lastAccruedYear: 2026,
      lastAccruedMonth: 5,
    });

    await processor.process(makeJob(payload));

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('credits balance and writes audit row on first run', async () => {
    const monthlyRate = 1.25;
    prisma.leaveAccrualConfig.findUnique.mockResolvedValue({ monthlyRate });
    prisma.leaveBalance.findUnique.mockResolvedValue(null);
    prisma.leaveBalance.upsert.mockResolvedValue({});
    prisma.leaveBalanceAudit.create.mockResolvedValue({});

    await processor.process(makeJob(payload));

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.leaveBalance.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_leaveType_year: { userId: 1, leaveType: 'ANNUAL', year: 2026 },
        },
        create: expect.objectContaining({
          allocated: monthlyRate,
          lastAccruedMonth: 4,
          lastAccruedYear: 2026,
        }),
        update: expect.objectContaining({
          lastAccruedMonth: 4,
          lastAccruedYear: 2026,
        }),
      }),
    );
    expect(prisma.leaveBalanceAudit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 1,
        leaveType: 'ANNUAL',
        eventType: 'ACCRUAL',
        amount: monthlyRate,
        runId: 'run-001',
      }),
    });
  });

  it('runs balance update and audit inside a single transaction', async () => {
    const calls: string[] = [];
    prisma.leaveAccrualConfig.findUnique.mockResolvedValue({ monthlyRate: 1 });
    prisma.leaveBalance.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (cb: (tx: PrismaTx) => Promise<void>) => {
      calls.push('tx-start');
      await cb(prisma as unknown as PrismaTx);
      calls.push('tx-end');
    });
    prisma.leaveBalance.upsert.mockImplementation(() => {
      calls.push('upsert');
      return Promise.resolve({});
    });
    prisma.leaveBalanceAudit.create.mockImplementation(() => {
      calls.push('audit');
      return Promise.resolve({});
    });

    await processor.process(makeJob(payload));

    expect(calls).toEqual(['tx-start', 'upsert', 'audit', 'tx-end']);
  });
});
