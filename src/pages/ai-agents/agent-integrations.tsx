import { useState } from "react";
import { useParams } from "react-router";
import {
  CheckIcon,
  ClipboardDocumentIcon,
  EllipsisVerticalIcon,
  LinkIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { BsMicrosoftTeams } from "react-icons/bs";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/modals/confirmation-dialog";
import { CreateIntegrationDialog } from "@/components/ai-agents/create-integration-dialog";
import { useAgentById } from "@/lib/api/hooks/use-agents";
import { useDeleteIntegration } from "@/lib/api/hooks/use-integrations";
import type { AgentIntegration } from "@/types/agent-integration";

function getIntegrationIcon(type: string) {
  switch (type.toLowerCase()) {
    case "teams":
      return <BsMicrosoftTeams className="h-3.5 w-3.5 text-[#6264A7]" />;
    default:
      return <LinkIcon className="h-3.5 w-3.5 text-primary" />;
  }
}

function getIntegrationLabel(type: string) {
  switch (type.toLowerCase()) {
    case "teams":
      return "Microsoft Teams";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

export default function AgentIntegrationsPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: agent } = useAgentById(agentId || "");
  const deleteIntegrationMutation = useDeleteIntegration(agentId || "");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isIntegrationDialogOpen, setIsIntegrationDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<AgentIntegration | null>(null);
  const [confirmDeleteIntegrationOpen, setConfirmDeleteIntegrationOpen] = useState(false);
  const [integrationToDelete, setIntegrationToDelete] = useState<AgentIntegration | null>(null);

  const integrations = agent?.integrations || [];

  const handleCopyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleAddIntegration = () => {
    setEditingIntegration(null);
    setIsIntegrationDialogOpen(true);
  };

  const handleEditIntegration = (integration: AgentIntegration) => {
    setEditingIntegration(integration);
    setIsIntegrationDialogOpen(true);
  };

  const handleDeleteIntegration = (integration: AgentIntegration) => {
    setIntegrationToDelete(integration);
    setConfirmDeleteIntegrationOpen(true);
  };

  const handleConfirmDeleteIntegration = async () => {
    if (!integrationToDelete) return;
    try {
      await deleteIntegrationMutation.mutateAsync(integrationToDelete.id);
      setConfirmDeleteIntegrationOpen(false);
      setIntegrationToDelete(null);
    } catch (error) {
      console.error("Failed to delete integration:", error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] leading-5 text-muted-foreground">
          Connect this agent to external platforms.
        </p>
        <Button className="h-8 px-3 text-[12px]" onClick={handleAddIntegration}>
          <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
          Add integration
        </Button>
      </div>

      {integrations.length > 0 ? (
        <div className="space-y-1.5">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="space-y-2 rounded-lg border border-border/60 px-3.5 py-2.5"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  {getIntegrationIcon(integration.integration_type)}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="text-[14px] font-medium leading-5">
                    {integration.name}
                  </div>
                  <div className="text-[13px] leading-5 text-muted-foreground">
                    {getIntegrationLabel(integration.integration_type)}
                  </div>
                </div>
                <Menu as="div" className="relative">
                  <MenuButton className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </MenuButton>
                  <MenuItems className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md border border-border/70 bg-background py-1 shadow-lg focus:outline-none">
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={() => handleEditIntegration(integration as AgentIntegration)}
                          className={`${focus ? "bg-muted" : ""} block w-full px-3 py-2 text-left text-sm`}
                        >
                          Edit
                        </button>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={() => handleDeleteIntegration(integration as AgentIntegration)}
                          className={`${focus ? "bg-muted" : ""} block w-full px-3 py-2 text-left text-sm text-destructive`}
                        >
                          Delete
                        </button>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Menu>
              </div>

              {"webhook_url" in integration && integration.webhook_url ? (
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2.5 py-2 text-[12px] text-muted-foreground">
                    {integration.webhook_url}
                  </code>
                  <Button
                    variant="outline"
                    className="h-8 w-8 shrink-0 p-0"
                    onClick={() => handleCopyUrl(integration.webhook_url)}
                  >
                    {copiedUrl === integration.webhook_url ? (
                      <CheckIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center">
          <p className="text-[13px] text-muted-foreground">
            No integrations yet.
          </p>
        </div>
      )}

      <CreateIntegrationDialog
        open={isIntegrationDialogOpen}
        onClose={() => {
          setIsIntegrationDialogOpen(false);
          setEditingIntegration(null);
        }}
        agentId={agentId || ""}
        integration={editingIntegration || undefined}
      />

      <ConfirmationDialog
        isOpen={confirmDeleteIntegrationOpen}
        onClose={() => {
          setConfirmDeleteIntegrationOpen(false);
          setIntegrationToDelete(null);
        }}
        onConfirm={handleConfirmDeleteIntegration}
        title="Delete Integration"
        message={integrationToDelete ? `Are you sure you want to delete "${integrationToDelete.name}"?` : ""}
        confirmText="Delete"
        isDestructive={true}
        isLoading={deleteIntegrationMutation.isPending}
      />
    </div>
  );
}
