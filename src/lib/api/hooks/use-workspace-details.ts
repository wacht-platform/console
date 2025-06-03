import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "@/lib/api/hooks/use-projects";

interface WorkspaceRole {
	id: string;
	created_at: string;
	updated_at: string;
	name: string;
	permissions: string[];
}

interface WorkspaceMemberDetails {
	id: string;
	created_at: string;
	updated_at: string;
	workspace_id: string;
	user_id: string;
	roles: WorkspaceRole[];
	first_name: string;
	last_name: string;
	username: string | null;
	primary_email_address: string | null;
	primary_phone_number: string | null;
	user_created_at: string;
}

interface WorkspaceDetails {
	id: string;
	created_at: string;
	updated_at: string;
	name: string;
	image_url: string;
	description: string;
	member_count: number;
	public_metadata: Record<string, unknown>;
	private_metadata: Record<string, unknown>;
	organization_id: string;
	organization_name: string;
	members: WorkspaceMemberDetails[];
	roles: WorkspaceRole[];
}

async function fetchWorkspaceDetails(
	deploymentId: string,
	workspaceId: string,
): Promise<WorkspaceDetails> {
	const { data } = await apiClient.get<WorkspaceDetails>(
		`/deployments/${deploymentId}/workspaces/${workspaceId}`,
	);
	return data;
}

export function useWorkspaceDetails(workspaceId: string | undefined) {
	const { selectedDeployment } = useProjects();

	return useQuery({
		queryKey: ["workspace-details", selectedDeployment?.id, workspaceId],
		queryFn: () => {
			if (!selectedDeployment?.id || !workspaceId) {
				throw new Error("No deployment or workspace selected");
			}
			return fetchWorkspaceDetails(
				selectedDeployment.id.toString(),
				workspaceId,
			);
		},
		enabled: !!selectedDeployment?.id && !!workspaceId,
	});
}
