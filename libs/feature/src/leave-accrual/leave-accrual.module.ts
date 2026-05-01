import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { JOB_QUEUES } from '@ube-hr/shared';
import { LeaveAccrualService } from './leave-accrual.service';
import { LeaveAccrualCronService } from './leave-accrual-cron.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({ name: JOB_QUEUES.LEAVE }),
  ],
  providers: [LeaveAccrualService, LeaveAccrualCronService],
  exports: [LeaveAccrualService, LeaveAccrualCronService],
})
export class LeaveAccrualModule {}
