import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeams, useCreateTeam, useDeleteTeam } from '../features/teams';
import type { Team } from '../features/teams';
import { Button } from '@ube-hr/ui';
import { Input } from '@ube-hr/ui';
import { Label } from '@ube-hr/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@ube-hr/ui';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ube-hr/ui';

export function TeamsPage() {
  const navigate = useNavigate();
  const { data: teams = [], isLoading } = useTeams();
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    createTeam.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          setShowCreate(false);
        },
        onError: () => setError('Failed to create team. Name may already be taken.'),
      }
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteTeam.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: () => setError('Failed to delete team.'),
    });
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading teams…</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{teams.length} total</p>
        </div>
        <Button onClick={() => { setShowCreate(true); setError(''); }}>New team</Button>
      </div>

      {error && <p className="text-sm text-destructive mb-4">{error}</p>}

      {/* Teams list */}
      {teams.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No teams yet. Create one to get started.
        </div>
      ) : (
        <Card>
          {teams.map((team, i) => (
            <div
              key={team.id}
              className={`flex items-center justify-between px-5 py-4 ${
                i < teams.length - 1 ? 'border-b' : ''
              }`}
            >
              <button
                onClick={() => navigate(`/teams/${team.id}`)}
                className="flex-1 text-left group"
              >
                <div className="font-medium group-hover:text-primary transition-colors">
                  {team.name}
                </div>
                {team.description && (
                  <div className="text-sm text-muted-foreground mt-0.5">{team.description}</div>
                )}
              </button>
              <div className="flex items-center gap-2 ml-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/teams/${team.id}`)}>
                  Manage
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(team)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Create team dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create team</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Engineering"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this team for?"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTeam.isPending}>
                {createTeam.isPending ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <p className="text-sm">
              Are you sure you want to delete{' '}
              <span className="font-medium">{deleteTarget?.name}</span>?
            </p>
            <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteTeam.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteTeam.isPending}>
              {deleteTeam.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
