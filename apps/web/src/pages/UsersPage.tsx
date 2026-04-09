import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers, useDeleteUser } from '../features/users';
import type { User } from '../features/users';
import { useAuth } from '../store/AuthContext';
import { ROLE_RANK, ALL_ROLES, ROLE_BADGE, STATUS_BADGE } from '../config/roles';
import { useCreateUser } from '../features/users';
import { Button } from '@ube-hr/ui';
import { Input } from '@ube-hr/ui';
import { Label } from '@ube-hr/ui';
import { Card } from '@ube-hr/ui';
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

interface CreateForm {
  email: string;
  password: string;
  name: string;
  role: string;
}

const EMPTY_FORM: CreateForm = { email: '', password: '', name: '', role: 'USER' };

export function UsersPage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const { data: users = [], isLoading } = useUsers();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const callerRank = ROLE_RANK[authUser?.role ?? 'USER'] ?? 0;
  const assignableRoles = ALL_ROLES.filter((r) => ROLE_RANK[r] <= callerRank);

  function openCreate() {
    setForm({ ...EMPTY_FORM, role: assignableRoles[0] ?? 'USER' });
    setShowCreate(true);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createUser.mutate(
      { email: form.email, password: form.password, name: form.name || undefined, role: form.role },
      { onSuccess: () => { setShowCreate(false); setForm(EMPTY_FORM); } },
    );
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading users…</div>;
  }

  return (
    <div>
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
                onClick={() => navigate(`/users/${user.id}`)}
                className="cursor-pointer"
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
            <p className="text-sm">
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
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteUser.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteUser.isPending}
              onClick={() =>
                deleteTarget &&
                deleteUser.mutate(deleteTarget.id, {
                  onSuccess: () => setDeleteTarget(null),
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
