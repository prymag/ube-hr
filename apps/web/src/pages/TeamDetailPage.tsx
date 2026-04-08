import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useTeam,
  useTeamMembers,
  useUpdateTeam,
  useAddTeamMember,
  useRemoveTeamMember,
} from '../features/teams';
import { useUsers } from '../features/users';
import { Button } from '@ube-hr/ui';
import { Input } from '@ube-hr/ui';
import { Label } from '@ube-hr/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@ube-hr/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ube-hr/ui';

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const teamId = Number(id);

  const teamQuery = useTeam(teamId);
  const membersQuery = useTeamMembers(teamId);
  const usersQuery = useUsers();
  const updateTeam = useUpdateTeam(teamId);
  const addMember = useAddTeamMember(teamId);
  const removeMember = useRemoveTeamMember(teamId);

  const team = teamQuery.data;
  const members = membersQuery.data ?? [];
  const allUsers = usersQuery.data ?? [];

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [addUserId, setAddUserId] = useState('');
  const [error, setError] = useState('');
  const [addError, setAddError] = useState('');

  function startEdit() {
    if (!team) return;
    setEditName(team.name);
    setEditDesc(team.description ?? '');
    setEditing(true);
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    updateTeam.mutate(
      { name: editName.trim(), description: editDesc.trim() || undefined },
      {
        onSuccess: () => setEditing(false),
        onError: () => setError('Failed to update team.'),
      }
    );
  }

  function handleAddMember() {
    if (!addUserId) return;
    setAddError('');
    addMember.mutate(Number(addUserId), {
      onSuccess: () => setAddUserId(''),
      onError: () => setAddError('Failed to add member. They may already be in this team.'),
    });
  }

  function handleRemoveMember(userId: number) {
    removeMember.mutate(userId, {
      onError: () => setError('Failed to remove member.'),
    });
  }

  const memberIds = new Set(members.map((m) => m.id));
  const availableUsers = allUsers.filter((u) => !memberIds.has(u.id));

  const isLoading = teamQuery.isLoading || membersQuery.isLoading || usersQuery.isLoading;

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (teamQuery.isError) return <div className="text-sm text-destructive">Team not found.</div>;
  if (!team) return null;

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/teams')}
        className="mb-5 text-muted-foreground hover:text-foreground px-0"
      >
        ← Back to Teams
      </Button>

      {/* Team header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {editing ? (
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
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
                {(() => {
                  const owner = allUsers.find((u) => u.id === team.ownerId);
                  return owner ? (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Owner: <span className="text-foreground">{owner.name ?? owner.email}</span>
                    </p>
                  ) : null;
                })()}
              </div>
              <Button variant="outline" size="sm" onClick={startEdit}>
                Edit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Members{' '}
            <span className="text-muted-foreground font-normal">({members.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add member */}
          {availableUsers.length > 0 && (
            <div className="flex gap-2">
              <Select value={addUserId} onValueChange={setAddUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Add a member…" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name ? `${u.name} (${u.email})` : u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddMember} disabled={!addUserId || addMember.isPending}>
                {addMember.isPending ? 'Adding…' : 'Add'}
              </Button>
            </div>
          )}

          {addError && <p className="text-sm text-destructive">{addError}</p>}
          {error && !editing && <p className="text-sm text-destructive">{error}</p>}

          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No members yet.</p>
          ) : (
            <ul className="space-y-1">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-muted"
                >
                  <div>
                    <div className="text-sm font-medium">{member.name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
