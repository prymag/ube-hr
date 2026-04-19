import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import {
  JOB_QUEUES,
  EMAIL_JOBS,
  type WelcomeEmailPayload,
  type PasswordResetEmailPayload,
} from '@ube-hr/shared';

@Processor(JOB_QUEUES.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailer: MailerService) {
    super();
  }

  async process(job: Job): Promise<void> {

    switch (job.name) {
      case EMAIL_JOBS.SEND_WELCOME:
        await this.sendWelcome(job.data as WelcomeEmailPayload);
        break;
      case EMAIL_JOBS.SEND_PASSWORD_RESET:
        await this.sendPasswordReset(job.data as PasswordResetEmailPayload);
        break;
      default:
        this.logger.warn(`Unknown email job: ${job.name}`);
    }
  }

  private async sendWelcome(payload: WelcomeEmailPayload): Promise<void> {
    await this.mailer.sendMail({
      to: payload.to,
      subject: 'Welcome to UBE-HR',
      text: `Hi ${payload.name ?? payload.to}, welcome to UBE-HR!`,
    });
    this.logger.log(`Welcome email sent to ${payload.to}`);
  }

  private async sendPasswordReset(payload: PasswordResetEmailPayload): Promise<void> {
    await this.mailer.sendMail({
      to: payload.to,
      subject: 'Reset your password',
      text: `Click the link to reset your password: ${payload.resetLink}`,
    });
    this.logger.log(`Password reset email sent to ${payload.to}`);
  }
}
