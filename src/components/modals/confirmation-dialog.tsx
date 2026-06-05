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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            {isDestructive && (
              <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-destructive" />
            )}
            <DialogTitle className={isDestructive ? "text-destructive" : ""}>
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>

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
