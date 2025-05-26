import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "@/lib/api/hooks/use-projects";
import type { OrganizationDetails } from "@/types/organization";

async function fetchOrganizationDetails(
	deploymentId: string,
	organizationId: string,
): Promise<OrganizationDetails> {
	const { data } = await apiClient.get<OrganizationDetails>(
		`/deployments/${deploymentId}/organizations/${organizationId}`,
	);
	return data;
}

export function useOrganizationDetails(organizationId: string | undefined) {
	const { selectedDeployment } = useProjects();

	return useQuery({
		queryKey: ["organization-details", selectedDeployment?.id, organizationId],
		queryFn: () => {
			if (!selectedDeployment?.id || !organizationId) {
				throw new Error("No deployment or organization selected");
			}
			return fetchOrganizationDetails(
				selectedDeployment.id.toString(),
				organizationId,
			);
		},
		enabled: !!selectedDeployment?.id && !!organizationId,
	});
}
