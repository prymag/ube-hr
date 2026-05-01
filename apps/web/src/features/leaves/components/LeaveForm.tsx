import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ube-hr/ui';
import type { LeaveBalanceResponse } from '@ube-hr/shared';

const LEAVE_TYPES = [
  { value: 'ANNUAL', label: 'Annual Leave' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'MATERNITY', label: 'Maternity Leave' },
  { value: 'PATERNITY', label: 'Paternity Leave' },
  { value: 'BEREAVEMENT', label: 'Bereavement Leave' },
  { value: 'UNPAID', label: 'Unpaid Leave' },
  { value: 'OTHER', label: 'Other' },
] as const;

export interface LeaveFormValues {
  type: string;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  halfDay: 'AM' | 'PM' | '';
  reason: string;
}

interface LeaveFormProps {
  values: LeaveFormValues;
  onChange: (values: LeaveFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  error?: string | null;
  balances?: LeaveBalanceResponse[];
}

function getAvailable(balances: LeaveBalanceResponse[], type: string): number | null {
  const b = balances.find((b) => b.leaveType === type);
  if (!b) return null;
  return b.allocated - b.used - b.pending;
}

export function LeaveForm({
  values,
  onChange,
  onSubmit,
  isPending,
  error,
  balances = [],
}: LeaveFormProps) {
  function set<K extends keyof LeaveFormValues>(key: K, value: LeaveFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  const isSameDay = values.startDate && values.endDate && values.startDate === values.endDate;
  const available = values.type !== 'UNPAID' ? getAvailable(balances, values.type) : null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Leave Type</Label>
        <Select
          value={values.type}
          onValueChange={(v) => set('type', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select leave type" />
          </SelectTrigger>
          <SelectContent>
            {LEAVE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {values.type && values.type !== 'UNPAID' && available !== null && (
          <p className="text-xs text-muted-foreground">
            Balance available: <span className={available <= 0 ? 'text-destructive font-medium' : 'font-medium'}>{available} day{available !== 1 ? 's' : ''}</span>
          </p>
        )}
        {values.type && values.type !== 'UNPAID' && available === null && (
          <p className="text-xs text-muted-foreground">No balance record found for this leave type.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Start Date</Label>
          <Input
            type="date"
            required
            value={values.startDate}
            onChange={(e) => {
              const next = { ...values, startDate: e.target.value };
              if (next.endDate && next.endDate < e.target.value) {
                next.endDate = e.target.value;
              }
              if (next.startDate !== next.endDate) {
                next.isHalfDay = false;
                next.halfDay = '';
              }
              onChange(next);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label>End Date</Label>
          <Input
            type="date"
            required
            value={values.endDate}
            min={values.startDate || undefined}
            onChange={(e) => {
              const next = { ...values, endDate: e.target.value };
              if (next.startDate !== next.endDate) {
                next.isHalfDay = false;
                next.halfDay = '';
              }
              onChange(next);
            }}
          />
        </div>
      </div>

      {isSameDay && (
        <div className="space-y-1.5">
          <Label>Half Day</Label>
          <Select
            value={values.isHalfDay ? (values.halfDay || 'full') : 'full'}
            onValueChange={(v) => {
              if (v === 'full') {
                onChange({ ...values, isHalfDay: false, halfDay: '' });
              } else {
                onChange({ ...values, isHalfDay: true, halfDay: v as 'AM' | 'PM' });
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Full day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full day</SelectItem>
              <SelectItem value="AM">Half day – AM</SelectItem>
              <SelectItem value="PM">Half day – PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>
          Reason <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          type="text"
          value={values.reason}
          onChange={(e) => set('reason', e.target.value)}
          placeholder="Brief reason for leave"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="pt-1">
        <Button type="submit" disabled={isPending || !values.type}>
          {isPending ? 'Submitting…' : 'Submit Leave Request'}
        </Button>
      </div>
    </form>
  );
}
