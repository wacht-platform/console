import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type { UserSignin } from "@/types/user";

async function fetchSignins(
	deploymentId: string,
	userId: string,
	includeExpired: boolean,
): Promise<UserSignin[]> {
	const qs = includeExpired ? "?include_expired=true" : "";
	const { data } = await apiClient.get<{ data: UserSignin[] }>(
		`/deployments/${deploymentId}/users/${userId}/sessions${qs}`,
	);
	return data.data;
}

export function useUserSignins(
	userId: string | undefined,
	includeExpired = false,
) {
	const { selectedDeployment } = useProjects();
	return useQuery<UserSignin[], Error>({
		queryKey: [
			"user-signins",
			selectedDeployment?.id,
			userId,
			includeExpired,
		],
		queryFn: () => {
			if (!selectedDeployment?.id || !userId) {
				throw new Error("No deployment or user selected");
			}
			return fetchSignins(
				selectedDeployment.id.toString(),
				userId,
				includeExpired,
			);
		},
		enabled: !!selectedDeployment?.id && !!userId,
	});
}

export function useRevokeUserSignin(userId: string) {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();
	return useMutation({
		mutationFn: async (signinId: string) => {
			if (!selectedDeployment?.id || !userId) {
				throw new Error("No deployment or user selected");
			}
			await apiClient.post(
				`/deployments/${selectedDeployment.id}/users/${userId}/sessions/${signinId}/revoke`,
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["user-signins", selectedDeployment?.id, userId],
			});
		},
	});
}

export function useRevokeAllUserSignins(userId: string) {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();
	return useMutation({
		mutationFn: async () => {
			if (!selectedDeployment?.id || !userId) {
				throw new Error("No deployment or user selected");
			}
			const { data } = await apiClient.post<{ revoked: number }>(
				`/deployments/${selectedDeployment.id}/users/${userId}/sessions/revoke-all`,
			);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["user-signins", selectedDeployment?.id, userId],
			});
		},
	});
}
