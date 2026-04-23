import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import {
  usePosition,
  useUpdatePosition,
  usePositions,
  PositionForm,
} from '../../features/positions';
import type { PositionFormValues } from '../../features/positions';
import { Button, Card, CardContent } from '@ube-hr/ui';

export function PositionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const posId = Number(id);

  const posQuery = usePosition(posId);
  const updatePosition = useUpdatePosition(posId);
  const pos = posQuery.data;

  const positionsQuery = usePositions({ pageSize: 1000 });
  const allPositions = positionsQuery.data?.data ?? [];

  const [form, setForm] = useState<PositionFormValues>({
    name: '',
    description: '',
    reportsToId: '',
  });

  useEffect(() => {
    if (pos) {
      setForm({
        name: pos.name,
        description: pos.description ?? '',
        reportsToId: pos.reportsToId ? String(pos.reportsToId) : '',
      });
    }
  }, [pos]);

  const error = updatePosition.isError
    ? ((updatePosition.error as AxiosError<{ message: string }>)?.response?.data
        ?.message ?? 'Failed to update position.')
    : null;

  if (posQuery.isLoading || positionsQuery.isLoading)
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (posQuery.isError || !pos)
    return <div className="text-sm text-destructive">Position not found.</div>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updatePosition.mutate({
      name: form.name.trim(),
      description: form.description.trim() || null,
      reportsToId: form.reportsToId ? Number(form.reportsToId) : null,
    });
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
      <h1 className="text-2xl font-bold mb-6">Edit Position</h1>
      <Card>
        <CardContent className="p-6">
          {updatePosition.isSuccess && (
            <p className="text-sm text-green-600 mb-3">Saved successfully.</p>
          )}
          <PositionForm
            values={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            isPending={updatePosition.isPending}
            error={error}
            submitLabel="Save Changes"
            positions={allPositions}
            currentId={posId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
