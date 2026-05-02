import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { PrismaService, LeaveType } from '@ube-hr/backend';
import { JOB_QUEUES, LEAVE_JOBS } from '@ube-hr/shared';

export interface AccrualJobPayload {
  runId: string;
  userId: number;
  leaveType: LeaveType;
  year: number;
  month: number;
}

export interface AccrualRunResult {
  runId: string;
  jobsEnqueued: number;
}

@Injectable()
export class LeaveAccrualService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(JOB_QUEUES.LEAVE) private readonly leaveQueue: Queue,
  ) {}

  async triggerAccrualRun(
    year?: number,
    month?: number,
  ): Promise<AccrualRunResult> {
    let targetYear = year;
    let targetMonth = month;

    if (targetYear === undefined || targetMonth === undefined) {
      const now = new Date();
      // target = previous calendar month
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      targetYear = prev.getFullYear();
      targetMonth = prev.getMonth() + 1; // 1-indexed (1–12)
    }

    const runId = randomUUID();

    const [users, configs] = await Promise.all([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true },
      }),
      this.prisma.leaveAccrualConfig.findMany({
        select: { leaveType: true },
      }),
    ]);

    let jobsEnqueued = 0;

    for (const user of users) {
      for (const config of configs) {
        const jobId = `accrual_${user.id}_${config.leaveType}_${targetYear}_${targetMonth}`;
        const payload: AccrualJobPayload = {
          runId,
          userId: user.id,
          leaveType: config.leaveType,
          year: targetYear,
          month: targetMonth,
        };
        await this.leaveQueue.add(LEAVE_JOBS.ACCRUE_BALANCE, payload, {
          jobId,
        });
        jobsEnqueued++;
      }
    }

    return { runId, jobsEnqueued };
  }
}
