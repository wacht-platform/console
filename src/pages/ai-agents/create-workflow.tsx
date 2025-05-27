import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Heading } from "../../components/ui/heading";

export default function CreateWorkflowPage() {
  const navigate = useNavigate();
  const [workflowName, setWorkflowName] = useState("New Workflow");

  const handleBack = () => {
    navigate("../workflows");
  };

  const handleSave = () => {
    // TODO: Implement workflow saving logic
    console.log("Saving workflow:", workflowName);
    navigate("../workflows");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Button outline onClick={handleBack}>
            ← Back
          </Button>
          <Heading className="text-lg">{workflowName}</Heading>
        </div>
        <div className="flex gap-2">
          <Button outline onClick={handleBack}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Workflow
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 p-6">
        <div className="h-full bg-white rounded-lg border border-gray-200 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Workflow Builder
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm">
              Drag and drop components to build your AI workflow. Connect nodes to create the logic flow.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                🚧 Workflow builder coming soon
              </p>
              <p className="text-sm text-gray-400">
                This will include drag-and-drop nodes, connectors, and visual workflow design
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
