import {
  Dialog,
  DialogTitle,
  DialogBody,
  DialogActions,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  isLoading?: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Delete",
  isLoading = false,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle className="text-red-600">{title}</DialogTitle>

      <DialogBody>
        <p className="text-gray-600">{description}</p>
      </DialogBody>

      <DialogActions>
        <Button type="button" outline onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="button"
          color="red"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? "Deleting..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
