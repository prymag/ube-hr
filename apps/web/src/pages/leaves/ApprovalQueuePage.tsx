import { useNavigate } from 'react-router-dom';
import { useLeaveApprovals, LeaveStatusBadge } from '../../features/leaves';
import { Button } from '@ube-hr/ui';

const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annual',
  SICK: 'Sick',
  UNPAID: 'Unpaid',
  MATERNITY: 'Maternity',
  PATERNITY: 'Paternity',
  BEREAVEMENT: 'Bereavement',
  OTHER: 'Other',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function ApprovalQueuePage() {
  const navigate = useNavigate();
  const { data: response, isLoading } = useLeaveApprovals();
  const rows = response?.data ?? [];
  const total = response?.total ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Approval Queue</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {total} pending request{total !== 1 ? 's' : ''}
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No leave requests pending your approval.
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Employee
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Type
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Period
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Days
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.userName ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.userEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {LEAVE_TYPE_LABELS[row.leaveType] ?? row.leaveType}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(row.startDate)}
                    {row.startDate !== row.endDate && (
                      <> – {formatDate(row.endDate)}</>
                    )}
                    {row.isHalfDay && (
                      <span className="ml-1 text-xs">({row.halfDayPeriod})</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.durationDays} day{row.durationDays !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3">
                    <LeaveStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/leaves/${row.id}`)}
                    >
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
