import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import {
  JOB_QUEUES,
  EMAIL_JOBS,
  type WelcomeEmailPayload,
  type PasswordResetEmailPayload,
  type LeaveApproverNotifyPayload,
  type LeaveFilerUpdatePayload,
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
      case EMAIL_JOBS.LEAVE_APPROVER_NOTIFY:
        await this.sendLeaveApproverNotify(
          job.data as LeaveApproverNotifyPayload,
        );
        break;
      case EMAIL_JOBS.LEAVE_FILER_UPDATE:
        await this.sendLeaveFilerUpdate(job.data as LeaveFilerUpdatePayload);
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

  private async sendPasswordReset(
    payload: PasswordResetEmailPayload,
  ): Promise<void> {
    await this.mailer.sendMail({
      to: payload.to,
      subject: 'Reset your password',
      text: `Click the link to reset your password: ${payload.resetLink}`,
    });
    this.logger.log(`Password reset email sent to ${payload.to}`);
  }

  private async sendLeaveApproverNotify(
    payload: LeaveApproverNotifyPayload,
  ): Promise<void> {
    const greeting = payload.approverName
      ? `Hi ${payload.approverName},`
      : 'Hi,';
    const filer = payload.filerName ?? 'A team member';
    const text = [
      greeting,
      '',
      `${filer} has filed a leave request that requires your approval.`,
      '',
      `Leave type : ${payload.leaveType}`,
      `From       : ${payload.startDate}`,
      `To         : ${payload.endDate}`,
      `Duration   : ${payload.durationDays} working day(s)`,
      `Status     : ${payload.status}`,
      '',
      'Please log in to UBE-HR to review and act on this request.',
    ].join('\n');

    await this.mailer.sendMail({
      to: payload.to,
      subject: `Leave approval required — ${filer}`,
      text,
    });
    this.logger.log(`Leave approver notification sent to ${payload.to}`);
  }

  private async sendLeaveFilerUpdate(
    payload: LeaveFilerUpdatePayload,
  ): Promise<void> {
    const greeting = payload.filerName ? `Hi ${payload.filerName},` : 'Hi,';
    const isRejected = payload.status === 'REJECTED';
    const statusLabel = isRejected ? 'rejected' : 'advanced to the next stage';

    const lines = [
      greeting,
      '',
      `Your leave request has been ${statusLabel}.`,
      '',
      `Leave type : ${payload.leaveType}`,
      `From       : ${payload.startDate}`,
      `To         : ${payload.endDate}`,
      `Duration   : ${payload.durationDays} working day(s)`,
      `Status     : ${payload.status}`,
    ];

    if (isRejected && payload.rejectionComment) {
      lines.push('', `Reason: ${payload.rejectionComment}`);
    }

    lines.push('', 'Log in to UBE-HR to view the full details.');

    const subject = isRejected
      ? 'Your leave request has been rejected'
      : payload.status === 'APPROVED'
        ? 'Your leave request has been approved'
        : 'Your leave request has been updated';

    await this.mailer.sendMail({
      to: payload.to,
      subject,
      text: lines.join('\n'),
    });
    this.logger.log(`Leave filer update email sent to ${payload.to}`);
  }
}
