import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { useCreateTeam, CreateTeamForm } from '../../features/teams';
import type { CreateTeamFormValues } from '../../features/teams';
import { Button, Card, CardContent } from '@ube-hr/ui';

const EMPTY_FORM: CreateTeamFormValues = { name: '', description: '' };

export function CreateTeamPage() {
  const navigate = useNavigate();
  const createTeam = useCreateTeam();
  const [form, setForm] = useState<CreateTeamFormValues>(EMPTY_FORM);

  const error = createTeam.isError
    ? ((createTeam.error as AxiosError<{ message: string }>)?.response?.data?.message ??
      'Failed to create team. Name may already be taken.')
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createTeam.mutate(
      { name: form.name.trim(), description: form.description.trim() || undefined },
      { onSuccess: () => navigate('/teams') },
    );
  }

  return (
    <div className="max-w-md">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/teams')}
        className="mb-5 text-muted-foreground hover:text-foreground px-0"
      >
        ← Back to Teams
      </Button>
      <h1 className="text-2xl font-bold mb-6">New Team</h1>
      <Card>
        <CardContent className="p-6">
          <CreateTeamForm
            values={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            isPending={createTeam.isPending}
            error={error}
          />
        </CardContent>
      </Card>
    </div>
  );
}
