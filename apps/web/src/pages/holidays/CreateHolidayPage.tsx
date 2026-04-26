import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { useCreateHoliday, HolidayForm } from '../../features/holidays';
import type { HolidayFormValues } from '../../features/holidays';
import { Button, Card, CardContent } from '@ube-hr/ui';

const EMPTY_FORM: HolidayFormValues = {
  name: '',
  date: '',
  description: '',
};

export function CreateHolidayPage() {
  const navigate = useNavigate();
  const createHoliday = useCreateHoliday();
  const [form, setForm] = useState<HolidayFormValues>(EMPTY_FORM);

  const error = createHoliday.isError
    ? ((createHoliday.error as AxiosError<{ message: string }>)?.response?.data
        ?.message ?? 'Failed to create holiday.')
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createHoliday.mutate(
      {
        name: form.name.trim(),
        date: form.date,
        description: form.description.trim() || undefined,
      },
      { onSuccess: () => navigate('/admin/holidays') },
    );
  }

  return (
    <div className="max-w-md">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/admin/holidays')}
        className="mb-5 text-muted-foreground hover:text-foreground px-0"
      >
        ← Back to Holidays
      </Button>
      <h1 className="text-2xl font-bold mb-6">New Holiday</h1>
      <Card>
        <CardContent className="p-6">
          <HolidayForm
            values={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            isPending={createHoliday.isPending}
            error={error}
            submitLabel="Create Holiday"
          />
        </CardContent>
      </Card>
    </div>
  );
}
