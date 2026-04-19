import { Button } from '@ube-hr/ui';
import { Input } from '@ube-hr/ui';
import { Label } from '@ube-hr/ui';

export interface CreateTeamFormValues {
  name: string;
  description: string;
}

interface CreateTeamFormProps {
  values: CreateTeamFormValues;
  onChange: (values: CreateTeamFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  error?: string | null;
}

export function CreateTeamForm({
  values,
  onChange,
  onSubmit,
  isPending,
  error,
}: CreateTeamFormProps) {
  function set<K extends keyof CreateTeamFormValues>(
    key: K,
    value: CreateTeamFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input
          type="text"
          required
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Engineering"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label>
          Description{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          type="text"
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="What is this team for?"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="pt-1">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating…' : 'Create Team'}
        </Button>
      </div>
    </form>
  );
}
