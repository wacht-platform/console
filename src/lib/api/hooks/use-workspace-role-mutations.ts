import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "../client";
import { WorkspaceRole } from "@/types/organization";

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

  return useMutation({
    mutationFn: async ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: CreateWorkspaceRoleData;
    }) => {
      const response = await apiClient.post<WorkspaceRole>(
        `/workspaces/${workspaceId}/roles`,
        data
      );
      return response.data;
    },
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-details", workspaceId],
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
      const response = await apiClient.patch<WorkspaceRole>(
        `/workspaces/${workspaceId}/roles/${roleId}`,
        data
      );
      return response.data;
    },
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-details", workspaceId],
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

  return useMutation({
    mutationFn: async ({
      workspaceId,
      roleId,
    }: {
      workspaceId: string;
      roleId: string;
    }) => {
      await apiClient.delete(`/workspaces/${workspaceId}/roles/${roleId}`);
    },
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-details", workspaceId],
      });
      toast.success("Workspace role deleted successfully");
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to delete workspace role";
      toast.error(message);
    },
  });
}
