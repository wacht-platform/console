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


	const { data: workflow, isLoading, error } = useWorkflow(workflowId || "");

	const createWorkflowMutation = useCreateWorkflow();
	const updateWorkflowMutation = useUpdateWorkflow();

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
	
	// Check if we need to update workflowData
	if (workflow && workflowData.workflow_definition.nodes.length <= 1 && workflow.workflow_definition.nodes.length > 1) {
		setWorkflowData({
			name: workflow.name,
			description: workflow.description || "",
			configuration: workflow.configuration,
			workflow_definition: workflow.workflow_definition,
		});
	}

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

	// Only show validation errors after user has attempted to save or after a delay
	const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
	const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);

	// Auto-validate with delay to avoid showing errors immediately
	useEffect(() => {
		// Clear existing timeout
		if (validationTimeout) {
			clearTimeout(validationTimeout);
		}

		// Only auto-validate if user has attempted to save before, or after a reasonable delay
		if (hasAttemptedSave || workflowData.name.trim()) {
			const timeout = setTimeout(() => {
				const validation = validateWorkflow(workflowData);
				setValidationErrors(validation.errors);

				// Convert validation errors to field errors for display
				const newFieldErrors: Record<string, string> = {};
				validation.errors.forEach(error => {
					newFieldErrors[error.field] = error.message;
				});
				setFieldErrors(newFieldErrors);
			}, hasAttemptedSave ? 0 : 2000); // Immediate if user tried to save, 2s delay otherwise

			setValidationTimeout(timeout);
		}

		return () => {
			if (validationTimeout) {
				clearTimeout(validationTimeout);
			}
		};
	}, [workflowData, hasAttemptedSave]);

	const handleBack = () => {
		navigate("../workflows");
	};

	// Field validation handler
	const handleFieldChange = useCallback((fieldName: string, value: unknown) => {
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
			setHasAttemptedSave(true);
			const isValid = validateWorkflowBeforeSave();
			if (!isValid) {
				setSaveError(null);
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
	}, [workflowId, workflowData, updateWorkflowMutation, createWorkflowMutation, validateWorkflowBeforeSave, isEditing, navigate, setHasAttemptedSave]);

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
				hasAttemptedSave={hasAttemptedSave}
			/>

			<div className="flex-1">
				{saveError && (
					<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
						<div className="text-sm text-red-700">{saveError}</div>
					</div>
				)}

				{/* Validation Errors Display - Only show if user has attempted to save */}
				{validationErrors.length > 0 && hasAttemptedSave && (
					<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md" data-validation-errors>
						<div className="flex items-center mb-3">
							<svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
							</svg>
							<h4 className="text-sm font-medium text-red-800">
								Please fix the following errors before saving:
							</h4>
						</div>
						<ul className="text-sm text-red-700 space-y-2">
							{validationErrors.map((error, index) => (
								<li key={index} className="flex items-start">
									<span className="mr-2 mt-0.5">•</span>
									<div>
										<span className="font-medium">{error.field.replace(/\./g, ' → ')}:</span>
										<span className="ml-1">{error.message}</span>
									</div>
								</li>
							))}
						</ul>
					</div>
				)}

				<div className="h-full bg-white rounded-lg">
					<WorkflowBuilder
						key={workflowId || 'new'}
						workflowData={workflowData}
						onWorkflowDataChange={setWorkflowData}
					/>
				</div>
			</div>
		</div>
	);
}
