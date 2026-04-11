import { useState } from 'react';
import { Card, CardContent } from '@ube-hr/ui';
import { Button } from '@ube-hr/ui';
import { useAuth } from '../../../store/AuthContext';
import { ROLE_RANK, ALL_ROLES } from '../../../config/roles';
import { useUpdateUser } from '../users.queries';
import { EditUserForm } from './EditUserForm';
import type { EditUserFormValues } from './EditUserForm';
import type { User } from '../user.types';

interface UserHeaderCardProps {
  user: User;
}

export function UserHeaderCard({ user }: UserHeaderCardProps) {
  const { user: authUser } = useAuth();
  const updateUser = useUpdateUser(user.id);
  const [editing, setEditing] = useState(false);

  const callerRank = ROLE_RANK[authUser?.role ?? 'USER'] ?? 0;
  const assignableRoles = ALL_ROLES.filter((r) => ROLE_RANK[r] <= callerRank);

  function handleSubmit(values: EditUserFormValues) {
    updateUser.mutate(
      { name: values.name.trim() || undefined, role: values.role },
      { onSuccess: () => setEditing(false) }
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        {editing ? (
          <EditUserForm
            user={user}
            assignableRoles={assignableRoles}
            isPending={updateUser.isPending}
            isError={updateUser.isError}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(false)}
          />
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
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
