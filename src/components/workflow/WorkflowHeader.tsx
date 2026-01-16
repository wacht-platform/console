import { useState, useEffect } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import { Button } from "../ui/button";
import { Heading } from "../ui/heading";
import { Field, FieldGroup, Fieldset, Label } from "../ui/fieldset";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import type { WorkflowFormData } from "../../types/workflow";
import type { ValidationError } from "../../lib/utils/workflow-validation";

interface WorkflowHeaderProps {
  workflowData: WorkflowFormData;
  onWorkflowDataChange: (data: WorkflowFormData) => void;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  validationErrors: ValidationError[];
  fieldErrors: Record<string, string>;
  onFieldChange: (fieldName: string, value: unknown) => void;
  hasAttemptedSave?: boolean;
}

export default function WorkflowHeader({
  workflowData,
  onWorkflowDataChange,
  isEditing,
  onSave,
  onCancel,
  isSaving,
  validationErrors,
  fieldErrors,
  onFieldChange,
  hasAttemptedSave = false,
}: WorkflowHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempWorkflowData, setTempWorkflowData] = useState<WorkflowFormData>(workflowData);

  // Sync tempWorkflowData when workflowData changes
  useEffect(() => {
    setTempWorkflowData(workflowData);
  }, [workflowData]);

  const handleEditClick = () => {
    setTempWorkflowData(workflowData); // Initialize with current data
    setIsDialogOpen(true);
  };

  const handleSaveDetails = () => {
    // Validate before closing
    const hasErrors = Object.values(fieldErrors).some(error => error);
    if (!hasErrors) {
      onWorkflowDataChange(tempWorkflowData); // Apply changes
      setIsDialogOpen(false);
    }
  };

  const handleCancelDetails = () => {
    setTempWorkflowData(workflowData); // Reset to original data
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between pb-6">
        <div className="flex items-center gap-3">
          <Heading className="text-xl">
            {workflowData.name || "Untitled Workflow"}
          </Heading>
          <PencilIcon onClick={handleEditClick} className="w-4 h-4 mr-1" />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Button
              onClick={validationErrors.length > 0 && hasAttemptedSave ? () => {
                // Scroll to validation errors if they exist
                const errorElement = document.querySelector('[data-validation-errors]');
                if (errorElement) {
                  errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              } : onSave}
              disabled={isSaving || !workflowData.name.trim()}
              className={validationErrors.length > 0 && hasAttemptedSave ? "bg-red-600 hover:bg-red-700 border-red-600" : ""}
              title={validationErrors.length > 0 && hasAttemptedSave ? `${validationErrors.length} validation error(s) - click to see details` : ""}
            >
              {isSaving ? "Saving..." : validationErrors.length > 0 && hasAttemptedSave ? "Fix Validation Errors" : isEditing ? "Update Workflow" : "Save Workflow"}
              {validationErrors.length > 0 && hasAttemptedSave && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-800 rounded-full">
                  {validationErrors.length}
                </span>
              )}
            </Button>
          </div>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(val) => !val && handleCancelDetails()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Workflow Details" : "Workflow Details"}
            </DialogTitle>
            <DialogDescription>
              Configure your workflow settings and properties.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Fieldset>
              <FieldGroup>
                <Field>
                  <Label>Name</Label>
                  <Input
                    name="name"
                    value={tempWorkflowData.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTempWorkflowData({ ...tempWorkflowData, name: value });
                      onFieldChange("name", value);
                    }}
                  />
                  {fieldErrors.name && (
                    <div className="mt-1 text-sm text-red-600">{fieldErrors.name}</div>
                  )}
                </Field>
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <Label>Description</Label>
                  <Textarea
                    name="description"
                    value={tempWorkflowData.description}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTempWorkflowData({ ...tempWorkflowData, description: value });
                      onFieldChange("description", value);
                    }}
                    rows={3}
                  />
                  {fieldErrors.description && (
                    <div className="mt-1 text-sm text-red-600">{fieldErrors.description}</div>
                  )}
                </Field>
              </FieldGroup>

              {/* Configuration Settings */}
              <div className="grid grid-cols-3 gap-4">
                <Field>
                  <Label>Timeout (seconds)</Label>
                  <Input
                    name="timeout_seconds"
                    type="number"
                    value={tempWorkflowData.configuration.timeout_seconds || ""}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : undefined;
                      setTempWorkflowData({
                        ...tempWorkflowData,
                        configuration: { ...tempWorkflowData.configuration, timeout_seconds: value }
                      });
                      onFieldChange("timeout_seconds", value);
                    }}
                  />
                  {fieldErrors.timeout_seconds && (
                    <div className="mt-1 text-sm text-red-600">{fieldErrors.timeout_seconds}</div>
                  )}
                </Field>

                <Field>
                  <Label>Max Retries</Label>
                  <Input
                    name="max_retries"
                    type="number"
                    value={tempWorkflowData.configuration.max_retries || ""}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : undefined;
                      setTempWorkflowData({
                        ...tempWorkflowData,
                        configuration: { ...tempWorkflowData.configuration, max_retries: value }
                      });
                      onFieldChange("max_retries", value);
                    }}
                  />
                  {fieldErrors.max_retries && (
                    <div className="mt-1 text-sm text-red-600">{fieldErrors.max_retries}</div>
                  )}
                </Field>

                <Field>
                  <Label>Retry Delay (seconds)</Label>
                  <Input
                    name="retry_delay_seconds"
                    type="number"
                    value={tempWorkflowData.configuration.retry_delay_seconds || ""}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : undefined;
                      setTempWorkflowData({
                        ...tempWorkflowData,
                        configuration: { ...tempWorkflowData.configuration, retry_delay_seconds: value }
                      });
                      onFieldChange("retry_delay_seconds", value);
                    }}
                  />
                  {fieldErrors.retry_delay_seconds && (
                    <div className="mt-1 text-sm text-red-600">{fieldErrors.retry_delay_seconds}</div>
                  )}
                </Field>
              </div>

              {/* Validation Summary */}
              {validationErrors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Please fix the following errors:
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{error.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Fieldset>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDetails}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveDetails}
              disabled={Object.values(fieldErrors).some(error => error)}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
