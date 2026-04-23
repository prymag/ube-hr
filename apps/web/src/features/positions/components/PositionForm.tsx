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

const UNASSIGNED = '__none__';

export interface PositionFormValues {
  name: string;
  description: string;
  reportsToId: string;
}

interface PositionOption {
  id: number;
  name: string;
}

interface PositionFormProps {
  values: PositionFormValues;
  onChange: (values: PositionFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  error?: string | null;
  submitLabel?: string;
  positions: PositionOption[];
  currentId?: number;
}

export function PositionForm({
  values,
  onChange,
  onSubmit,
  isPending,
  error,
  submitLabel = 'Save',
  positions,
  currentId,
}: PositionFormProps) {
  function set<K extends keyof PositionFormValues>(
    key: K,
    value: PositionFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  const reportsToSelectValue =
    values.reportsToId !== '' ? values.reportsToId : UNASSIGNED;

  function handleReportsToChange(val: string) {
    set('reportsToId', val === UNASSIGNED ? '' : val);
  }

  const reportsToOptions = positions.filter((p) => p.id !== currentId);

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
      <div className="space-y-1.5">
        <Label>
          Reports To{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Select value={reportsToSelectValue} onValueChange={handleReportsToChange}>
          <SelectTrigger>
            <SelectValue placeholder="No reporting line" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>— None —</SelectItem>
            {reportsToOptions.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
