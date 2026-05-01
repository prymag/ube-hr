import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LeaveAccrualService } from '../leave-accrual/leave-accrual.service';

@Injectable()
export class LeaveAccrualCronService {
  private readonly logger = new Logger(LeaveAccrualCronService.name);

  constructor(private readonly leaveAccrualService: LeaveAccrualService) {}

  @Cron('0 0 1 * *')
  async runMonthlyAccrual(): Promise<void> {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = prev.getFullYear();
    const month = prev.getMonth() + 1; // 1-indexed (1–12)

    this.logger.log(`Triggering accrual run for ${year}-${month}`);
    const result = await this.leaveAccrualService.triggerAccrualRun(
      year,
      month,
    );
    this.logger.log(
      `Accrual run complete: runId=${result.runId}, jobsEnqueued=${result.jobsEnqueued}`,
    );
  }
}
