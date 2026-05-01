import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@ube-hr/backend';
import { JOB_QUEUES } from '@ube-hr/shared';
import { LeaveAccrualProcessor } from './leave.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: JOB_QUEUES.LEAVE }),
    PrismaModule,
  ],
  providers: [LeaveAccrualProcessor],
})
export class LeaveModule {}
