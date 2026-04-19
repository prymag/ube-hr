import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@ube-hr/ui';
import { Input } from '@ube-hr/ui';
import { Label } from '@ube-hr/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ube-hr/ui';
import type { UserResponse } from '@ube-hr/shared';

export interface EditUserFormValues {
  name: string;
  role: string;
}

interface EditUserFormProps {
  user: UserResponse;
  assignableRoles: string[];
  isPending: boolean;
  isError: boolean;
  onSubmit: (values: EditUserFormValues) => void;
  onCancel: () => void;
}

export function EditUserForm({
  user,
  assignableRoles,
  isPending,
  isError,
  onSubmit,
  onCancel,
}: EditUserFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditUserFormValues>({
    defaultValues: {
      name: user.name ?? '',
      role: user.role,
    },
  });

  useEffect(() => {
    reset({ name: user.name ?? '', role: user.role });
  }, [user, reset]);

  const role = watch('role');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input
          {...register('name')}
          type="text"
          placeholder="Jane Doe"
          autoFocus
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Role</Label>
        <Select value={role} onValueChange={(val) => setValue('role', val)}>
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

      {isError && (
        <p className="text-sm text-destructive">Failed to update user.</p>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
