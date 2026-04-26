import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ube-hr/ui';
import { ProfilePicture } from './ProfilePicture';
import type { UserResponse } from '@ube-hr/shared';

export interface EditUserFormValues {
  name: string;
  role: string;
  profilePicture?: File | null;
  positionId: string;
  departmentId: string;
}

interface SelectOption {
  id: number;
  name: string;
}

interface EditUserFormProps {
  user: UserResponse;
  assignableRoles: string[];
  positions: SelectOption[];
  departments: SelectOption[];
  isPending: boolean;
  isError: boolean;
  readOnly?: boolean;
  onSubmit: (values: EditUserFormValues) => void;
  onCancel: () => void;
}

const UNASSIGNED = '__none__';

export function EditUserForm({
  user,
  assignableRoles,
  positions,
  departments,
  isPending,
  isError,
  readOnly = false,
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
      positionId:
        user.positionId != null ? String(user.positionId) : UNASSIGNED,
      departmentId:
        user.departmentId != null ? String(user.departmentId) : UNASSIGNED,
    },
  });

  useEffect(() => {
    reset({
      name: user.name ?? '',
      role: user.role,
      positionId:
        user.positionId != null ? String(user.positionId) : UNASSIGNED,
      departmentId:
        user.departmentId != null ? String(user.departmentId) : UNASSIGNED,
    });
  }, [user, reset]);

  const role = watch('role');
  const positionId = watch('positionId');
  const departmentId = watch('departmentId');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex justify-center">
        <ProfilePicture
          url={user.profilePicture}
          onUpload={(file) => setValue('profilePicture', file)}
          onRemove={() => setValue('profilePicture', null)}
          isPending={isPending}
          disabled={readOnly}
        />
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input
            {...register('name')}
            type="text"
            placeholder="Jane Doe"
            autoFocus
            disabled={readOnly}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(val) => setValue('role', val)} disabled={readOnly}>
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

        <div className="space-y-1.5">
          <Label>
            Position{' '}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Select
            value={positionId}
            onValueChange={(val) => setValue('positionId', val)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="No position assigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>— None —</SelectItem>
              {positions.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>
            Department{' '}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Select
            value={departmentId}
            onValueChange={(val) => setValue('departmentId', val)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="No department assigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>— None —</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Failed to update user.</p>
      )}

      <div className="flex gap-2 pt-1">
        {!readOnly && (
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
