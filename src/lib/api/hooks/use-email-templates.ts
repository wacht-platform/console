import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import { EmailTemplate } from "@/types/deployment";

async function fetchEmailTemplate(deploymentId: string, templateId: string): Promise<EmailTemplate> {
  const { data } = await apiClient.get<EmailTemplate>(
    `/deployments/${deploymentId}/email-templates/${templateId}`
  );
  return data;
}

async function updateEmailTemplate(
  deploymentId: string,
  templateId: string,
  template: EmailTemplate
): Promise<EmailTemplate> {
  const { data } = await apiClient.patch<EmailTemplate>(
    `/deployments/${deploymentId}/email-templates/${templateId}`,
    template
  );
  return data;
}

export function useEmailTemplate(templateId: string) {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  const { data: emailTemplate, isLoading, error } = useQuery({
    queryKey: ["email-template", selectedDeployment?.id, templateId],
    queryFn: () => fetchEmailTemplate(selectedDeployment!.id, templateId),
    enabled: !!selectedDeployment?.id,
  });

  const { mutateAsync: updateTemplate, isPending: isUpdating } = useMutation({
    mutationFn: (template: EmailTemplate) =>
      updateEmailTemplate(
        selectedDeployment!.id,
        templateId,
        template
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["email-template", selectedDeployment!.id, templateId]
      });
    },
  });

  return {
    emailTemplate,
    isLoading,
    error,
    updateTemplate,
    isUpdating,
  };
}
