import { useState } from 'react';
import { useUsers, UsersTable, CreateUserDialog, DeleteUserDialog } from '../../features/users';
import type { User } from '../../features/users';
import { useAuth } from '../../store/AuthContext';
import { ROLE_RANK, ALL_ROLES } from '../../config/roles';
import { Button } from '@ube-hr/ui';

export function UsersPage() {
  const { user: authUser } = useAuth();

  const { data: users = [], isLoading } = useUsers();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const callerRank = ROLE_RANK[authUser?.role ?? 'USER'] ?? 0;
  const assignableRoles = ALL_ROLES.filter((r) => ROLE_RANK[r] <= callerRank);

  function openCreate() {
    setShowCreate(true);
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

      <UsersTable
        users={users}
        callerRank={callerRank}
        onDeleteRequest={setDeleteTarget}
      />

      <CreateUserDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        assignableRoles={assignableRoles}
      />

      <DeleteUserDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
