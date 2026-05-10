import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@ube-hr/ui';
import { useLeaveApprovals } from '../leaves.queries';

const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annual',
  SICK: 'Sick',
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const e = new Date(end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return s === e ? s : `${s} – ${e}`;
}

export function PendingApprovalsWidget() {
  const { data, isLoading } = useLeaveApprovals({ status: 'PENDING', pageSize: 5 });
  const leaves = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Pending Approvals</CardTitle>
          {total > 0 && (
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
              {total}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
          </div>
        )}
        {!isLoading && leaves.length === 0 && (
          <p className="text-sm text-muted-foreground">No pending approvals.</p>
        )}
        {!isLoading && leaves.length > 0 && (
          <ul className="space-y-3">
            {leaves.map((leave) => (
              <li key={leave.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {leave.userName ?? leave.userEmail}
                  </p>
                  <p className="text-xs text-gray-500">
                    {LEAVE_TYPE_LABELS[leave.leaveType] ?? leave.leaveType}
                    {' · '}
                    {formatDateRange(leave.startDate, leave.endDate)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 pt-3 border-t">
          <Link
            to="/leaves/approvals"
            className="text-xs text-blue-600 hover:underline"
          >
            View approval queue →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
