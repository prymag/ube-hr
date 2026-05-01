import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [
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
