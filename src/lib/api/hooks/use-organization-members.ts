import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "@/lib/api/hooks/use-projects";
import type { OrganizationMemberDetails } from "@/types/organization";

interface PaginatedResponse<T> {
	data: T[];
	has_more: boolean;
}

async function fetchOrganizationMembers(
	deploymentId: string,
	organizationId: string,
	offset: number = 0,
	limit: number = 20,
): Promise<PaginatedResponse<OrganizationMemberDetails>> {
	const { data } = await apiClient.get<PaginatedResponse<OrganizationMemberDetails>>(
		`/deployments/${deploymentId}/organizations/${organizationId}/members`,
		{
			params: { offset, limit },
		}
	);
	return data;
}

export function useOrganizationMembers(
	organizationId: string | undefined,
	offset: number = 0,
	limit: number = 20,
	enabled: boolean = true,
) {
	const { selectedDeployment } = useProjects();

	return useQuery({
		queryKey: ["organization-members", selectedDeployment?.id, organizationId, offset, limit],
		queryFn: () => {
			if (!selectedDeployment?.id || !organizationId) {
				throw new Error("No deployment or organization selected");
			}
			return fetchOrganizationMembers(
				selectedDeployment.id.toString(),
				organizationId,
				offset,
				limit,
			);
		},
		enabled: enabled && !!selectedDeployment?.id && !!organizationId,
	});
}