import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import {
  useHoliday,
  useUpdateHoliday,
  HolidayForm,
} from '../../features/holidays';
import type { HolidayFormValues } from '../../features/holidays';
import { Button, Card, CardContent } from '@ube-hr/ui';

export function HolidayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const holidayId = Number(id);

  const holidayQuery = useHoliday(holidayId);
  const updateHoliday = useUpdateHoliday(holidayId);
  const holiday = holidayQuery.data;

  const [form, setForm] = useState<HolidayFormValues>({
    name: '',
    date: '',
    description: '',
  });

  useEffect(() => {
    if (holiday) {
      setForm({
        name: holiday.name,
        // date ISO string → date input needs YYYY-MM-DD
        date: holiday.date.slice(0, 10),
        description: holiday.description ?? '',
      });
    }
  }, [holiday]);

  const error = updateHoliday.isError
    ? ((updateHoliday.error as AxiosError<{ message: string }>)?.response?.data
        ?.message ?? 'Failed to update holiday.')
    : null;

  if (holidayQuery.isLoading)
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (holidayQuery.isError || !holiday)
    return <div className="text-sm text-destructive">Holiday not found.</div>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateHoliday.mutate({
      name: form.name.trim(),
      date: form.date,
      description: form.description.trim() || null,
    });
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
      <h1 className="text-2xl font-bold mb-6">Edit Holiday</h1>
      <Card>
        <CardContent className="p-6">
          {updateHoliday.isSuccess && (
            <p className="text-sm text-green-600 mb-3">Saved successfully.</p>
          )}
          <HolidayForm
            values={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            isPending={updateHoliday.isPending}
            error={error}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
