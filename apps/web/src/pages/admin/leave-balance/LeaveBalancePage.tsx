import { useState } from 'react';
import type { AxiosError } from 'axios';
import {
  useAllBalances,
  useAccrualConfigs,
  useGrantBalance,
  useUpdateAccrualConfig,
  useTriggerAccrual,
} from '../../../features/leave-balance';
import type { LeaveBalanceWithUser } from '@ube-hr/shared';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ube-hr/ui';

const LEAVE_TYPES = ['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'UNPAID', 'OTHER'];

const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annual', SICK: 'Sick', MATERNITY: 'Maternity',
  PATERNITY: 'Paternity', BEREAVEMENT: 'Bereavement', UNPAID: 'Unpaid', OTHER: 'Other',
};

function GrantDialog({
  target,
  onClose,
}: {
  target: LeaveBalanceWithUser | null;
  onClose: () => void;
}) {
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const grant = useGrantBalance(target?.userId ?? 0);

  if (!target) return null;

  const error = grant.isError
    ? ((grant.error as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Failed')
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    grant.mutate(
      { leaveType, amount: parseFloat(amount), note: note.trim() || undefined },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">
          Grant Credits — {target.userName ?? target.userEmail}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Leave Type</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{LEAVE_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Days</Label>
            <Input
              type="number"
              min="0.5"
              step="0.5"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for grant" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={grant.isPending || !amount}>
              {grant.isPending ? 'Granting…' : 'Grant'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AccrualConfigSection() {
  const { data: configs, isLoading } = useAccrualConfigs();
  const update = useUpdateAccrualConfig();
  const trigger = useTriggerAccrual();
  const [editRates, setEditRates] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ processed: number; skipped: number } | null>(null);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading configs…</div>;

  const accrualTypes = ['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT'];

  const getRate = (type: string) => {
    if (editRates[type] !== undefined) return editRates[type];
    const cfg = configs?.find((c) => c.leaveType === type);
    return cfg ? String(cfg.monthlyRate) : '0';
  };

  function handleSave(type: string) {
    const rate = parseFloat(getRate(type));
    if (isNaN(rate) || rate < 0) return;
    update.mutate({ type, monthlyRate: rate });
  }

  function handleTrigger() {
    setResult(null);
    trigger.mutate(undefined, {
      onSuccess: (data) => setResult(data),
    });
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Accrual Configuration</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTrigger}
          disabled={trigger.isPending}
        >
          {trigger.isPending ? 'Running…' : 'Run Accrual Now'}
        </Button>
      </div>
      {result && (
        <p className="text-sm text-muted-foreground mb-3">
          Accrual complete: {result.processed} credited, {result.skipped} skipped.
        </p>
      )}
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Leave Type</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Monthly Rate (days)</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {accrualTypes.map((type) => (
              <tr key={type} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{LEAVE_TYPE_LABELS[type]}</td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-8 w-32"
                    value={getRate(type)}
                    onChange={(e) => setEditRates((prev) => ({ ...prev, [type]: e.target.value }))}
                  />
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" onClick={() => handleSave(type)} disabled={update.isPending}>
                    Save
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
        <Select value={leaveTypeFilter} onValueChange={(v) => { setLeaveTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
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
