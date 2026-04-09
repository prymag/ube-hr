import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useUsers,
  useUserTeams,
  useUpdateUser,
  useAddUserToTeam,
  useRemoveUserFromTeam,
} from '../features/users';
import { useTeams } from '../features/teams';
import { useAuth } from '../store/AuthContext';
import { ROLE_RANK, ALL_ROLES } from '../config/roles';
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

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const userId = Number(id);

  const usersQuery = useUsers();
  const teamsQuery = useTeams();
  const userTeamsQuery = useUserTeams(userId);
  const updateUser = useUpdateUser(userId);
  const addToTeam = useAddUserToTeam(userId);
  const removeFromTeam = useRemoveUserFromTeam(userId);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editError, setEditError] = useState('');
  const [addTeamId, setAddTeamId] = useState('');

  const user = usersQuery.data?.find((u) => u.id === userId);
  const allTeams = teamsQuery.data ?? [];
  const userTeams = userTeamsQuery.data ?? [];

  const callerRank = ROLE_RANK[authUser?.role ?? 'USER'] ?? 0;
  const assignableRoles = ALL_ROLES.filter((r) => ROLE_RANK[r] <= callerRank);

  const memberTeamIds = new Set(userTeams.map((t) => t.id));
  const availableTeams = allTeams.filter((t) => !memberTeamIds.has(t.id));
  const ownedTeams = allTeams.filter((t) => t.ownerId === userId);

  const isLoading = usersQuery.isLoading || teamsQuery.isLoading || userTeamsQuery.isLoading;

  function startEdit() {
    if (!user) return;
    setEditName(user.name ?? '');
    setEditRole(user.role);
    setEditError('');
    setEditing(true);
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError('');
    updateUser.mutate(
      { name: editName.trim() || undefined, role: editRole },
      {
        onSuccess: () => setEditing(false),
        onError: () => setEditError('Failed to update user.'),
      }
    );
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!user) return <div className="text-sm text-destructive">User not found.</div>;

  return (
    <div className="max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/users')}
        className="mb-5 text-muted-foreground hover:text-foreground px-0"
      >
        ← Back to Users
      </Button>

      {/* User header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {editing ? (
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Jane Doe"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editError && <p className="text-sm text-destructive">{editError}</p>}
              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending ? 'Saving…' : 'Save'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{user.name ?? user.email}</h1>
                {user.name && (
                  <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  Role:{' '}
                  <span className="text-foreground capitalize">
                    {user.role.replace('_', ' ')}
                  </span>
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={startEdit}>
                Edit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Owned teams */}
      {ownedTeams.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Owned Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {ownedTeams.map((team) => (
                <li key={team.id} className="px-3 py-2 rounded-md bg-muted text-sm">
                  {team.name}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Teams membership */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Teams <span className="text-muted-foreground font-normal">({userTeams.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableTeams.length > 0 && (
            <div className="flex gap-2">
              <Select value={addTeamId} onValueChange={setAddTeamId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Add to team…" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  if (!addTeamId) return;
                  addToTeam.mutate(Number(addTeamId), { onSuccess: () => setAddTeamId('') });
                }}
                disabled={!addTeamId || addToTeam.isPending}
              >
                {addToTeam.isPending ? 'Adding…' : 'Add'}
              </Button>
            </div>
          )}

          {addToTeam.isError && (
            <p className="text-xs text-destructive">
              Failed to add user to team. They may already be a member.
            </p>
          )}
          {removeFromTeam.isError && (
            <p className="text-xs text-destructive">Failed to remove user from team.</p>
          )}

          {userTeams.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Not in any team.</p>
          ) : (
            <ul className="space-y-1">
              {userTeams.map((team) => (
                <li
                  key={team.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-muted"
                >
                  <span className="text-sm">{team.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromTeam.mutate(team.id)}
                    disabled={removeFromTeam.isPending}
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
