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

export interface CreateUserFormValues {
  email: string;
  password: string;
  name: string;
  role: string;
}

interface CreateUserFormProps {
  values: CreateUserFormValues;
  onChange: (values: CreateUserFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  assignableRoles: string[];
  isPending: boolean;
  error?: string | null;
}

export function CreateUserForm({
  values,
  onChange,
  onSubmit,
  assignableRoles,
  isPending,
  error,
}: CreateUserFormProps) {
  function set<K extends keyof CreateUserFormValues>(
    key: K,
    value: CreateUserFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input
          type="email"
          required
          value={values.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="user@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Password</Label>
        <Input
          type="password"
          required
          minLength={8}
          value={values.password}
          onChange={(e) => set('password', e.target.value)}
          placeholder="Min. 8 characters"
        />
      </div>
      <div className="space-y-1.5">
        <Label>
          Name{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          type="text"
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Jane Doe"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Role</Label>
        <Select
          value={values.role}
          onValueChange={(value) => set('role', value)}
        >
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
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="pt-1">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating…' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
