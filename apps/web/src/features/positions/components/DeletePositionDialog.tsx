import type { AxiosError } from 'axios';
import type { PositionResponse } from '@ube-hr/shared';
import { useDeletePosition } from '../positions.queries';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ube-hr/ui';

interface DeletePositionDialogProps {
  target: PositionResponse | null;
  onClose: () => void;
}

export function DeletePositionDialog({
  target,
  onClose,
}: DeletePositionDialogProps) {
  const deletePosition = useDeletePosition();

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Position</DialogTitle>
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
        {deletePosition.isError && (
          <p className="text-sm text-destructive">
            {(deletePosition.error as AxiosError<{ message: string }>)?.response
              ?.data?.message ?? 'Failed to delete position.'}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deletePosition.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deletePosition.isPending}
            onClick={() =>
              target && deletePosition.mutate(target.id, { onSuccess: onClose })
            }
          >
            {deletePosition.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
