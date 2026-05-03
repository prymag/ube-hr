import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  PrismaService,
  LeaveType,
  type LeaveBalanceModel,
} from '@ube-hr/backend';
import type { PaginatedResponse } from '@ube-hr/shared';

export type LeaveBalanceRecord = LeaveBalanceModel & {
  userName?: string | null;
  userEmail?: string;
};

export interface LeaveBalanceAuditRecord {
  id: number;
  userId: number;
  leaveType: LeaveType;
  eventType: string;
  amount: number;
  debtDelta: number;
  note: string | null;
  createdAt: Date;
}

export interface LeaveAccrualConfigRecord {
  id: number;
  leaveType: LeaveType;
  monthlyRate: number;
  daysPerYear: number;
  carryOverLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GrantCreditInput {
  userId: number;
  leaveType: LeaveType;
  amount: number;
  note?: string;
}

export interface AllBalancesQuery {
  userId?: string | number;
  leaveType?: string;
  page?: string | number;
  pageSize?: string | number;
}

const VALID_ACCRUAL_TYPES: LeaveType[] = [LeaveType.ANNUAL, LeaveType.SICK];

@Injectable()
export class LeaveBalanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalancesForUser(userId: number, year?: number): Promise<LeaveBalanceModel[]> {
    const y = year ?? new Date().getFullYear();
    return this.prisma.leaveBalance.findMany({
      where: { userId, year: y },
      orderBy: { leaveType: 'asc' },
    });
  }

  async getAllBalances(
    query: AllBalancesQuery = {},
  ): Promise<PaginatedResponse<LeaveBalanceRecord>> {
    const { userId, leaveType, page, pageSize } = query;

    const pageNum = Math.max(1, parseInt(String(page ?? 1), 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(String(pageSize ?? 20), 10) || 20));

    const validLeaveTypes = Object.values(LeaveType) as string[];
    const year = new Date().getFullYear();

    const where: Record<string, unknown> = { year };
    if (userId) where['userId'] = parseInt(String(userId), 10);
    if (leaveType && validLeaveTypes.includes(leaveType)) {
      where['leaveType'] = leaveType as LeaveType;
    }

    const [total, rows] = await Promise.all([
      this.prisma.leaveBalance.count({ where }),
      this.prisma.leaveBalance.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: [{ userId: 'asc' }, { leaveType: 'asc' }],
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
      }),
    ]);

    return {
      data: rows.map((r) => {
        const { user, ...rest } = r as typeof r & { user: { name: string | null; email: string } };
        return { ...rest, userName: user.name, userEmail: user.email };
      }),
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      pageCount: Math.max(1, Math.ceil(total / pageSizeNum)),
    };
  }

  async grantCredit(input: GrantCreditInput): Promise<void> {
    const { userId, leaveType, amount, note } = input;
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const year = new Date().getFullYear();

    await this.prisma.$transaction(async (tx) => {
      const balance = await tx.leaveBalance.findUnique({
        where: { userId_leaveType_year: { userId, leaveType, year } },
      });

      const currentDebt = balance?.debt ?? 0;
      const debtReduction = Math.min(currentDebt, amount);
      const allocatedIncrease = amount - debtReduction;
      const debtDelta = -debtReduction;

      await tx.leaveBalance.upsert({
        where: { userId_leaveType_year: { userId, leaveType, year } },
        create: { userId, leaveType, year, allocated: allocatedIncrease, debt: 0 },
        update: {
          allocated: { increment: allocatedIncrease },
          debt: { decrement: debtReduction },
        },
      });

      await tx.leaveBalanceAudit.create({
        data: {
          userId,
          leaveType,
          eventType: 'GRANT',
          amount,
          debtDelta,
          note: note ?? null,
        },
      });

      if (debtReduction > 0) {
        await tx.leaveBalanceAudit.create({
          data: {
            userId,
            leaveType,
            eventType: 'DEBT_RECONCILIATION',
            amount: 0,
            debtDelta,
            note: `Debt reduced by ${debtReduction} via manual grant`,
          },
        });
      }
    });
  }

  async addPending(
    userId: number,
    leaveType: LeaveType,
    year: number,
    amount: number,
  ): Promise<void> {
    if (leaveType === LeaveType.UNPAID) return;
    await this.prisma.leaveBalance.upsert({
      where: { userId_leaveType_year: { userId, leaveType, year } },
      create: { userId, leaveType, year, pending: amount },
      update: { pending: { increment: amount } },
    });
  }

  async removePending(
    userId: number,
    leaveType: LeaveType,
    year: number,
    amount: number,
  ): Promise<void> {
    if (leaveType === LeaveType.UNPAID) return;
    await this.prisma.leaveBalance.updateMany({
      where: { userId, leaveType, year },
      data: { pending: { decrement: amount } },
    });
  }

  async finalizeApproval(
    userId: number,
    leaveType: LeaveType,
    year: number,
    durationDays: number,
    override: boolean,
  ): Promise<void> {
    if (leaveType === LeaveType.UNPAID) return;

    await this.prisma.$transaction(async (tx) => {
      const balance = await tx.leaveBalance.findUnique({
        where: { userId_leaveType_year: { userId, leaveType, year } },
      });

      const allocated = balance?.allocated ?? 0;
      const used = balance?.used ?? 0;
      const availableAfterApproval = allocated - (used + durationDays);
      const debtDelta = availableAfterApproval < 0 ? Math.abs(availableAfterApproval) : 0;

      if (debtDelta > 0 && !override) {
        throw new BadRequestException(
          `Insufficient balance. Use override to approve with deficit.`,
        );
      }

      await tx.leaveBalance.upsert({
        where: { userId_leaveType_year: { userId, leaveType, year } },
        create: {
          userId,
          leaveType,
          year,
          used: durationDays,
          pending: 0,
          debt: debtDelta,
        },
        update: {
          pending: { decrement: durationDays },
          used: { increment: durationDays },
          ...(debtDelta > 0 ? { debt: { increment: debtDelta } } : {}),
        },
      });

      await tx.leaveBalanceAudit.create({
        data: {
          userId,
          leaveType,
          eventType: debtDelta > 0 ? 'OVERRIDE' : 'DEDUCTION',
          amount: -durationDays,
          debtDelta,
          note: debtDelta > 0 ? `Override: ${debtDelta} day(s) deficit recorded as debt` : null,
        },
      });
    });
  }

  async runMonthlyAccrual(): Promise<{ processed: number; skipped: number }> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const configs = await this.prisma.leaveAccrualConfig.findMany({
      where: { monthlyRate: { gt: 0 } },
    });

    if (configs.length === 0) return { processed: 0, skipped: 0 };

    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    let processed = 0;
    let skipped = 0;

    for (const config of configs) {
      if (!VALID_ACCRUAL_TYPES.includes(config.leaveType)) {
        skipped++;
        continue;
      }
      for (const user of users) {
        const balance = await this.prisma.leaveBalance.findUnique({
          where: {
            userId_leaveType_year: {
              userId: user.id,
              leaveType: config.leaveType,
              year,
            },
          },
        });

        if (balance?.lastAccruedAt) {
          const lastAccrued = balance.lastAccruedAt;
          if (
            lastAccrued.getFullYear() === year &&
            lastAccrued.getMonth() === month
          ) {
            skipped++;
            continue;
          }
        }

        const currentDebt = balance?.debt ?? 0;
        const debtReduction = Math.min(currentDebt, config.monthlyRate);
        const allocatedIncrease = config.monthlyRate - debtReduction;
        const debtDelta = -debtReduction;

        await this.prisma.$transaction(async (tx) => {
          await tx.leaveBalance.upsert({
            where: {
              userId_leaveType_year: {
                userId: user.id,
                leaveType: config.leaveType,
                year,
              },
            },
            create: {
              userId: user.id,
              leaveType: config.leaveType,
              year,
              allocated: allocatedIncrease,
              debt: 0,
              lastAccruedAt: now,
            },
            update: {
              allocated: { increment: allocatedIncrease },
              ...(debtReduction > 0 ? { debt: { decrement: debtReduction } } : {}),
              lastAccruedAt: now,
            },
          });

          await tx.leaveBalanceAudit.create({
            data: {
              userId: user.id,
              leaveType: config.leaveType,
              eventType: 'ACCRUAL',
              amount: config.monthlyRate,
              debtDelta,
              note: `Monthly accrual: ${config.monthlyRate} day(s) for ${config.leaveType}`,
            },
          });
        });

        processed++;
      }
    }

    return { processed, skipped };
  }

  async getAuditHistory(
    userId: number,
    leaveType?: LeaveType,
  ): Promise<LeaveBalanceAuditRecord[]> {
    return this.prisma.leaveBalanceAudit.findMany({
      where: {
        userId,
        ...(leaveType ? { leaveType } : {}),
      },
      orderBy: { createdAt: 'asc' },
    }) as Promise<LeaveBalanceAuditRecord[]>;
  }

  async getConfigs(): Promise<LeaveAccrualConfigRecord[]> {
    return this.prisma.leaveAccrualConfig.findMany({
      orderBy: { leaveType: 'asc' },
    }) as Promise<LeaveAccrualConfigRecord[]>;
  }

  async upsertConfig(
    leaveType: LeaveType,
    monthlyRate: number,
  ): Promise<LeaveAccrualConfigRecord> {
    if (!VALID_ACCRUAL_TYPES.includes(leaveType)) {
      throw new BadRequestException(`${leaveType} does not support accrual`);
    }
    if (monthlyRate < 0) throw new BadRequestException('monthlyRate must be non-negative');

    return this.prisma.leaveAccrualConfig.upsert({
      where: { leaveType },
      create: { leaveType, monthlyRate },
      update: { monthlyRate },
    }) as Promise<LeaveAccrualConfigRecord>;
  }

  async findUserOrThrow(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
  }
}
