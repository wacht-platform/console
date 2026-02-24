import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "../client";
import { WorkspaceRole } from "@/types/organization";
import { useProjects } from "./use-projects";

interface CreateWorkspaceRoleData {
  name: string;
  permissions: string[];
}

interface UpdateWorkspaceRoleData {
  name?: string;
  permissions?: string[];
}

export function useCreateWorkspaceRole() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: CreateWorkspaceRoleData;
    }) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      const response = await apiClient.post<WorkspaceRole>(
        `/deployments/${selectedDeployment.id}/workspaces/${workspaceId}/roles`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-details"],
      });
      toast.success("Workspace role created successfully");
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create workspace role";
      toast.error(message);
    },
  });
}

export function useUpdateWorkspaceRole() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      roleId,
      data,
    }: {
      workspaceId: string;
      roleId: string;
      data: UpdateWorkspaceRoleData;
    }) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      const response = await apiClient.patch<WorkspaceRole>(
        `/deployments/${selectedDeployment.id}/workspaces/${workspaceId}/roles/${roleId}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-details"],
      });
      toast.success("Workspace role updated successfully");
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update workspace role";
      toast.error(message);
    },
  });
}

export function useDeleteWorkspaceRole() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      roleId,
    }: {
      workspaceId: string;
      roleId: string;
    }) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      await apiClient.delete(
        `/deployments/${selectedDeployment.id}/workspaces/${workspaceId}/roles/${roleId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-details"],
      });
      toast.success("Workspace role deleted successfully");
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to delete workspace role";
      toast.error(message);
    },
  });
}
