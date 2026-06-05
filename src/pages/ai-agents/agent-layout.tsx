import { useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router";
import { TrashIcon, CpuChipIcon, PlayIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { InlineLoader } from "@/components/ui/loading-screen";
import { ConfirmationDialog } from "@/components/modals/confirmation-dialog";
import { AgentRouteNav } from "@/components/ai-agents/agent-route-nav";
import {
  useAgentById,
  useDeleteAgent,
  useUpdateAgent,
} from "@/lib/api/hooks/use-agents";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { useGenerateAgentTicket } from "@/lib/hooks/use-generate-ticket";
import { useTour } from "@/lib/tour";

export default function AgentLayoutPage() {
  const navigate = useNavigate();
  const { agentId, projectId, deploymentId } = useParams<{
    agentId: string;
    projectId: string;
    deploymentId: string;
  }>();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const { data: agent, isLoading, error } = useAgentById(agentId || "");
  const { selectedDeployment } = useProjects();
  const deleteAgentMutation = useDeleteAgent();
  const updateAgentMutation = useUpdateAgent();
  const generateTicketMutation = useGenerateAgentTicket();

  const handleTestAgent = async () => {
    if (!agent || !selectedDeployment) return;
    try {
      const result = await generateTicketMutation.mutateAsync({
        deployment_id: String(selectedDeployment.id),
        agent_ids: [agent.id],
        selected_agent_id: agent.id,
        expires_in: 60 * 60 * 12,
      });
      const testUrl = `https://${selectedDeployment.backend_host}/vanity/agents?ticket=${result.ticket}`;
      window.open(testUrl, "_blank");
    } catch (err) {
      console.error("Failed to generate ticket:", err);
    }
  };

  const saveName = async () => {
    const next = nameDraft.trim();
    setEditingName(false);
    if (agent && next && next !== agent.name) {
      try {
        await updateAgentMutation.mutateAsync({
          agentId: agent.id,
          agent: { name: next },
        });
      } catch {
        // surfaced by hook
      }
    }
  };
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
    <div>
      <section className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-primary/10 text-primary">
            <CpuChipIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            {editingName ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                className="w-full max-w-md border-0 bg-transparent p-0 text-2xl font-medium tracking-[-0.012em] text-foreground outline-none focus:outline-none focus:ring-0"
              />
            ) : (
              <h1
                onClick={() => {
                  setNameDraft(agent.name || "");
                  setEditingName(true);
                }}
                title="Click to rename"
                className="cursor-text text-2xl font-medium tracking-[-0.012em] text-foreground"
              >
                {agent.name || "Unnamed agent"}
              </h1>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
              <Pill tone="info">
                {agent.tools_count} tool{agent.tools_count === 1 ? "" : "s"}
              </Pill>
              <Pill tone={agent.knowledge_bases_count > 0 ? "ok" : "mute"}>
                {agent.knowledge_bases_count} kb
                {agent.knowledge_bases_count === 1 ? "" : "s"}
              </Pill>
              {agent.created_at ? (
                <span className="font-mono text-[12px] text-muted-foreground">
                  created {format(new Date(agent.created_at), "MMM d, yyyy")}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            onClick={handleTestAgent}
            disabled={
              generateTicketMutation.isPending || !selectedDeployment || !agent
            }
          >
            <PlayIcon className="mr-2 h-4 w-4" />
            {generateTicketMutation.isPending ? "Opening…" : "Test agent"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[212px_1fr]">
        <AgentRouteNav />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>

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
