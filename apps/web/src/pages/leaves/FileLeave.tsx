import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { useCreateLeave, useMyBalances, LeaveForm } from '../../features/leaves';
import type { LeaveFormValues } from '../../features/leaves';
import { Button, Card, CardContent } from '@ube-hr/ui';

const EMPTY_FORM: LeaveFormValues = {
  type: '',
  startDate: '',
  endDate: '',
  isHalfDay: false,
  halfDay: '',
  reason: '',
};

export function FileLeave() {
  const navigate = useNavigate();
  const createLeave = useCreateLeave();
  const { data: balances } = useMyBalances();
  const [form, setForm] = useState<LeaveFormValues>(EMPTY_FORM);

  const error = createLeave.isError
    ? ((createLeave.error as AxiosError<{ message: string | string[] }>)?.response
        ?.data?.message ?? 'Failed to submit leave request.')
    : null;

  const errorMessage = Array.isArray(error) ? error.join(', ') : error;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createLeave.mutate(
      {
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        isHalfDay: form.isHalfDay || undefined,
        halfDay: form.isHalfDay && form.halfDay ? (form.halfDay as 'AM' | 'PM') : undefined,
        reason: form.reason.trim() || undefined,
      },
      { onSuccess: () => navigate('/leaves') },
    );
  }

  return (
    <div className="max-w-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/leaves')}
        className="mb-5 text-muted-foreground hover:text-foreground px-0"
      >
        ← Back to My Leaves
      </Button>
      <h1 className="text-2xl font-bold mb-6">File Leave Request</h1>
      <Card>
        <CardContent className="p-6">
          <LeaveForm
            values={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            isPending={createLeave.isPending}
            error={errorMessage}
            balances={balances}
          />
        </CardContent>
      </Card>
    </div>
  );
}
