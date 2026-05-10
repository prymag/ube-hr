import { Card, CardContent, CardHeader, CardTitle } from '@ube-hr/ui';
import { useMyLeaves } from '../leaves.queries';
import { LeaveStatusBadge } from './LeaveStatusBadge';

function formatDateRange(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const e = new Date(end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  return s === e ? s : `${s} – ${e}`;
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annual',
  SICK: 'Sick',
};

export function RecentLeaves() {
  const { data, isLoading } = useMyLeaves({ pageSize: 3, sortField: 'createdAt', sortDir: 'desc' });
  const leaves = data?.data ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent Leaves</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
          </div>
        )}
        {!isLoading && leaves.length === 0 && (
          <p className="text-sm text-muted-foreground">No leave requests filed yet.</p>
        )}
        {!isLoading && leaves.length > 0 && (
          <ul className="space-y-3">
            {leaves.map((leave) => (
              <li key={leave.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {LEAVE_TYPE_LABELS[leave.leaveType] ?? leave.leaveType}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateRange(leave.startDate, leave.endDate)}
                  </p>
                </div>
                <LeaveStatusBadge status={leave.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
