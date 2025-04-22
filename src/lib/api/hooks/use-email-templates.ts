import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import { Template } from "@/data/email-templates";

export interface EmailTemplate {
  template_name: string;
  template_data: string;
  template_from: string;
  template_reply_to: string;
  template_subject: string;
}

// Convert backend EmailTemplate to frontend Template
export function backendToFrontendTemplate(backendTemplate: EmailTemplate): Template {
  return {
    name: backendTemplate.template_name,
    from: backendTemplate.template_from,
    replyTo: backendTemplate.template_reply_to,
    subject: backendTemplate.template_subject,
    body: backendTemplate.template_data,
  };
}

// Convert frontend Template to backend EmailTemplate
export function frontendToBackendTemplate(frontendTemplate: Template, templateName: string): EmailTemplate {
  return {
    template_name: frontendTemplate.name,
    template_from: frontendTemplate.from,
    template_reply_to: frontendTemplate.replyTo,
    template_subject: frontendTemplate.subject,
    template_data: frontendTemplate.body,
  };
}

// Map template IDs to backend template names
export const templateNameMap: Record<string, string> = {
  "workspace-invitation": "workspace_invite_template",
  "organization-invitation": "organization_invite_template",
  "email-otp": "verification_code_template",
  "password-reset": "reset_password_code_template",
  "email-changed": "primary_email_change_template",
  "password-changed": "password_change_template",
  "password-removed": "password_remove_template",
  "new-device-log-in": "sign_in_from_new_device_template",
  "magic-link": "magic_link_template",
  "waitlisted": "waitlist_signup_template",
  "waitlist-invite": "waitlist_invite_template",
  "invite-user": "invite_user_template",
};

async function fetchEmailTemplate(deploymentId: string, templateName: string): Promise<EmailTemplate> {
  const { data } = await apiClient.get<EmailTemplate>(
    `/deployments/${deploymentId}/email-templates/${templateName}`
  );
  return data;
}

async function updateEmailTemplate(
  deploymentId: string,
  templateName: string,
  template: EmailTemplate
): Promise<EmailTemplate> {
  const { data } = await apiClient.patch<EmailTemplate>(
    `/deployments/${deploymentId}/email-templates/${templateName}`,
    template
  );
  return data;
}

export function useEmailTemplate(templateId: string) {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();
  
  const backendTemplateName = templateNameMap[templateId];

  const { data: emailTemplate, isLoading, error } = useQuery({
    queryKey: ["email-template", selectedDeployment?.id, templateId],
    queryFn: () => fetchEmailTemplate(selectedDeployment!.id, backendTemplateName),
    enabled: !!selectedDeployment?.id && !!backendTemplateName,
  });

  const { mutateAsync: updateTemplate, isPending: isUpdating } = useMutation({
    mutationFn: (template: Template) => 
      updateEmailTemplate(
        selectedDeployment!.id, 
        backendTemplateName, 
        frontendToBackendTemplate(template, backendTemplateName)
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["email-template", selectedDeployment!.id, templateId] 
      });
    },
  });

  return {
    emailTemplate: emailTemplate ? backendToFrontendTemplate(emailTemplate) : undefined,
    isLoading,
    error,
    updateTemplate,
    isUpdating,
  };
}
