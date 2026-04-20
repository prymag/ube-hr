import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import {
  useCreateDepartment,
  DepartmentForm,
} from '../../features/departments';
import type { DepartmentFormValues } from '../../features/departments';
import { useUsers } from '../../features/users';
import { Button, Card, CardContent } from '@ube-hr/ui';

const EMPTY_FORM: DepartmentFormValues = {
  name: '',
  description: '',
  headId: '',
};

export function CreateDepartmentPage() {
  const navigate = useNavigate();
  const createDepartment = useCreateDepartment();
  const [form, setForm] = useState<DepartmentFormValues>(EMPTY_FORM);
  const usersQuery = useUsers({ pageSize: 1000 });
  const users = usersQuery.data?.data ?? [];

  const error = createDepartment.isError
    ? ((createDepartment.error as AxiosError<{ message: string }>)?.response
        ?.data?.message ??
      'Failed to create department. Name may already be taken.')
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createDepartment.mutate(
      {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        headId: form.headId ? Number(form.headId) : undefined,
      },
      { onSuccess: () => navigate('/departments') },
    );
  }

  return (
    <div className="max-w-md">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/departments')}
        className="mb-5 text-muted-foreground hover:text-foreground px-0"
      >
        ← Back to Departments
      </Button>
      <h1 className="text-2xl font-bold mb-6">New Department</h1>
      <Card>
        <CardContent className="p-6">
          <DepartmentForm
            values={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            isPending={createDepartment.isPending}
            error={error}
            submitLabel="Create Department"
            users={users}
          />
        </CardContent>
      </Card>
    </div>
  );
}
