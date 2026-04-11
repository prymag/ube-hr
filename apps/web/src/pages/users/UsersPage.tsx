import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers, UsersTable, DeleteUserDialog } from '../../features/users';
import type { User } from '../../features/users';
import { useAuth } from '../../store/AuthContext';
import { ROLE_RANK } from '../../config/roles';
import { Button } from '@ube-hr/ui';

export function UsersPage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const { data: users = [], isLoading } = useUsers();
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const callerRank = ROLE_RANK[authUser?.role ?? 'USER'] ?? 0;

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
        <Button onClick={() => navigate('/users/new')}>New User</Button>
      </div>

      <UsersTable
        users={users}
        callerRank={callerRank}
        onDeleteRequest={setDeleteTarget}
      />

      <DeleteUserDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
