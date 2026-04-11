import { useState } from 'react';
import type { AxiosError } from 'axios';
import type { Team } from '../team.types';
import { useUpdateTeam } from '../teams.queries';
import { Button } from '@ube-hr/ui';
import { Input } from '@ube-hr/ui';
import { Label } from '@ube-hr/ui';
import { Card, CardContent } from '@ube-hr/ui';

interface TeamHeaderCardProps {
  team: Team;
  ownerName?: string;
}

export function TeamHeaderCard({ team, ownerName }: TeamHeaderCardProps) {
  const updateTeam = useUpdateTeam(team.id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function startEdit() {
    setName(team.name);
    setDescription(team.description ?? '');
    setEditing(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateTeam.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      { onSuccess: () => setEditing(false) }
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {updateTeam.isError && (
              <p className="text-sm text-destructive">
                {(updateTeam.error as AxiosError<{ message: string }>)?.response?.data?.message ??
                  'Failed to update team.'}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={updateTeam.isPending}>
                {updateTeam.isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{team.name}</h1>
              {team.description && (
                <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
              )}
              {ownerName && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Owner: <span className="text-foreground">{ownerName}</span>
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={startEdit}>
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
