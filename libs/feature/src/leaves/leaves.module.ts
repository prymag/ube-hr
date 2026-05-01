import { Module } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { HolidaysModule } from '../holidays/holidays.module';
import { LeaveBalanceModule } from '../leave-balance/leave-balance.module';

@Module({
  imports: [HolidaysModule, LeaveBalanceModule],
  providers: [LeavesService],
  exports: [LeavesService],
})
export class LeavesModule {}
