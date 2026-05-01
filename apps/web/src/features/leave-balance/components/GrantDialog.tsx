import { useState } from 'react';
import type { AxiosError } from 'axios';
import type { LeaveBalanceWithUser } from '@ube-hr/shared';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ube-hr/ui';
import { useGrantBalance } from '../leave-balance.queries';
import { LEAVE_TYPES, LEAVE_TYPE_LABELS } from '../leave-balance.constants';

export function GrantDialog({
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
