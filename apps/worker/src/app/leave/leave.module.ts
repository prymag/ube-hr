import { Module } from '@nestjs/common';
import { PrismaModule } from '@ube-hr/backend';
import { LeaveAccrualProcessor } from './leave.processor';

@Module({
  imports: [PrismaModule],
  providers: [LeaveAccrualProcessor],
})
export class LeaveModule {}
