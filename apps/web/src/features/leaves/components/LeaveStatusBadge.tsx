import { Badge } from '@ube-hr/ui';
import type { LeaveStatus } from '@ube-hr/shared';

const STATUS_CONFIG: Record<LeaveStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  PENDING_MANAGER: { label: 'Pending Manager', variant: 'secondary' },
  PENDING_ADMIN: { label: 'Pending Admin', variant: 'secondary' },
  APPROVED: { label: 'Approved', variant: 'default' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  CANCELLED: { label: 'Cancelled', variant: 'outline' },
};

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
