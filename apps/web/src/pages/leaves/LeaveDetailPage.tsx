import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { AxiosError } from 'axios';
import {
  useLeave,
  useCancelLeave,
  useApproveLeave,
  useRejectLeave,
  LeaveStatusBadge,
} from '../../features/leaves';
import { useMe } from '../../features/authentication';
import { Button, Card, CardContent, Input, Label } from '@ube-hr/ui';
import { PERMISSIONS } from '@ube-hr/shared';

const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annual Leave',
  SICK: 'Sick Leave',
  UNPAID: 'Unpaid Leave',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
  BEREAVEMENT: 'Bereavement Leave',
  OTHER: 'Other',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LeaveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const leaveId = Number(id);

  const { data: leave, isLoading } = useLeave(leaveId);
  const { data: me } = useMe();
  const approveLeave = useApproveLeave(leaveId);
  const rejectLeave = useRejectLeave(leaveId);

  const cancelLeave = useCancelLeave(leaveId);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-8">Loading…</div>;
  }
  if (!leave) return null;

  const myPendingStep = leave.approvalSteps.find(
    (s) => s.approverId === me?.id && s.status === 'PENDING',
  );
  const isPending =
    leave.status === 'PENDING_MANAGER' || leave.status === 'PENDING_ADMIN';

  const canCancel = leave.userId === me?.id && isPending;

  const canAct =
    !!myPendingStep &&
    !!me?.permissions?.includes(PERMISSIONS.LEAVES_APPROVE) &&
    isPending;

  const cancelError = cancelLeave.isError
    ? ((cancelLeave.error as AxiosError<{ message: string }>)?.response?.data
        ?.message ?? 'Failed to cancel.')
    : null;

  const approveError = approveLeave.isError
    ? ((approveLeave.error as AxiosError<{ message: string }>)?.response?.data
        ?.message ?? 'Failed to approve.')
    : null;
  const rejectError = rejectLeave.isError
    ? ((rejectLeave.error as AxiosError<{ message: string }>)?.response?.data
        ?.message ?? 'Failed to reject.')
    : null;

  function handleApprove() {
    approveLeave.mutate(undefined, {
      onSuccess: () => navigate('/leaves/approvals'),
    });
  }

  function handleReject(e: React.FormEvent) {
    e.preventDefault();
    rejectLeave.mutate(rejectComment, {
      onSuccess: () => navigate('/leaves/approvals'),
    });
  }

  return (
    <div className="max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-5 text-muted-foreground hover:text-foreground px-0"
      >
        ← Back
      </Button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leave Request #{leave.id}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Filed by {leave.userName ?? leave.userEmail} on{' '}
            {formatDate(leave.createdAt)}
          </p>
        </div>
        <LeaveStatusBadge status={leave.status} />
      </div>

      <Card className="mb-6">
        <CardContent className="p-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium">
              {LEAVE_TYPE_LABELS[leave.leaveType] ?? leave.leaveType}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Duration</p>
            <p className="font-medium">
              {leave.durationDays} day{leave.durationDays !== 1 ? 's' : ''}
              {leave.isHalfDay && ` (${leave.halfDayPeriod})`}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Start Date</p>
            <p className="font-medium">{formatDate(leave.startDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">End Date</p>
            <p className="font-medium">{formatDate(leave.endDate)}</p>
          </div>
          {leave.reason && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Reason</p>
              <p>{leave.reason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {leave.approvalSteps.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-semibold mb-3">Approval History</h2>
          <div className="space-y-2">
            {leave.approvalSteps.map((step) => (
              <div
                key={step.id}
                className="border rounded-md px-4 py-3 text-sm flex items-start justify-between gap-4"
              >
                <div>
                  <p className="font-medium">
                    {step.approverName ?? step.approverEmail}
                    <span className="text-xs text-muted-foreground font-normal ml-2">
                      ({step.stage})
                    </span>
                  </p>
                  {step.comment && (
                    <p className="text-muted-foreground mt-1 italic">
                      &ldquo;{step.comment}&rdquo;
                    </p>
                  )}
                  {step.decidedAt && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateTime(step.decidedAt)}
                    </p>
                  )}
                </div>
                <LeaveStatusBadge status={step.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {canCancel && (
        <div className="mb-4">
          {!showCancelConfirm ? (
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(true)}
              className="text-destructive border-destructive hover:bg-destructive/10"
            >
              Cancel Leave Request
            </Button>
          ) : (
            <div className="border border-destructive/40 rounded-md px-4 py-3 flex items-center gap-3 text-sm">
              <span>Are you sure you want to cancel this request?</span>
              <Button
                variant="destructive"
                size="sm"
                disabled={cancelLeave.isPending}
                onClick={() =>
                  cancelLeave.mutate(undefined, {
                    onSuccess: () => navigate('/leaves'),
                  })
                }
              >
                {cancelLeave.isPending ? 'Cancelling…' : 'Yes, cancel it'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep
              </Button>
              {cancelError && (
                <p className="text-destructive">{cancelError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {canAct && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold mb-4">Your Decision</h2>

            {!showRejectForm ? (
              <div className="flex gap-3">
                <Button
                  onClick={handleApprove}
                  disabled={approveLeave.isPending}
                >
                  {approveLeave.isPending ? 'Approving…' : 'Approve'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectForm(true)}
                >
                  Reject
                </Button>
                {approveError && (
                  <p className="text-sm text-destructive self-center">
                    {approveError}
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleReject} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Rejection reason (required)</Label>
                  <Input
                    type="text"
                    required
                    autoFocus
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    placeholder="Explain why this leave is rejected"
                  />
                </div>
                {rejectError && (
                  <p className="text-sm text-destructive">{rejectError}</p>
                )}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={rejectLeave.isPending || !rejectComment.trim()}
                  >
                    {rejectLeave.isPending ? 'Rejecting…' : 'Confirm Rejection'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectComment('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
