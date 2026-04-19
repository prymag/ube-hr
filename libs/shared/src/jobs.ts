export const JOB_QUEUES = {
  EMAIL: 'email',
} as const;

export const EMAIL_JOBS = {
  SEND_WELCOME: 'send-welcome',
  SEND_PASSWORD_RESET: 'send-password-reset',
} as const;

export interface WelcomeEmailPayload {
  to: string;
  name: string;
}

export interface PasswordResetEmailPayload {
  to: string;
  resetLink: string;
}
