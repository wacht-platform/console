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

interface AddWorkspaceMemberRequest {
	user_id: string;
	role_ids?: string[];
}

interface UpdateWorkspaceMemberRequest {
	role_ids?: string[];
	public_metadata?: Record<string, any>;
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
	const formData = new FormData();
	formData.append('name', data.name);
	if (data.description) {
		formData.append('description', data.description);
	}
	if (data.image_url) {
		formData.append('image_url', data.image_url);
	}
	if (data.public_metadata) {
		formData.append('public_metadata', JSON.stringify(data.public_metadata));
	}
	if (data.private_metadata) {
		formData.append('private_metadata', JSON.stringify(data.private_metadata));
	}

	const response = await apiClient.post(
		`/deployments/${deploymentId}/organizations/${organizationId}/workspaces`,
		formData,
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

async function addWorkspaceMember(
	deploymentId: string,
	workspaceId: string,
	data: AddWorkspaceMemberRequest,
): Promise<void> {
	await apiClient.post(
		`/deployments/${deploymentId}/workspaces/${workspaceId}/members`,
		data,
	);
}

async function updateWorkspaceMember(
	deploymentId: string,
	workspaceId: string,
	membershipId: string,
	data: UpdateWorkspaceMemberRequest,
): Promise<void> {
	await apiClient.patch(
		`/deployments/${deploymentId}/workspaces/${workspaceId}/members/${membershipId}`,
		data,
	);
}

async function removeWorkspaceMember(
	deploymentId: string,
	workspaceId: string,
	membershipId: string,
): Promise<void> {
	await apiClient.delete(
		`/deployments/${deploymentId}/workspaces/${workspaceId}/members/${membershipId}`,
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

export function useAddWorkspaceMember() {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();

	return useMutation({
		mutationFn: ({
			workspaceId,
			data,
		}: {
			workspaceId: string;
			data: AddWorkspaceMemberRequest;
		}) => {
			if (!selectedDeployment?.id) {
				throw new Error("No deployment selected");
			}
			return addWorkspaceMember(
				selectedDeployment.id.toString(),
				workspaceId,
				data,
			);
		},
		onSuccess: (_, { workspaceId }) => {
			queryClient.invalidateQueries({
				queryKey: ["workspace-details", selectedDeployment?.id, workspaceId],
			});
			queryClient.invalidateQueries({
				queryKey: ["workspace-members", selectedDeployment?.id, workspaceId],
			});
			toast.success("Member added to workspace successfully!");
		},
		onError: () => {
			toast.error("Failed to add member to workspace. Please try again.");
		},
	});
}

export function useUpdateWorkspaceMember() {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();

	return useMutation({
		mutationFn: ({
			workspaceId,
			membershipId,
			data,
		}: {
			workspaceId: string;
			membershipId: string;
			data: UpdateWorkspaceMemberRequest;
		}) => {
			if (!selectedDeployment?.id) {
				throw new Error("No deployment selected");
			}
			return updateWorkspaceMember(
				selectedDeployment.id.toString(),
				workspaceId,
				membershipId,
				data,
			);
		},
		onSuccess: (_, { workspaceId }) => {
			queryClient.invalidateQueries({
				queryKey: ["workspace-details", selectedDeployment?.id, workspaceId],
			});
			queryClient.invalidateQueries({
				queryKey: ["workspace-members", selectedDeployment?.id, workspaceId],
			});
			toast.success("Member roles updated successfully!");
		},
		onError: () => {
			toast.error("Failed to update member roles. Please try again.");
		},
	});
}

export function useRemoveWorkspaceMember() {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();

	return useMutation({
		mutationFn: ({
			workspaceId,
			membershipId,
		}: {
			workspaceId: string;
			membershipId: string;
		}) => {
			if (!selectedDeployment?.id) {
				throw new Error("No deployment selected");
			}
			return removeWorkspaceMember(
				selectedDeployment.id.toString(),
				workspaceId,
				membershipId,
			);
		},
		onSuccess: (_, { workspaceId }) => {
			queryClient.invalidateQueries({
				queryKey: ["workspace-details", selectedDeployment?.id, workspaceId],
			});
			queryClient.invalidateQueries({
				queryKey: ["workspace-members", selectedDeployment?.id, workspaceId],
			});
			toast.success("Member removed from workspace successfully!");
		},
		onError: () => {
			toast.error("Failed to remove member from workspace. Please try again.");
		},
	});
}
