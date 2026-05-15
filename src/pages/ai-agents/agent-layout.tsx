import { useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { InlineLoader } from "@/components/ui/loading-screen";
import { ConfirmationDialog } from "@/components/modals/confirmation-dialog";
import { CreateAgentDialog } from "@/components/ai-agents/create-agent-dialog";
import { AgentRouteNav } from "@/components/ai-agents/agent-route-nav";
import { useAgentById, useDeleteAgent } from "@/lib/api/hooks/use-agents";
import { useTour } from "@/lib/tour";

export default function AgentLayoutPage() {
  const navigate = useNavigate();
  const { agentId, projectId, deploymentId } = useParams<{
    agentId: string;
    projectId: string;
    deploymentId: string;
  }>();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { data: agent, isLoading, error } = useAgentById(agentId || "");
  const deleteAgentMutation = useDeleteAgent();
  const basePath = `/project/${projectId}/deployment/${deploymentId}/llms/ai-agents`;

  // Fires the agent-builder walkthrough once per agent open. The navigate
  // action that drives each step is registered globally on
  // ApplicationLayout — it auto-detects agent context from the URL.
  useTour("agent-builder", !isLoading && !!agent);

  const handleDelete = async () => {
    if (!agent) return;
    try {
      await deleteAgentMutation.mutateAsync(agent.id);
      navigate(basePath);
    } catch (deleteError) {
      console.error("Failed to delete agent:", deleteError);
    }
  };

  if (isLoading) {
    return <InlineLoader />;
  }

  if (error || !agent) {
    return (
      <div className="py-12 text-center text-destructive">
        {error?.message || "Agent not found"}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-medium tracking-tight">
            {agent.name || "Unnamed Agent"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            Edit Agent
          </Button>
          <Button variant="destructive" onClick={() => setConfirmDeleteOpen(true)}>
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <AgentRouteNav />

      <Outlet />

      <CreateAgentDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        agent={agent}
      />

      <ConfirmationDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Agent"
        message={`Are you sure you want to delete the agent "${agent.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive
        isLoading={deleteAgentMutation.isPending}
      />
    </div>
  );
}
