import { useState } from 'react';
import type { AxiosError } from 'axios';
import { useCreateTeam } from '../teams.queries';
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

interface CreateTeamDialogProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY = { name: '', description: '' };

export function CreateTeamDialog({ open, onClose }: CreateTeamDialogProps) {
  const [form, setForm] = useState(EMPTY);
  const createTeam = useCreateTeam();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createTeam.mutate(
      { name: form.name.trim(), description: form.description.trim() || undefined },
      {
        onSuccess: () => {
          onClose();
          setForm(EMPTY);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Engineering"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What is this team for?"
            />
          </div>
          {createTeam.isError && (
            <p className="text-sm text-destructive">
              {(createTeam.error as AxiosError<{ message: string }>)?.response?.data?.message ??
                'Failed to create team. Name may already be taken.'}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTeam.isPending}>
              {createTeam.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
