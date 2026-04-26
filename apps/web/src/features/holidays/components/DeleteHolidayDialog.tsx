import type { AxiosError } from 'axios';
import type { PublicHolidayResponse } from '@ube-hr/shared';
import { useDeleteHoliday } from '../holidays.queries';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ube-hr/ui';

interface DeleteHolidayDialogProps {
  target: PublicHolidayResponse | null;
  onClose: () => void;
}

export function DeleteHolidayDialog({
  target,
  onClose,
}: DeleteHolidayDialogProps) {
  const deleteHoliday = useDeleteHoliday();

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Holiday</DialogTitle>
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
        {deleteHoliday.isError && (
          <p className="text-sm text-destructive">
            {(deleteHoliday.error as AxiosError<{ message: string }>)?.response
              ?.data?.message ?? 'Failed to delete holiday.'}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteHoliday.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleteHoliday.isPending}
            onClick={() =>
              target && deleteHoliday.mutate(target.id, { onSuccess: onClose })
            }
          >
            {deleteHoliday.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
