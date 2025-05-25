import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "@/lib/api/hooks/use-projects";

interface OrganizationRole {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  permissions: string[];
}

interface OrganizationMemberDetails {
  id: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  user_id: string;
  roles: OrganizationRole[];
  first_name: string;
  last_name: string;
  username: string | null;
  primary_email_address: string | null;
  primary_phone_number: string | null;
  user_created_at: string;
}

interface Workspace {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  image_url: string;
  description: string;
  member_count: number;
  public_metadata: any;
  private_metadata: any;
}

interface OrganizationDetails {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  image_url: string;
  description: string;
  member_count: number;
  public_metadata: any;
  private_metadata: any;
  members: OrganizationMemberDetails[];
  roles: OrganizationRole[];
  workspaces: Workspace[];
}

async function fetchOrganizationDetails(
  deploymentId: string,
  organizationId: string
): Promise<OrganizationDetails> {
  const { data } = await apiClient.get<OrganizationDetails>(
    `/deployments/${deploymentId}/organizations/${organizationId}`
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
        organizationId
      );
    },
    enabled: !!selectedDeployment?.id && !!organizationId,
  });
}
