import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field, Label } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useDeleteDeployment } from "@/lib/api/hooks/use-delete-deployment";
import type { Deployment } from "@/types/deployment";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface DeleteDeploymentDialogProps {
  open: boolean;
  onClose: () => void;
  deployment: Deployment | null;
  projectId: string;
}

export function DeleteDeploymentDialog({
  open,
  onClose,
  deployment,
  projectId,
}: DeleteDeploymentDialogProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const deleteDeploymentMutation = useDeleteDeployment();

  const isLoading = deleteDeploymentMutation.isPending;
  const expectedText = deployment?.mode === "production" 
    ? `delete production deployment`
    : `delete staging deployment`;
  const isConfirmationValid = confirmationText.toLowerCase() === expectedText.toLowerCase();

  const handleDelete = async () => {
    if (!deployment || !isConfirmationValid) return;

    try {
      await deleteDeploymentMutation.mutateAsync({
        projectId,
        deploymentId: deployment.id,
      });
      onClose();
      setConfirmationText("");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
    setConfirmationText("");
  };

  if (!deployment) return null;

  const isProduction = deployment.mode === "production";

  return (
    <Dialog open={open} onClose={handleClose} size="lg">
      <DialogTitle className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        Delete {deployment.mode} deployment
      </DialogTitle>
      
      <DialogBody className="space-y-6">
        <DialogDescription>
          This action will permanently delete the <strong>{deployment.mode}</strong> deployment and all associated data.
        </DialogDescription>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Warning: This action cannot be undone
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>All users, organizations, and workspaces will be deleted</li>
                  <li>All authentication settings and configurations will be lost</li>
                  <li>All AI agents, workflows, tools, and knowledge bases will be deleted</li>
                  <li>All sessions and user data will be permanently removed</li>
                  {isProduction && (
                    <>
                      <li>Custom domain configuration will be removed</li>
                      <li>DNS records and email settings will be cleaned up</li>
                      <li>External integrations (Cloudflare, Postmark) will be disconnected</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Field>
          <Label>
            Type <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">
              {expectedText}
            </code> to confirm deletion
          </Label>
          <Input
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder={expectedText}
            disabled={isLoading}
            className={confirmationText && !isConfirmationValid ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
          />
          {confirmationText && !isConfirmationValid && (
            <Text className="text-sm text-red-600 dark:text-red-400 mt-1">
              Please type the exact text to confirm deletion
            </Text>
          )}
        </Field>

        {deployment.mode === "production" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/10">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Production Deployment Notice
                </h3>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  This is a production deployment with custom domain <strong>{deployment.frontend_host}</strong>. 
                  Deleting it will make your application inaccessible to users and may affect your business operations.
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogBody>

      <DialogActions>
        <Button outline onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          color="red"
          onClick={handleDelete}
          disabled={!isConfirmationValid || isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? "Deleting..." : `Delete ${deployment.mode}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
