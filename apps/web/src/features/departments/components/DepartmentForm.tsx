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

export interface DepartmentFormValues {
  name: string;
  description: string;
  headId: string;
}

interface UserOption {
  id: number;
  name: string | null;
}

interface DepartmentFormProps {
  values: DepartmentFormValues;
  onChange: (values: DepartmentFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  error?: string | null;
  submitLabel?: string;
  users: UserOption[];
}

export function DepartmentForm({
  values,
  onChange,
  onSubmit,
  isPending,
  error,
  submitLabel = 'Save',
  users,
}: DepartmentFormProps) {
  function set<K extends keyof DepartmentFormValues>(
    key: K,
    value: DepartmentFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  const headSelectValue = values.headId !== '' ? values.headId : UNASSIGNED;

  function handleHeadChange(val: string) {
    set('headId', val === UNASSIGNED ? '' : val);
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
          placeholder="What is this department for?"
        />
      </div>
      <div className="space-y-1.5">
        <Label>
          Department Head{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Select value={headSelectValue} onValueChange={handleHeadChange}>
          <SelectTrigger>
            <SelectValue placeholder="No head assigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>— None —</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.name ?? u.id}
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
