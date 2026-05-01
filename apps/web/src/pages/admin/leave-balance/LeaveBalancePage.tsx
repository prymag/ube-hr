import { useState } from 'react';
import {
  useAllBalances,
  GrantDialog,
  AccrualConfigSection,
  LEAVE_TYPES,
  LEAVE_TYPE_LABELS,
} from '../../../features/leave-balance';
import type { LeaveBalanceWithUser } from '@ube-hr/shared';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ube-hr/ui';

export function LeaveBalancePage() {
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [grantTarget, setGrantTarget] = useState<LeaveBalanceWithUser | null>(null);

  const { data: response, isLoading } = useAllBalances({
    leaveType: leaveTypeFilter || undefined,
    page,
    pageSize: 20,
  });

  const rows = response?.data ?? [];
  const total = response?.total ?? 0;
  const pageCount = response?.pageCount ?? 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leave Balances</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} record{total !== 1 ? 's' : ''} for {new Date().getFullYear()}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <Select value={leaveTypeFilter || 'all'} onValueChange={(v) => { setLeaveTypeFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {LEAVE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{LEAVE_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No balance records found. Run the accrual job or grant credits to users.
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Allocated</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Used</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Pending</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Available</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Debt</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const available = row.allocated - row.used - row.pending;
                return (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.userName ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{row.userEmail}</div>
                    </td>
                    <td className="px-4 py-3">{LEAVE_TYPE_LABELS[row.leaveType] ?? row.leaveType}</td>
                    <td className="px-4 py-3 text-right">{row.allocated}</td>
                    <td className="px-4 py-3 text-right">{row.used}</td>
                    <td className="px-4 py-3 text-right">{row.pending}</td>
                    <td className={`px-4 py-3 text-right font-medium ${available < 0 ? 'text-destructive' : ''}`}>
                      {available}
                    </td>
                    <td className={`px-4 py-3 text-right ${row.debt > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {row.debt > 0 ? row.debt : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => setGrantTarget(row)}>
                        Grant
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>Page {page} of {pageCount}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= pageCount}>Next</Button>
          </div>
        </div>
      )}

      <AccrualConfigSection />

      <GrantDialog target={grantTarget} onClose={() => setGrantTarget(null)} />
    </div>
  );
}
