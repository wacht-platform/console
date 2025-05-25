import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";

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

interface AddToWaitlistRequest {
  first_name: string;
  last_name: string;
  email_address: string;
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

async function addToWaitlist(deploymentId: string, data: AddToWaitlistRequest) {
  const response = await apiClient.post(
    `/deployments/${deploymentId}/user-waitlist`,
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
      queryClient.invalidateQueries({ queryKey: ["users"] });
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
    },
  });
}

export function useAddToWaitlist() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (data: AddToWaitlistRequest) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return addToWaitlist(selectedDeployment.id.toString(), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-waitlist"] });
    },
  });
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
      queryClient.invalidateQueries({ queryKey: ["user-waitlist"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
