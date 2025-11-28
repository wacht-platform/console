import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import type { UserDetails } from "@/types/user";

interface UpdateUserRequest {
	first_name?: string;
	last_name?: string;
	username?: string;
	public_metadata?: Record<string, unknown>;
	private_metadata?: Record<string, unknown>;
	disabled?: boolean;
	profile_image?: File;
}

async function updateUser(
	deploymentId: string,
	userId: string,
	data: UpdateUserRequest,
): Promise<UserDetails> {
	// Create FormData for multipart request
	const formData = new FormData();

	if (data.first_name !== undefined) {
		formData.append("first_name", data.first_name);
	}
	if (data.last_name !== undefined) {
		formData.append("last_name", data.last_name);
	}
	if (data.username !== undefined) {
		formData.append("username", data.username);
	}
	if (data.public_metadata !== undefined) {
		formData.append("public_metadata", JSON.stringify(data.public_metadata));
	}
	if (data.private_metadata !== undefined) {
		formData.append("private_metadata", JSON.stringify(data.private_metadata));
	}
	if (data.disabled !== undefined) {
		formData.append("disabled", data.disabled.toString());
	}
	if (data.profile_image !== undefined) {
		formData.append("profile_image", data.profile_image);
	}

	const response = await apiClient.patch(
		`/deployments/${deploymentId}/users/${userId}`,
		formData,
	);
	return response.data.data;
}

export function useUpdateUser(userId: string) {
	const queryClient = useQueryClient();
	const { selectedDeployment } = useProjects();

	return useMutation({
		mutationFn: (data: UpdateUserRequest) => {
			if (!selectedDeployment?.id || !userId) {
				throw new Error("No deployment or user selected");
			}
			return updateUser(selectedDeployment.id.toString(), userId, data);
		},
		onSuccess: (updatedUser) => {
			// Invalidate and update the user details query
			queryClient.invalidateQueries({
				queryKey: ["user-details", selectedDeployment?.id, userId],
			});

			// Optionally update the cache directly
			queryClient.setQueryData(
				["user-details", selectedDeployment?.id, userId],
				updatedUser,
			);

			// Also invalidate the users list to reflect any changes
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
	});
}
