import { useParams, useNavigate } from 'react-router-dom';
import {
  useUser,
  useUpdateUser,
  EditUserForm,
  OwnedTeamsCard,
  UserTeamsCard,
  ProfilePicture,
  SecurityUpdateCard,
} from '../../features/users';
import type { EditUserFormValues } from '../../features/users';
import { usePositions } from '../../features/positions';
import { useDepartments } from '../../features/departments';
import { useAuth } from '../../store/AuthContext';
import { ROLE_RANK, ALL_ROLES } from '../../config/roles';
import { Button, Card, CardContent } from '@ube-hr/ui';
import { parseFormInt } from '@ube-hr/shared';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = Number(id);
  const { user: authUser } = useAuth();

  const userQuery = useUser(userId);
  const positionsQuery = usePositions({ pageSize: 1000 });
  const departmentsQuery = useDepartments({ pageSize: 1000 });
  const user = userQuery.data;
  const updateUser = useUpdateUser(userId);

  const callerRank = ROLE_RANK[authUser?.role ?? 'USER'] ?? 0;
  const assignableRoles = ALL_ROLES.filter((r) => ROLE_RANK[r] <= callerRank);
  const readOnly = (ROLE_RANK[user?.role ?? 'USER'] ?? 0) >= callerRank;

  const positions = positionsQuery.data?.data ?? [];
  const departments = departmentsQuery.data?.data ?? [];

  if (userQuery.isLoading)
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!user)
    return <div className="text-sm text-destructive">User not found.</div>;

  function handleSubmit(values: EditUserFormValues) {
    updateUser.mutate({
      name: values.name.trim() || undefined,
      role: values.role,
      profilePicture: values.profilePicture,
      positionId: parseFormInt(values.positionId),
      departmentId: parseFormInt(values.departmentId),
    });
  }

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

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold mb-4">Edit Details</h2>
          <EditUserForm
            user={user}
            assignableRoles={assignableRoles}
            positions={positions}
            departments={departments}
            isPending={updateUser.isPending}
            isError={updateUser.isError}
            readOnly={readOnly}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/users')}
          />
        </CardContent>
      </Card>

      <SecurityUpdateCard userId={userId} />

      <OwnedTeamsCard userId={userId} />
      <UserTeamsCard userId={userId} />
    </div>
  );
}
