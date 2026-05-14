import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";

export function useDeleteUserAuthenticator(userId: string) {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();
	return useMutation({
		mutationFn: async () => {
			if (!selectedDeployment?.id || !userId) {
				throw new Error("No deployment or user selected");
			}
			await apiClient.delete(
				`/deployments/${selectedDeployment.id}/users/${userId}/authenticators`,
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["user-details", selectedDeployment?.id, userId],
			});
		},
	});
}

export function useRegenerateBackupCodes(userId: string) {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();
	return useMutation({
		mutationFn: async () => {
			if (!selectedDeployment?.id || !userId) {
				throw new Error("No deployment or user selected");
			}
			const { data } = await apiClient.post<{ backup_codes: string[] }>(
				`/deployments/${selectedDeployment.id}/users/${userId}/backup-codes/regenerate`,
			);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["user-details", selectedDeployment?.id, userId],
			});
		},
	});
}
