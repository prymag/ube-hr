import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '@ube-hr/backend';
import { JOB_QUEUES, LEAVE_JOBS, type AccrueBalancePayload } from '@ube-hr/shared';

@Processor(JOB_QUEUES.LEAVE)
export class LeaveAccrualProcessor extends WorkerHost {
  private readonly logger = new Logger(LeaveAccrualProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === LEAVE_JOBS.ACCRUE_BALANCE) {
      await this.accrueBalance(job.data as AccrueBalancePayload);
    } else {
      this.logger.warn(`Unknown leave job: ${job.name}`);
    }
  }

  private async accrueBalance(payload: AccrueBalancePayload): Promise<void> {
    const { runId, userId, leaveType, year, month } = payload;

    const config = await this.prisma.leaveAccrualConfig.findUnique({
      where: { leaveType },
    });
    if (!config) return;

    const balance = await this.prisma.leaveBalance.findUnique({
      where: { userId_leaveType_year: { userId, leaveType, year } },
    });

    const lastYear = balance?.lastAccruedYear;
    const lastMonth = balance?.lastAccruedMonth;
    if (
      lastYear != null &&
      (lastYear > year || (lastYear === year && (lastMonth ?? 0) >= month))
    ) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.leaveBalance.upsert({
        where: { userId_leaveType_year: { userId, leaveType, year } },
        create: {
          userId,
          leaveType,
          year,
          allocated: config.monthlyRate,
          lastAccruedMonth: month,
          lastAccruedYear: year,
        },
        update: {
          allocated: { increment: config.monthlyRate },
          lastAccruedMonth: month,
          lastAccruedYear: year,
        },
      });

      await tx.leaveBalanceAudit.create({
        data: {
          userId,
          leaveType,
          eventType: 'ACCRUAL',
          amount: config.monthlyRate,
          debtDelta: 0,
          runId,
        },
      });
    });
  }
}
