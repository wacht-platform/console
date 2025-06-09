import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import { toast } from 'sonner';

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

async function updateWorkspace(
	deploymentId: string,
	workspaceId: string,
	data: FormData,
): Promise<Workspace> {
	const response = await apiClient.patch(
		`/deployments/${deploymentId}/workspaces/${workspaceId}`,
		data
	);
	return response.data.data;
}

async function deleteWorkspace(
	deploymentId: string,
	workspaceId: string,
): Promise<void> {
	await apiClient.delete(
		`/deployments/${deploymentId}/workspaces/${workspaceId}`,
	);
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
			toast.success("Workspace created successfully!");
		},
		onError: () => {
			toast.error("Failed to create workspace. Please try again.");
		},
	});
}

export function useUpdateWorkspace() {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();

	return useMutation({
		mutationFn: ({
			workspaceId,
			data,
		}: {
			workspaceId: string;
			data: FormData;
		}) => {
			if (!selectedDeployment?.id) {
				throw new Error("No deployment selected");
			}
			return updateWorkspace(
				selectedDeployment.id.toString(),
				workspaceId,
				data,
			);
		},
		onSuccess: (_, { workspaceId }) => {
			queryClient.invalidateQueries({ queryKey: ["workspaces"] });
			queryClient.invalidateQueries({ queryKey: ["organization-details"] });
			queryClient.invalidateQueries({
				queryKey: ["workspace-details", selectedDeployment?.id, workspaceId],
			});
			toast.success("Workspace updated successfully!");
		},
		onError: () => {
			toast.error("Failed to update workspace. Please try again.");
		},
	});
}

export function useDeleteWorkspace() {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();

	return useMutation({
		mutationFn: (workspaceId: string) => {
			if (!selectedDeployment?.id) {
				throw new Error("No deployment selected");
			}
			return deleteWorkspace(
				selectedDeployment.id.toString(),
				workspaceId,
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["workspaces"] });
			queryClient.invalidateQueries({ queryKey: ["organization-details"] });
			toast.success("Workspace deleted successfully!");
		},
		onError: () => {
			toast.error("Failed to delete workspace. Please try again.");
		},
	});
}
