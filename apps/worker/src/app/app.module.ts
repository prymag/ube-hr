import { Module } from '@nestjs/common';
import { AppConfigModule } from '@ube-hr/backend';
import { QueueModule } from '@ube-hr/feature';
import { EmailModule } from './email/email.module';
import { LeaveModule } from './leave/leave.module';

@Module({
  imports: [
    AppConfigModule,
    QueueModule,
    EmailModule,
    LeaveModule,
  ],
})
export class AppModule {}
