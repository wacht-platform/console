import { useQuery } from '@tanstack/react-query';
import { useProjects } from '@/lib/api/hooks/use-projects';
import { apiClient } from '@/lib/api/client';

export function useAgentToken() {
  const { selectedDeployment } = useProjects();

  const { data: token, refetch } = useQuery({
    queryKey: ['agent-token', selectedDeployment?.id],
    queryFn: async () => {
      const response = await apiClient.post(`/deployments/${selectedDeployment!.id}/token/user-agent-context`, {
        validity_hours: 24
      });
      return response.data.token;
    },
    enabled: !!selectedDeployment,
    staleTime: 23 * 60 * 60 * 1000, // 23 hours
    refetchOnWindowFocus: false,
  });

  const getAgentToken = async (): Promise<string> => {
    if (token) return token;
    const result = await refetch();
    return result.data!;
  };

  return { getAgentToken };
}