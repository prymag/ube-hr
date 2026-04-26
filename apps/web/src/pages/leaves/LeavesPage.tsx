import { useNavigate } from 'react-router-dom';
import { useMyLeaves, useMyBalances, LeaveStatusBadge } from '../../features/leaves';
import { Button } from '@ube-hr/ui';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annual', SICK: 'Sick', UNPAID: 'Unpaid', MATERNITY: 'Maternity',
  PATERNITY: 'Paternity', BEREAVEMENT: 'Bereavement', OTHER: 'Other',
};

export function LeavesPage() {
  const navigate = useNavigate();
  const { data: response, isLoading } = useMyLeaves();
  const { data: balances } = useMyBalances();
  const rows = response?.data ?? [];
  const total = response?.total ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Leaves</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} request{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/leaves/new')}>File Leave</Button>
      </div>

      {balances && balances.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {balances.filter((b) => b.leaveType !== 'UNPAID').map((b) => {
            const available = b.allocated - b.used - b.pending;
            return (
              <div key={b.id} className="border rounded-lg p-3 bg-muted/20">
                <div className="text-xs text-muted-foreground mb-1">
                  {LEAVE_TYPE_LABELS[b.leaveType] ?? b.leaveType}
                </div>
                <div className={`text-xl font-bold ${available <= 0 ? 'text-destructive' : ''}`}>
                  {available}
                </div>
                <div className="text-xs text-muted-foreground">
                  of {b.allocated} days available
                </div>
                {b.debt > 0 && (
                  <div className="text-xs text-destructive mt-0.5">{b.debt} day(s) owed</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No leave requests yet. File one to get started.
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Period</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Days</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Filed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
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
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(row.createdAt)}
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
