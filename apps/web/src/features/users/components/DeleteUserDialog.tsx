import type { AxiosError } from 'axios';
import type { User } from '../user.types';
import { useDeleteUser } from '../users.queries';
import { Button } from '@ube-hr/ui';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ube-hr/ui';

interface DeleteUserDialogProps {
  target: User | null;
  onClose: () => void;
}

export function DeleteUserDialog({ target, onClose }: DeleteUserDialogProps) {
  const deleteUser = useDeleteUser();

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          <p className="text-sm">
            Are you sure you want to delete{' '}
            <span className="font-medium">{target?.name ?? target?.email}</span>?
          </p>
          <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
        </div>
        {deleteUser.isError && (
          <p className="text-sm text-destructive">
            {(deleteUser.error as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Failed to delete user.'}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleteUser.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleteUser.isPending}
            onClick={() =>
              target &&
              deleteUser.mutate(target.id, {
                onSuccess: onClose,
              })
            }
          >
            {deleteUser.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
