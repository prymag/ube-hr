export const JOB_QUEUES = {
  EMAIL: 'email',
} as const;

export const EMAIL_JOBS = {
  SEND_WELCOME: 'send-welcome',
  SEND_PASSWORD_RESET: 'send-password-reset',
  LEAVE_APPROVER_NOTIFY: 'leave-approver-notify',
  LEAVE_FILER_UPDATE: 'leave-filer-update',
} as const;

export interface WelcomeEmailPayload {
  to: string;
  name: string;
}

export interface PasswordResetEmailPayload {
  to: string;
  resetLink: string;
}

export interface LeaveApproverNotifyPayload {
  to: string;
  approverName: string | null;
  filerName: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  status: string;
}

export interface LeaveFilerUpdatePayload {
  to: string;
  filerName: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  status: string;
  rejectionComment?: string;
}
