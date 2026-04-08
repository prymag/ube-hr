import { useState } from 'react';
import {
  useUsers,
  useUserTeams,
  useCreateUser,
  useDeleteUser,
  useAddUserToTeam,
  useRemoveUserFromTeam,
} from '../features/users';
import type { User } from '../features/users';
import { useTeams } from '../features/teams';
import { useAuth } from '../store/AuthContext';
import { ROLE_RANK, ALL_ROLES, ROLE_BADGE, STATUS_BADGE } from '../config/roles';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ube-hr/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ube-hr/ui';
import { cn } from '@ube-hr/ui';

interface CreateForm {
  email: string;
  password: string;
  name: string;
  role: string;
}

const EMPTY_FORM: CreateForm = { email: '', password: '', name: '', role: 'USER' };

export function UsersPage() {
  const { user: authUser } = useAuth();

  const { data: users = [], isLoading } = useUsers();
  const { data: allTeams = [] } = useTeams();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [addTeamId, setAddTeamId] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const { data: userTeams = [], isFetching: panelLoading } = useUserTeams(selectedUser?.id);

  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const addToTeam = useAddUserToTeam(selectedUser?.id ?? null);
  const removeFromTeam = useRemoveUserFromTeam(selectedUser?.id ?? null);

  const callerRank = ROLE_RANK[authUser?.role ?? 'USER'] ?? 0;
  const assignableRoles = ALL_ROLES.filter((r) => ROLE_RANK[r] <= callerRank);

  const memberTeamIds = new Set(userTeams.map((t) => t.id));
  const availableTeams = allTeams.filter((t) => !memberTeamIds.has(t.id));
  const ownedTeams = selectedUser ? allTeams.filter((t) => t.ownerId === selectedUser.id) : [];

  function openCreate() {
    setForm({ ...EMPTY_FORM, role: assignableRoles[0] ?? 'USER' });
    setShowCreate(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createUser.mutate(
      { email: form.email, password: form.password, name: form.name || undefined, role: form.role },
      {
        onSuccess: () => { setShowCreate(false); setForm(EMPTY_FORM); },
      },
    );
  }

  async function handleAddToTeam() {
    if (!addTeamId) return;
    addToTeam.mutate(Number(addTeamId), {
      onSuccess: () => setAddTeamId(''),
    });
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading users…</div>;
  }

  return (
    <div className="flex gap-6 h-full">
      {/* User list */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{users.length} total</p>
          </div>
          <Button onClick={openCreate}>New User</Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name / Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  onClick={() => { setSelectedUser(user); setAddTeamId(''); }}
                  className={cn(
                    'cursor-pointer',
                    selectedUser?.id === user.id && 'bg-muted'
                  )}
                >
                  <TableCell>
                    <div className="font-medium">{user.name ?? '—'}</div>
                    <div className="text-muted-foreground text-xs">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ROLE_BADGE[user.role] ?? ROLE_BADGE.USER}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[user.status] ?? STATUS_BADGE.ACTIVE}`}>
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {(callerRank >= ROLE_RANK['SUPER_ADMIN'] || callerRank > ROLE_RANK[user.role]) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(user); }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Delete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Side panel */}
      {selectedUser && (
        <div className="w-80 shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-base truncate">
                    {selectedUser.name ?? selectedUser.email}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedUser.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedUser(null)}
                  className="shrink-0 h-6 w-6 text-muted-foreground"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {ownedTeams.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Owned Teams
                  </h3>
                  <ul className="space-y-1">
                    {ownedTeams.map((team) => (
                      <li key={team.id} className="px-3 py-2 rounded-md bg-muted text-sm">
                        {team.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Teams
                </h3>

                {addToTeam.isError && (
                  <p className="text-xs text-destructive mb-2">
                    Failed to add user to team. They may already be a member.
                  </p>
                )}
                {removeFromTeam.isError && (
                  <p className="text-xs text-destructive mb-2">Failed to remove user from team.</p>
                )}

                {panelLoading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : userTeams.length === 0 ? (
                  <p className="text-sm text-muted-foreground mb-3">Not in any team.</p>
                ) : (
                  <ul className="space-y-1 mb-3">
                    {userTeams.map((team) => (
                      <li
                        key={team.id}
                        className="flex items-center justify-between px-3 py-2 rounded-md bg-muted"
                      >
                        <span className="text-sm">{team.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromTeam.mutate(team.id)}
                          disabled={removeFromTeam.isPending}
                          className="h-auto py-0.5 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}

                {availableTeams.length > 0 && (
                  <div className="flex gap-2 mt-3">
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
                      onClick={handleAddToTeam}
                      disabled={!addTeamId || addToTeam.isPending}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create user dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New User</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 characters"
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Name <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Jane Doe"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(value) => setForm((f) => ({ ...f, role: value }))}
              >
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

            {createUser.isError && (
              <p className="text-sm text-destructive">
                {(createUser.error as any)?.response?.data?.message ?? 'Failed to create user.'}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? 'Creating…' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <p className="text-sm text-foreground">
              Are you sure you want to delete{' '}
              <span className="font-medium">{deleteTarget?.name ?? deleteTarget?.email}</span>?
            </p>
            <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
          </div>
          {deleteUser.isError && (
            <p className="text-sm text-destructive">
              {(deleteUser.error as any)?.response?.data?.message ?? 'Failed to delete user.'}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteUser.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteUser.isPending}
              onClick={() =>
                deleteTarget &&
                deleteUser.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    if (selectedUser?.id === deleteTarget.id) setSelectedUser(null);
                    setDeleteTarget(null);
                  },
                })
              }
            >
              {deleteUser.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
