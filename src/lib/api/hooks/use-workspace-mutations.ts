import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";

interface CreateWorkspaceRequest {
	name: string;
	description?: string;
	image_url?: string;
	public_metadata?: Record<string, unknown>;
	private_metadata?: Record<string, unknown>;
}

interface Workspace {
	id: string;
	created_at: string;
	updated_at: string;
	name: string;
	image_url: string;
	description: string;
	member_count: number;
	public_metadata: Record<string, unknown>;
	private_metadata: Record<string, unknown>;
}

async function createWorkspace(
	deploymentId: string,
	organizationId: string,
	data: CreateWorkspaceRequest,
): Promise<Workspace> {
	const response = await apiClient.post(
		`/deployments/${deploymentId}/organizations/${organizationId}/workspaces`,
		data,
	);
	return response.data.data;
}

export function useCreateWorkspace(organizationId: string) {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();

	return useMutation({
		mutationFn: (data: CreateWorkspaceRequest) => {
			if (!selectedDeployment?.id) {
				throw new Error("No deployment selected");
			}
			return createWorkspace(
				selectedDeployment.id.toString(),
				organizationId,
				data,
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["workspaces"] });
			queryClient.invalidateQueries({ queryKey: ["organization-details"] });
		},
	});
}
