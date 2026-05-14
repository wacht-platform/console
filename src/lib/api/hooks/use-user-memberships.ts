import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type {
	UserOrganizationMembership,
	UserWorkspaceMembership,
} from "@/types/user";

async function fetchOrganizationMemberships(
	deploymentId: string,
	userId: string,
): Promise<UserOrganizationMembership[]> {
	const { data } = await apiClient.get<{ data: UserOrganizationMembership[] }>(
		`/deployments/${deploymentId}/users/${userId}/organization-memberships`,
	);
	return data.data;
}

async function fetchWorkspaceMemberships(
	deploymentId: string,
	userId: string,
): Promise<UserWorkspaceMembership[]> {
	const { data } = await apiClient.get<{ data: UserWorkspaceMembership[] }>(
		`/deployments/${deploymentId}/users/${userId}/workspace-memberships`,
	);
	return data.data;
}

export function useUserOrganizationMemberships(userId: string | undefined) {
	const { selectedDeployment } = useProjects();
	return useQuery<UserOrganizationMembership[], Error>({
		queryKey: ["user-org-memberships", selectedDeployment?.id, userId],
		queryFn: () => {
			if (!selectedDeployment?.id || !userId) {
				throw new Error("No deployment or user selected");
			}
			return fetchOrganizationMemberships(
				selectedDeployment.id.toString(),
				userId,
			);
		},
		enabled: !!selectedDeployment?.id && !!userId,
	});
}

export function useUserWorkspaceMemberships(userId: string | undefined) {
	const { selectedDeployment } = useProjects();
	return useQuery<UserWorkspaceMembership[], Error>({
		queryKey: ["user-ws-memberships", selectedDeployment?.id, userId],
		queryFn: () => {
			if (!selectedDeployment?.id || !userId) {
				throw new Error("No deployment or user selected");
			}
			return fetchWorkspaceMemberships(
				selectedDeployment.id.toString(),
				userId,
			);
		},
		enabled: !!selectedDeployment?.id && !!userId,
	});
}
