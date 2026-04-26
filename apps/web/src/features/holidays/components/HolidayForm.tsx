import { Button, Input, Label } from '@ube-hr/ui';

export interface HolidayFormValues {
  name: string;
  date: string;
  description: string;
}

interface HolidayFormProps {
  values: HolidayFormValues;
  onChange: (values: HolidayFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  error?: string | null;
  submitLabel?: string;
}

export function HolidayForm({
  values,
  onChange,
  onSubmit,
  isPending,
  error,
  submitLabel = 'Save',
}: HolidayFormProps) {
  function set<K extends keyof HolidayFormValues>(
    key: K,
    value: HolidayFormValues[K],
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
          placeholder="e.g. New Year's Day"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label>Date</Label>
        <Input
          type="date"
          required
          value={values.date}
          onChange={(e) => set('date', e.target.value)}
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
          placeholder="Brief description"
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
