import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService, LeaveType } from '@ube-hr/backend';
import { LeaveBalanceService } from './leave-balance.service';

const createPrismaMock = () => ({
  leaveAccrualConfig: {
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
  leaveBalance: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  leaveBalanceAudit: { create: jest.fn(), findMany: jest.fn() },
  user: { findUnique: jest.fn(), findMany: jest.fn() },
  $transaction: jest.fn(),
});

describe('LeaveBalanceService', () => {
  let service: LeaveBalanceService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module = await Test.createTestingModule({
      providers: [
        LeaveBalanceService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(LeaveBalanceService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('upsertConfig', () => {
    it.each([
      [LeaveType.MATERNITY],
      [LeaveType.PATERNITY],
      [LeaveType.BEREAVEMENT],
    ])('throws BadRequestException for %s', async (leaveType) => {
      await expect(service.upsertConfig(leaveType, 1)).rejects.toThrow(BadRequestException);
      expect(prisma.leaveAccrualConfig.upsert).not.toHaveBeenCalled();
    });

    it('accepts ANNUAL and delegates to prisma', async () => {
      prisma.leaveAccrualConfig.upsert.mockResolvedValue({
        id: 1,
        leaveType: LeaveType.ANNUAL,
        monthlyRate: 2,
        daysPerYear: 24,
        carryOverLimit: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await service.upsertConfig(LeaveType.ANNUAL, 2);
      expect(result.leaveType).toBe(LeaveType.ANNUAL);
      expect(prisma.leaveAccrualConfig.upsert).toHaveBeenCalledTimes(1);
    });

    it('accepts SICK and delegates to prisma', async () => {
      prisma.leaveAccrualConfig.upsert.mockResolvedValue({
        id: 2,
        leaveType: LeaveType.SICK,
        monthlyRate: 1,
        daysPerYear: 12,
        carryOverLimit: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await service.upsertConfig(LeaveType.SICK, 1);
      expect(result.leaveType).toBe(LeaveType.SICK);
      expect(prisma.leaveAccrualConfig.upsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('runMonthlyAccrual', () => {
    it('skips configs whose leaveType is not in VALID_ACCRUAL_TYPES', async () => {
      prisma.leaveAccrualConfig.findMany.mockResolvedValue([
        { leaveType: LeaveType.MATERNITY, monthlyRate: 1 },
        { leaveType: LeaveType.PATERNITY, monthlyRate: 1 },
        { leaveType: LeaveType.BEREAVEMENT, monthlyRate: 1 },
      ]);
      prisma.user.findMany.mockResolvedValue([{ id: 1 }]);

      const result = await service.runMonthlyAccrual();

      expect(result.processed).toBe(0);
      expect(result.skipped).toBe(3);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('processes ANNUAL and SICK configs but skips manual types', async () => {
      prisma.leaveAccrualConfig.findMany.mockResolvedValue([
        { leaveType: LeaveType.ANNUAL, monthlyRate: 2 },
        { leaveType: LeaveType.MATERNITY, monthlyRate: 1 },
      ]);
      prisma.user.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.leaveBalance.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation((fn: (tx: typeof prisma) => Promise<void>) =>
        fn(prisma),
      );
      prisma.leaveBalance.upsert.mockResolvedValue({});
      prisma.leaveBalanceAudit.create.mockResolvedValue({});

      const result = await service.runMonthlyAccrual();

      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(1);
    });
  });
});
