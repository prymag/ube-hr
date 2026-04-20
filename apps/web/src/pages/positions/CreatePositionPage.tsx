import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { useCreatePosition, PositionForm } from '../../features/positions';
import type { PositionFormValues } from '../../features/positions';
import { Button, Card, CardContent } from '@ube-hr/ui';

const EMPTY_FORM: PositionFormValues = {
  name: '',
  description: '',
};

export function CreatePositionPage() {
  const navigate = useNavigate();
  const createPosition = useCreatePosition();
  const [form, setForm] = useState<PositionFormValues>(EMPTY_FORM);

  const error = createPosition.isError
    ? ((createPosition.error as AxiosError<{ message: string }>)?.response?.data
        ?.message ?? 'Failed to create position.')
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createPosition.mutate(
      {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      },
      { onSuccess: () => navigate('/positions') },
    );
  }

  return (
    <div className="max-w-md">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/positions')}
        className="mb-5 text-muted-foreground hover:text-foreground px-0"
      >
        ← Back to Positions
      </Button>
      <h1 className="text-2xl font-bold mb-6">New Position</h1>
      <Card>
        <CardContent className="p-6">
          <PositionForm
            values={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            isPending={createPosition.isPending}
            error={error}
            submitLabel="Create Position"
          />
        </CardContent>
      </Card>
    </div>
  );
}
