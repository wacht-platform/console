import { useNavigate, useParams } from "react-router";
import { Button } from "../../components/ui/button";
import { Heading } from "../../components/ui/heading";
import WorkflowBuilder from "../../components/workflow/WorkflowBuilder";
import { useWorkflow } from "../../lib/api/hooks/use-workflows";
import type { WorkflowFormData } from "../../types/workflow";

export default function CreateWorkflowPage() {
	const navigate = useNavigate();
	const { workflowId } = useParams<{ workflowId: string }>();
	const isEditing = !!workflowId;

	// Fetch workflow data if editing
	const { data: workflow, isLoading } = useWorkflow(workflowId || "");

	const handleBack = () => {
		navigate("../workflows");
	};

	const handleSave = (workflowData: WorkflowFormData) => {
		console.log("Workflow saved:", workflowData);
		navigate("../workflows");
	};

	if (isEditing && isLoading) {
		return (
			<div className="h-full flex items-center justify-center">
				<div className="text-sm text-gray-500">Loading workflow...</div>
			</div>
		);
	}

	const initialWorkflow: WorkflowFormData | undefined = workflow ? {
		name: workflow.name,
		description: workflow.description || "",
		configuration: workflow.configuration,
		workflow_definition: workflow.workflow_definition,
	} : undefined;

	return (
		<div className="h-full flex flex-col">
			<div className="flex items-center justify-between p-6 border-b border-gray-200">
				<div className="flex items-center gap-4">
					<Button outline onClick={handleBack}>
						← Back
					</Button>
					<Heading className="text-lg">
						{isEditing ? `Edit ${workflow?.name || "Workflow"}` : "Create New Workflow"}
					</Heading>
				</div>
				<div className="flex gap-2">
					<Button outline onClick={handleBack}>
						Cancel
					</Button>
				</div>
			</div>

			<div className="flex-1 bg-gray-50 p-6">
				<div className="h-full bg-white rounded-lg border border-gray-200">
					<WorkflowBuilder
						workflowId={workflowId}
						initialWorkflow={initialWorkflow}
						onSave={handleSave}
					/>
				</div>
			</div>
		</div>
	);
}
