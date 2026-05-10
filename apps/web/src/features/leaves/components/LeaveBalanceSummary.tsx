import { Card, CardContent, CardHeader, CardTitle } from '@ube-hr/ui';
import { useMyBalances } from '../leaves.queries';
import type { LeaveBalanceResponse } from '@ube-hr/shared';

const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annual Leave',
  SICK: 'Sick Leave',
};

function BalanceCard({ balance }: { balance: LeaveBalanceResponse }) {
  const remaining = balance.allocated - balance.used - balance.pending;
  const label = LEAVE_TYPE_LABELS[balance.leaveType] ?? balance.leaveType;

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold text-gray-900">{remaining}</span>
        <span className="text-xs text-gray-400 ml-1">/ {balance.allocated} days</span>
      </div>
    </div>
  );
}

export function LeaveBalanceSummary() {
  const { data: balances, isLoading } = useMyBalances();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Leave Balances</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
          </div>
        )}
        {!isLoading && (!balances || balances.length === 0) && (
          <p className="text-sm text-muted-foreground">No leave balances found.</p>
        )}
        {!isLoading && balances && balances.length > 0 && (
          <div>
            {balances.map((b) => (
              <BalanceCard key={b.id} balance={b} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
