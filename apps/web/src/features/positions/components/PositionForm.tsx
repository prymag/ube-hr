import { Button, Input, Label } from '@ube-hr/ui';

export interface PositionFormValues {
  name: string;
  description: string;
}

interface PositionFormProps {
  values: PositionFormValues;
  onChange: (values: PositionFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  error?: string | null;
  submitLabel?: string;
}

export function PositionForm({
  values,
  onChange,
  onSubmit,
  isPending,
  error,
  submitLabel = 'Save',
}: PositionFormProps) {
  function set<K extends keyof PositionFormValues>(
    key: K,
    value: PositionFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input
          type="text"
          required
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Software Engineer"
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
          placeholder="Role responsibilities"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="pt-1">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
