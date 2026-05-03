import { useState } from 'react';
import { Button, Input } from '@ube-hr/ui';
import {
  useAccrualConfigs,
  useUpdateAccrualConfig,
  useTriggerAccrual,
} from '../leave-balance.queries';
import { LEAVE_TYPE_LABELS } from '../leave-balance.constants';

const ACCRUAL_TYPES = [
  'ANNUAL',
  'SICK',
  'MATERNITY',
  'PATERNITY',
  'BEREAVEMENT',
];

const MANUAL_ACCRUAL_TYPES = new Set(['MATERNITY', 'PATERNITY', 'BEREAVEMENT']);

export function AccrualConfigSection() {
  const { data: configs, isLoading } = useAccrualConfigs();
  const update = useUpdateAccrualConfig();
  const trigger = useTriggerAccrual();
  const [editRates, setEditRates] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    runId: string;
    jobsEnqueued: number;
  } | null>(null);

  if (isLoading)
    return (
      <div className="text-sm text-muted-foreground">Loading configs…</div>
    );

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
          Accrual queued: {result.jobsEnqueued} jobs enqueued.
        </p>
      )}
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Leave Type
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Monthly Rate (days)
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {ACCRUAL_TYPES.map((type) => (
              <tr key={type} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">
                  {LEAVE_TYPE_LABELS[type]}
                </td>
                {MANUAL_ACCRUAL_TYPES.has(type) ? (
                  <td className="px-4 py-3 text-muted-foreground italic" colSpan={2}>
                    Manual Assignment Only
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-8 w-32"
                        value={getRate(type)}
                        onChange={(e) =>
                          setEditRates((prev) => ({
                            ...prev,
                            [type]: e.target.value,
                          }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSave(type)}
                        disabled={update.isPending}
                      >
                        Save
                      </Button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
