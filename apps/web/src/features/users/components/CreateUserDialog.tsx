import { useState } from 'react';
import type { AxiosError } from 'axios';
import { useCreateUser } from '../users.queries';
import { Button } from '@ube-hr/ui';
import { Input } from '@ube-hr/ui';
import { Label } from '@ube-hr/ui';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ube-hr/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ube-hr/ui';

interface CreateForm {
  email: string;
  password: string;
  name: string;
  role: string;
}

const EMPTY_FORM: CreateForm = { email: '', password: '', name: '', role: 'USER' };

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  assignableRoles: string[];
}

export function CreateUserDialog({ open, onClose, assignableRoles }: CreateUserDialogProps) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const createUser = useCreateUser();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createUser.mutate(
      { email: form.email, password: form.password, name: form.name || undefined, role: form.role },
      { onSuccess: () => { onClose(); setForm(EMPTY_FORM); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="user@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Min. 8 characters"
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Name <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(value) => setForm((f) => ({ ...f, role: value }))}
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
          {createUser.isError && (
            <p className="text-sm text-destructive">
              {(createUser.error as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Failed to create user.'}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? 'Creating…' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
