import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTitle,
  DialogBody,
  DialogActions,
} from "@/components/ui/dialog";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogBody>
        <div className="flex items-start gap-4">
          {isDestructive && (
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
          )}
          <div className="flex-1">
            <DialogTitle className={isDestructive ? "text-red-900" : ""}>
              {title}
            </DialogTitle>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </div>
        </div>
      </DialogBody>
      <DialogActions>
        <Button type="button" outline onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className={
            isDestructive
              ? "bg-red-600 hover:bg-red-700 text-white"
              : ""
          }
        >
          {isLoading ? "Processing..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
