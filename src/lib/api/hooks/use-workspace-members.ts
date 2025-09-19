import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "@/lib/api/hooks/use-projects";

interface WorkspaceRole {
	id: string;
	name: string;
	permissions: string[];
	is_deployment_level?: boolean;
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

interface PaginatedResponse<T> {
	data: T[];
	has_more: boolean;
}

async function fetchWorkspaceMembers(
	deploymentId: string,
	workspaceId: string,
	offset: number = 0,
	limit: number = 20,
): Promise<PaginatedResponse<WorkspaceMemberDetails>> {
	const { data } = await apiClient.get<PaginatedResponse<WorkspaceMemberDetails>>(
		`/deployments/${deploymentId}/workspaces/${workspaceId}/members`,
		{
			params: { offset, limit },
		}
	);
	return data;
}

export function useWorkspaceMembers(
	workspaceId: string | undefined,
	offset: number = 0,
	limit: number = 20,
	enabled: boolean = true,
) {
	const { selectedDeployment } = useProjects();

	return useQuery({
		queryKey: ["workspace-members", selectedDeployment?.id, workspaceId, offset, limit],
		queryFn: () => {
			if (!selectedDeployment?.id || !workspaceId) {
				throw new Error("No deployment or workspace selected");
			}
			return fetchWorkspaceMembers(
				selectedDeployment.id.toString(),
				workspaceId,
				offset,
				limit,
			);
		},
		enabled: enabled && !!selectedDeployment?.id && !!workspaceId,
	});
}

export type { WorkspaceMemberDetails };