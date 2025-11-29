import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import { toast } from 'sonner';

interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number?: string;
  username?: string;
  password?: string;
}

interface InviteUserRequest {
  first_name: string;
  last_name: string;
  email_address: string;
  expiry_days?: number;
}



async function createUser(deploymentId: string, data: CreateUserRequest) {
  const response = await apiClient.post(
    `/deployments/${deploymentId}/users`,
    data
  );
  return response.data.data;
}

async function inviteUser(deploymentId: string, data: InviteUserRequest) {
  const response = await apiClient.post(
    `/deployments/${deploymentId}/invited-users`,
    data
  );
  return response.data.data;
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return createUser(selectedDeployment.id.toString(), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", selectedDeployment?.id] });
      toast.success("User created successfully!");
    },
    onError: () => {
      toast.error("Failed to create user. Please try again.");
    },
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (data: InviteUserRequest) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return inviteUser(selectedDeployment.id.toString(), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invited-users"] });
      toast.success("User invited successfully!");
    },
    onError: () => {
      toast.error("Failed to invite user. Please try again.");
    },
  });
}

async function deleteUser(deploymentId: string, userId: string) {
  const response = await apiClient.delete(
    `/deployments/${deploymentId}/users/${userId}`
  );
  return response.data;
}

async function deleteInvitation(deploymentId: string, invitationId: string) {
  const response = await apiClient.delete(
    `/deployments/${deploymentId}/invited-users/${invitationId}`
  );
  return response.data;
}

async function approveWaitlistUser(
  deploymentId: string,
  waitlistUserId: string
) {
  const response = await apiClient.post(
    `/deployments/${deploymentId}/user-waitlist/${waitlistUserId}/approve`
  );
  return response.data.data;
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (userId: string) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return deleteUser(selectedDeployment.id.toString(), userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", selectedDeployment?.id] });
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
      toast.success("User deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete user. Please try again.");
    },
  });
}

export function useDeleteInvitation() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (invitationId: string) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return deleteInvitation(selectedDeployment.id.toString(), invitationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invited-users"] });
      toast.success("Invitation withdrawn successfully!");
    },
    onError: () => {
      toast.error("Failed to withdraw invitation. Please try again.");
    },
  });
}

export function useApproveWaitlistUser() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (waitlistUserId: string) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return approveWaitlistUser(
        selectedDeployment.id.toString(),
        waitlistUserId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-waitlist", selectedDeployment?.id] });
      queryClient.invalidateQueries({ queryKey: ["users", selectedDeployment?.id] });
      toast.success("Waitlist user approved successfully!");
    },
    onError: () => {
      toast.error("Failed to approve waitlist user. Please try again.");
    },
  });
}

interface ImpersonateUserResponse {
  token: string;
  redirect_url: string;
}

async function impersonateUser(deploymentId: string, userId: string) {
  const response = await apiClient.post<ImpersonateUserResponse>(
    `/deployments/${deploymentId}/users/${userId}/impersonate`
  );
  return response.data;
}

export function useImpersonateUser() {
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (userId: string) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return impersonateUser(selectedDeployment.id.toString(), userId);
    },
    onError: () => {
      toast.error("Failed to start impersonation session");
    },
  });
}
