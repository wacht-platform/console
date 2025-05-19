import { Button } from "@/components/ui/button";
import { Heading } from "../../components/ui/heading";
import WorkflowBuilder from "../../components/workflow/WorkflowBuilder";

export default function CreateWorkflowPage() {
  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <Heading className="text-lg">New AI Workflow</Heading>
        <Button>Create Workflow</Button>
      </div>

      <div className="flex-1 bg-white">
        <WorkflowBuilder />
      </div>
    </div>
  );
}
