import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import WorkflowBuilder from "../../components/workflow/WorkflowBuilder";
import WorkflowHeader from "../../components/workflow/WorkflowHeader";
import { useWorkflow, useCreateWorkflow, useUpdateWorkflow } from "../../lib/api/hooks/use-workflows";
import { validateWorkflow, validateField, type ValidationError } from "../../lib/utils/workflow-validation";
import type { WorkflowFormData } from "../../types/workflow";

export default function CreateWorkflowPage() {
	const navigate = useNavigate();
	const { workflowId } = useParams<{ workflowId: string }>();
	const isEditing = !!workflowId;
	const [saveError, setSaveError] = useState<string | null>(null);

	// Fetch workflow data if editing
	const { data: workflow, isLoading } = useWorkflow(workflowId || "");

	// API hooks
	const createWorkflowMutation = useCreateWorkflow();
	const updateWorkflowMutation = useUpdateWorkflow();

	// Workflow form state
	const [workflowData, setWorkflowData] = useState<WorkflowFormData>({
		name: "Untitled Workflow",
		description: "",
		configuration: {
			timeout_seconds: 300,
			max_retries: 3,
			retry_delay_seconds: 5,
			enable_logging: true,
			enable_metrics: true,
			variables: {},
		},
		workflow_definition: {
			nodes: [],
			edges: [],
			version: "1.0.0",
		},
	});

	// Validation state
	const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	// Initialize workflow data when editing
	useEffect(() => {
		if (workflow) {
			setWorkflowData({
				name: workflow.name,
				description: workflow.description || "",
				configuration: workflow.configuration,
				workflow_definition: workflow.workflow_definition,
			});
		}
	}, [workflow]);

	const handleBack = () => {
		navigate("../workflows");
	};

	// Field validation handler
	const handleFieldChange = useCallback((fieldName: string, value: any) => {
		const error = validateField(fieldName, value);
		setFieldErrors(prev => ({
			...prev,
			[fieldName]: error || ""
		}));
	}, []);

	// Validate entire workflow before saving
	const validateWorkflowBeforeSave = useCallback(() => {
		const validation = validateWorkflow(workflowData);
		setValidationErrors(validation.errors);

		// Convert validation errors to field errors for display
		const newFieldErrors: Record<string, string> = {};
		validation.errors.forEach(error => {
			newFieldErrors[error.field] = error.message;
		});
		setFieldErrors(newFieldErrors);

		return validation.isValid;
	}, [workflowData]);

	const handleSave = useCallback(async () => {
		try {
			// Always validate before saving
			const isValid = validateWorkflowBeforeSave();
			if (!isValid) {
				setSaveError("Please fix the validation errors before saving the workflow.");
				return;
			}

			if (isEditing && workflowId) {
				await updateWorkflowMutation.mutateAsync({
					workflowId,
					workflow: {
						name: workflowData.name,
						description: workflowData.description,
						configuration: workflowData.configuration,
						workflow_definition: workflowData.workflow_definition,
					},
				});
			} else {
				await createWorkflowMutation.mutateAsync({
					name: workflowData.name,
					description: workflowData.description,
					configuration: workflowData.configuration,
					workflow_definition: workflowData.workflow_definition,
				});
			}

			// Clear validation errors on successful save
			setValidationErrors([]);
			setFieldErrors({});
			setSaveError(null);
			navigate("../workflows");
		} catch (error) {
			console.error("Failed to save workflow:", error);
			const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
			setSaveError(`Failed to save workflow: ${errorMessage}`);
		}
	}, [workflowId, workflowData, updateWorkflowMutation, createWorkflowMutation, validateWorkflowBeforeSave, isEditing, navigate]);

	if (isEditing && isLoading) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-sm text-gray-500">Loading workflow...</div>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col">
			<WorkflowHeader
				workflowData={workflowData}
				onWorkflowDataChange={setWorkflowData}
				isEditing={isEditing}
				onSave={handleSave}
				onCancel={handleBack}
				isSaving={createWorkflowMutation.isPending || updateWorkflowMutation.isPending}
				validationErrors={validationErrors}
				fieldErrors={fieldErrors}
				onFieldChange={handleFieldChange}
			/>

			<div className="flex-1">
				{saveError && (
					<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
						<div className="text-sm text-red-700">{saveError}</div>
					</div>
				)}
				<div className="h-full bg-white rounded-lg">
					<WorkflowBuilder
						workflowData={workflowData}
						onWorkflowDataChange={setWorkflowData}
					/>
				</div>
			</div>
		</div>
	);
}
