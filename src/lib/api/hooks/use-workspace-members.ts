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
	public_metadata?: Record<string, any>;
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
	search?: string,
	sortKey?: string,
	sortOrder?: string,
): Promise<PaginatedResponse<WorkspaceMemberDetails>> {
	const { data } = await apiClient.get<PaginatedResponse<WorkspaceMemberDetails>>(
		`/deployments/${deploymentId}/workspaces/${workspaceId}/members`,
		{
			params: {
				offset,
				limit,
				search,
				sort_key: sortKey,
				sort_order: sortOrder,
			},
		}
	);
	return data;
}

export function useWorkspaceMembers(
	workspaceId: string | undefined,
	offset: number = 0,
	limit: number = 20,
	search?: string,
	sortKey?: string,
	sortOrder?: string,
	enabled: boolean = true,
) {
	const { selectedDeployment } = useProjects();

	return useQuery({
		queryKey: [
			"workspace-members",
			selectedDeployment?.id,
			workspaceId,
			offset,
			limit,
			search,
			sortKey,
			sortOrder,
		],
		queryFn: () => {
			if (!selectedDeployment?.id || !workspaceId) {
				throw new Error("No deployment or workspace selected");
			}
			return fetchWorkspaceMembers(
				selectedDeployment.id.toString(),
				workspaceId,
				offset,
				limit,
				search,
				sortKey,
				sortOrder,
			);
		},
		enabled: enabled && !!selectedDeployment?.id && !!workspaceId,
	});
}

export type { WorkspaceMemberDetails };