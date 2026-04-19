import { Module } from '@nestjs/common';
import { AppConfigModule } from '@ube-hr/backend';
import { QueueModule } from '@ube-hr/feature';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    AppConfigModule,
    QueueModule,
    EmailModule,
  ],
})
export class AppModule {}
