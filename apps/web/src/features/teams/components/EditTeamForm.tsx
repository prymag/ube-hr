import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@ube-hr/ui';
import { Input } from '@ube-hr/ui';
import { Label } from '@ube-hr/ui';
import type { TeamResponse } from '@ube-hr/shared';

export interface EditTeamFormValues {
  name: string;
  description: string;
}

interface EditTeamFormProps {
  team: TeamResponse;
  isPending: boolean;
  isError: boolean;
  onSubmit: (values: EditTeamFormValues) => void;
  onCancel: () => void;
}

export function EditTeamForm({
  team,
  isPending,
  isError,
  onSubmit,
  onCancel,
}: EditTeamFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditTeamFormValues>({
    defaultValues: {
      name: team.name,
      description: team.description ?? '',
    },
  });

  useEffect(() => {
    reset({ name: team.name, description: team.description ?? '' });
  }, [team, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input
          {...register('name', { required: true })}
          type="text"
          placeholder="e.g. Engineering"
          autoFocus
        />
        {errors.name && (
          <p className="text-sm text-destructive">Name is required.</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>
          Description{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          {...register('description')}
          type="text"
          placeholder="What is this team for?"
        />
      </div>
      {isError && (
        <p className="text-sm text-destructive">Failed to update team.</p>
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
