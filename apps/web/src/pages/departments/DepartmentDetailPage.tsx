import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import {
  useDepartment,
  useUpdateDepartment,
  DepartmentForm,
} from '../../features/departments';
import type { DepartmentFormValues } from '../../features/departments';
import { useUsers } from '../../features/users';
import { Button, Card, CardContent } from '@ube-hr/ui';

export function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const deptId = Number(id);

  const deptQuery = useDepartment(deptId);
  const updateDepartment = useUpdateDepartment(deptId);
  const dept = deptQuery.data;
  const usersQuery = useUsers({ pageSize: 1000 });
  const users = usersQuery.data?.data ?? [];

  const [form, setForm] = useState<DepartmentFormValues>({
    name: '',
    description: '',
    headId: '',
  });

  useEffect(() => {
    if (dept) {
      setForm({
        name: dept.name,
        description: dept.description ?? '',
        headId: dept.headId ? String(dept.headId) : '',
      });
    }
  }, [dept]);

  const error = updateDepartment.isError
    ? ((updateDepartment.error as AxiosError<{ message: string }>)?.response
        ?.data?.message ?? 'Failed to update department.')
    : null;

  if (deptQuery.isLoading || usersQuery.isLoading)
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (deptQuery.isError || !dept)
    return (
      <div className="text-sm text-destructive">Department not found.</div>
    );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateDepartment.mutate({
      name: form.name.trim(),
      description: form.description.trim() || null,
      headId: form.headId ? Number(form.headId) : null,
    });
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
      <h1 className="text-2xl font-bold mb-6">Edit Department</h1>
      <Card>
        <CardContent className="p-6">
          {updateDepartment.isSuccess && (
            <p className="text-sm text-green-600 mb-3">Saved successfully.</p>
          )}
          <DepartmentForm
            values={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            isPending={updateDepartment.isPending}
            error={error}
            submitLabel="Save Changes"
            users={users}
          />
        </CardContent>
      </Card>
    </div>
  );
}
