import type { AxiosError } from 'axios';
import type { DepartmentResponse } from '@ube-hr/shared';
import { useDeleteDepartment } from '../departments.queries';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ube-hr/ui';

interface DeleteDepartmentDialogProps {
  target: DepartmentResponse | null;
  onClose: () => void;
}

export function DeleteDepartmentDialog({
  target,
  onClose,
}: DeleteDepartmentDialogProps) {
  const deleteDepartment = useDeleteDepartment();

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Department</DialogTitle>
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
        {deleteDepartment.isError && (
          <p className="text-sm text-destructive">
            {(deleteDepartment.error as AxiosError<{ message: string }>)
              ?.response?.data?.message ?? 'Failed to delete department.'}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteDepartment.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleteDepartment.isPending}
            onClick={() =>
              target &&
              deleteDepartment.mutate(target.id, { onSuccess: onClose })
            }
          >
            {deleteDepartment.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
