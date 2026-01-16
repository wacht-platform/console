import { Button } from "../ui/button";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from "../ui/dialog";
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
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-4">
            {isDestructive && (
              <div className="flex-shrink-0 mt-0.5">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-500" />
              </div>
            )}
            <div className="flex-1">
              <DialogTitle className={isDestructive ? "text-red-900 dark:text-red-400" : ""}>
                {title}
              </DialogTitle>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            variant={isDestructive ? "destructive" : "default"}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
