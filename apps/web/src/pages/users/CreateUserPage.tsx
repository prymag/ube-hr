import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { useCreateUser, CreateUserForm } from '../../features/users';
import type { CreateUserFormValues } from '../../features/users';
import { useAuth } from '../../store/AuthContext';
import { ROLE_RANK, ALL_ROLES } from '../../config/roles';
import { Button, Card, CardContent } from '@ube-hr/ui';

const EMPTY_FORM: CreateUserFormValues = { email: '', password: '', name: '', role: 'USER' };

export function CreateUserPage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const createUser = useCreateUser();
  const [form, setForm] = useState<CreateUserFormValues>(EMPTY_FORM);

  const callerRank = ROLE_RANK[authUser?.role ?? 'USER'] ?? 0;
  const assignableRoles = ALL_ROLES.filter((r) => ROLE_RANK[r] <= callerRank);

  const error = createUser.isError
    ? ((createUser.error as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Failed to create user.')
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createUser.mutate(
      { email: form.email, password: form.password, name: form.name || undefined, role: form.role },
      { onSuccess: () => navigate('/users') },
    );
  }

  return (
    <div className="max-w-md">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/users')}
        className="mb-5 text-muted-foreground hover:text-foreground px-0"
      >
        ← Back to Users
      </Button>
      <h1 className="text-2xl font-bold mb-6">New User</h1>
      <Card>
        <CardContent className="p-6">
          <CreateUserForm
            values={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            assignableRoles={assignableRoles}
            isPending={createUser.isPending}
            error={error}
          />
        </CardContent>
      </Card>
    </div>
  );
}
