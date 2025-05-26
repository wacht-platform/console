import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type {
	Organization,
	OrganizationMemberDetails,
	OrganizationRole,
	CreateOrganizationRequest,
	UpdateOrganizationRequest,
	AddOrganizationMemberRequest,
	UpdateOrganizationMemberRequest,
	CreateOrganizationRoleRequest,
	UpdateOrganizationRoleRequest,
} from "@/types/organization";

async function createOrganization(
	deploymentId: string,
	data: CreateOrganizationRequest,
): Promise<Organization> {
	const response = await apiClient.post(
		`/deployments/${deploymentId}/organizations`,
		data,
	);
	return response.data.data;
}

async function updateOrganization(
	deploymentId: string,
	organizationId: string,
	data: UpdateOrganizationRequest,
): Promise<Organization> {
	const response = await apiClient.patch(
		`/deployments/${deploymentId}/organizations/${organizationId}`,
		data,
	);
	return response.data.data;
}

async function deleteOrganization(
	deploymentId: string,
	organizationId: string,
): Promise<void> {
	await apiClient.delete(
		`/deployments/${deploymentId}/organizations/${organizationId}`,
	);
}

async function addOrganizationMember(
	deploymentId: string,
	organizationId: string,
	data: AddOrganizationMemberRequest,
): Promise<OrganizationMemberDetails> {
	const response = await apiClient.post(
		`/deployments/${deploymentId}/organizations/${organizationId}/members`,
		data,
	);
	return response.data.data;
}

async function updateOrganizationMember(
	deploymentId: string,
	organizationId: string,
	membershipId: string,
	data: UpdateOrganizationMemberRequest,
): Promise<void> {
	await apiClient.patch(
		`/deployments/${deploymentId}/organizations/${organizationId}/members/${membershipId}`,
		data,
	);
}

async function removeOrganizationMember(
	deploymentId: string,
	organizationId: string,
	membershipId: string,
): Promise<void> {
	await apiClient.delete(
		`/deployments/${deploymentId}/organizations/${organizationId}/members/${membershipId}`,
	);
}

async function createOrganizationRole(
	deploymentId: string,
	organizationId: string,
	data: CreateOrganizationRoleRequest,
): Promise<OrganizationRole> {
	const response = await apiClient.post(
		`/deployments/${deploymentId}/organizations/${organizationId}/roles`,
		data,
	);
	return response.data.data;
}

async function updateOrganizationRole(
	deploymentId: string,
	organizationId: string,
	roleId: string,
	data: UpdateOrganizationRoleRequest,
): Promise<OrganizationRole> {
	const response = await apiClient.patch(
		`/deployments/${deploymentId}/organizations/${organizationId}/roles/${roleId}`,
		data,
	);
	return response.data.data;
}

async function deleteOrganizationRole(
	deploymentId: string,
	organizationId: string,
	roleId: string,
): Promise<void> {
	await apiClient.delete(
		`/deployments/${deploymentId}/organizations/${organizationId}/roles/${roleId}`,
	);
}

export function useCreateOrganization() {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();

	return useMutation({
		mutationFn: (data: CreateOrganizationRequest) => {
			if (!selectedDeployment?.id) {
				throw new Error("No deployment selected");
			}
			return createOrganization(selectedDeployment.id.toString(), data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["organizations"] });
		},
	});
}

export function useUpdateOrganization() {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();

	return useMutation({
		mutationFn: ({
			organizationId,
			data,
		}: {
			organizationId: string;
			data: UpdateOrganizationRequest;
		}) => {
			if (!selectedDeployment?.id) {
				throw new Error("No deployment selected");
			}
			return updateOrganization(
				selectedDeployment.id.toString(),
				organizationId,
				data,
			);
		},
		onSuccess: (_, { organizationId }) => {
			queryClient.invalidateQueries({ queryKey: ["organizations"] });
			queryClient.invalidateQueries({
				queryKey: [
					"organization-details",
					selectedDeployment?.id,
					organizationId,
				],
			});
		},
	});
}

export function useDeleteOrganization() {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();

	return useMutation({
		mutationFn: (organizationId: string) => {
			if (!selectedDeployment?.id) {
				throw new Error("No deployment selected");
			}
			return deleteOrganization(
				selectedDeployment.id.toString(),
				organizationId,
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["organizations"] });
		},
	});
}

export function useAddOrganizationMember() {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();

	return useMutation({
		mutationFn: ({
			organizationId,
			data,
		}: {
			organizationId: string;
			data: AddOrganizationMemberRequest;
		}) => {
			if (!selectedDeployment?.id) {
				throw new Error("No deployment selected");
			}
			return addOrganizationMember(
				selectedDeployment.id.toString(),
				organizationId,
				data,
			);
		},
		onSuccess: (_, { organizationId }) => {
			queryClient.invalidateQueries({
				queryKey: [
					"organization-details",
					selectedDeployment?.id,
					organizationId,
				],
			});
		},
	});
}

export function useUpdateOrganizationMember() {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();

	return useMutation({
		mutationFn: ({
			organizationId,
			membershipId,
			data,
		}: {
			organizationId: string;
			membershipId: string;
			data: UpdateOrganizationMemberRequest;
		}) => {
			if (!selectedDeployment?.id) {
				throw new Error("No deployment selected");
			}
			return updateOrganizationMember(
				selectedDeployment.id.toString(),
				organizationId,
				membershipId,
				data,
			);
		},
		onSuccess: (_, { organizationId }) => {
			queryClient.invalidateQueries({
				queryKey: [
					"organization-details",
					selectedDeployment?.id,
					organizationId,
				],
			});
		},
	});
}

export function useRemoveOrganizationMember() {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();

	return useMutation({
		mutationFn: ({
			organizationId,
			membershipId,
		}: {
			organizationId: string;
			membershipId: string;
		}) => {
			if (!selectedDeployment?.id) {
				throw new Error("No deployment selected");
			}
			return removeOrganizationMember(
				selectedDeployment.id.toString(),
				organizationId,
				membershipId,
			);
		},
		onSuccess: (_, { organizationId }) => {
			queryClient.invalidateQueries({
				queryKey: [
					"organization-details",
					selectedDeployment?.id,
					organizationId,
				],
			});
		},
	});
}

export function useCreateOrganizationRole() {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();

	return useMutation({
		mutationFn: ({
			organizationId,
			data,
		}: {
			organizationId: string;
			data: CreateOrganizationRoleRequest;
		}) => {
			if (!selectedDeployment?.id) {
				throw new Error("No deployment selected");
			}
			return createOrganizationRole(
				selectedDeployment.id.toString(),
				organizationId,
				data,
			);
		},
		onSuccess: (_, { organizationId }) => {
			queryClient.invalidateQueries({
				queryKey: [
					"organization-details",
					selectedDeployment?.id,
					organizationId,
				],
			});
		},
	});
}

export function useUpdateOrganizationRole() {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();

	return useMutation({
		mutationFn: ({
			organizationId,
			roleId,
			data,
		}: {
			organizationId: string;
			roleId: string;
			data: UpdateOrganizationRoleRequest;
		}) => {
			if (!selectedDeployment?.id) {
				throw new Error("No deployment selected");
			}
			return updateOrganizationRole(
				selectedDeployment.id.toString(),
				organizationId,
				roleId,
				data,
			);
		},
		onSuccess: (_, { organizationId }) => {
			queryClient.invalidateQueries({
				queryKey: [
					"organization-details",
					selectedDeployment?.id,
					organizationId,
				],
			});
		},
	});
}

export function useDeleteOrganizationRole() {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();

	return useMutation({
		mutationFn: ({
			organizationId,
			roleId,
		}: {
			organizationId: string;
			roleId: string;
		}) => {
			if (!selectedDeployment?.id) {
				throw new Error("No deployment selected");
			}
			return deleteOrganizationRole(
				selectedDeployment.id.toString(),
				organizationId,
				roleId,
			);
		},
		onSuccess: (_, { organizationId }) => {
			queryClient.invalidateQueries({
				queryKey: [
					"organization-details",
					selectedDeployment?.id,
					organizationId,
				],
			});
		},
	});
}
