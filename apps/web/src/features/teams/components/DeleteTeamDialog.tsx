import type { AxiosError } from 'axios';
import type { TeamResponse } from '@ube-hr/shared';
import { useDeleteTeam } from '../teams.queries';
import { Button } from '@ube-hr/ui';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ube-hr/ui';

interface DeleteTeamDialogProps {
  target: TeamResponse | null;
  onClose: () => void;
}

export function DeleteTeamDialog({ target, onClose }: DeleteTeamDialogProps) {
  const deleteTeam = useDeleteTeam();

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Team</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          <p className="text-sm">
            Are you sure you want to delete{' '}
            <span className="font-medium">{target?.name}</span>?
          </p>
          <p className="text-xs text-muted-foreground">
            This action cannot be undone.
          </p>
        </div>
        {deleteTeam.isError && (
          <p className="text-sm text-destructive">
            {(deleteTeam.error as AxiosError<{ message: string }>)?.response
              ?.data?.message ?? 'Failed to delete team.'}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteTeam.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleteTeam.isPending}
            onClick={() =>
              target &&
              deleteTeam.mutate(target.id, {
                onSuccess: onClose,
              })
            }
          >
            {deleteTeam.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
