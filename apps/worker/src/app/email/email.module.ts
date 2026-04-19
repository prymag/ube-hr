import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { JOB_QUEUES } from '@ube-hr/shared';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: JOB_QUEUES.EMAIL }),
    MailerModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const user = config.get<string>('SMTP_USER', '');
        const pass = config.get<string>('SMTP_PASS', '');
        return {
          transport: {
            host: config.get<string>('SMTP_HOST', 'localhost'),
            port: config.get<number>('SMTP_PORT', 1025),
            ...(user && pass ? { auth: { user, pass } } : {}),
          },
          defaults: {
            from: config.get<string>('SMTP_FROM', 'noreply@ube-hr.local'),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [EmailProcessor],
})
export class EmailModule {}
