import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type { UserPasskey } from "@/types/user";

async function fetchPasskeys(
	deploymentId: string,
	userId: string,
): Promise<UserPasskey[]> {
	const { data } = await apiClient.get<{ data: UserPasskey[] }>(
		`/deployments/${deploymentId}/users/${userId}/passkeys`,
	);
	return data.data;
}

export function useUserPasskeys(userId: string | undefined) {
	const { selectedDeployment } = useProjects();
	return useQuery<UserPasskey[], Error>({
		queryKey: ["user-passkeys", selectedDeployment?.id, userId],
		queryFn: () => {
			if (!selectedDeployment?.id || !userId) {
				throw new Error("No deployment or user selected");
			}
			return fetchPasskeys(selectedDeployment.id.toString(), userId);
		},
		enabled: !!selectedDeployment?.id && !!userId,
	});
}

export function useRenameUserPasskey(userId: string) {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();
	return useMutation({
		mutationFn: async ({
			passkeyId,
			name,
		}: {
			passkeyId: string;
			name: string;
		}) => {
			if (!selectedDeployment?.id || !userId) {
				throw new Error("No deployment or user selected");
			}
			await apiClient.patch(
				`/deployments/${selectedDeployment.id}/users/${userId}/passkeys/${passkeyId}`,
				{ name },
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["user-passkeys", selectedDeployment?.id, userId],
			});
		},
	});
}

export function useDeleteUserPasskey(userId: string) {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();
	return useMutation({
		mutationFn: async (passkeyId: string) => {
			if (!selectedDeployment?.id || !userId) {
				throw new Error("No deployment or user selected");
			}
			await apiClient.delete(
				`/deployments/${selectedDeployment.id}/users/${userId}/passkeys/${passkeyId}`,
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["user-passkeys", selectedDeployment?.id, userId],
			});
		},
	});
}
