import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import type { PaginatedResponse } from "@/types/api";
import type {
  AiWorkflow,
  AiWorkflowWithDetails,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  ExecuteWorkflowRequest,
  WorkflowExecution
} from "@/types/workflow";
import { useProjects } from "./use-projects";

interface GetWorkflowsParams {
  limit?: number;
  offset?: number;
  search?: string;
}

async function fetchWorkflows(
  deploymentId: string,
  params: GetWorkflowsParams = {}
): Promise<PaginatedResponse<AiWorkflowWithDetails>> {
  const { data } = await apiClient.get<PaginatedResponse<AiWorkflowWithDetails>>(
    `/deployment/${deploymentId}/ai-workflows`,
    { params }
  );
  return data;
}

async function fetchWorkflowById(
  deploymentId: string,
  workflowId: string
): Promise<AiWorkflow> {
  const { data } = await apiClient.get<{ data: AiWorkflow }>(
    `/deployment/${deploymentId}/ai-workflows/${workflowId}`
  );
  return data.data;
}

async function createWorkflow(
  deploymentId: string,
  workflow: CreateWorkflowRequest
): Promise<AiWorkflow> {
  const { data } = await apiClient.post<{ data: AiWorkflow }>(
    `/deployment/${deploymentId}/ai-workflows`,
    workflow
  );
  return data.data;
}

async function updateWorkflow(
  deploymentId: string,
  workflowId: string,
  workflow: UpdateWorkflowRequest
): Promise<AiWorkflow> {
  const { data } = await apiClient.put<{ data: AiWorkflow }>(
    `/deployment/${deploymentId}/ai-workflows/${workflowId}`,
    workflow
  );
  return data.data;
}

async function deleteWorkflow(
  deploymentId: string,
  workflowId: string
): Promise<void> {
  await apiClient.delete(`/deployment/${deploymentId}/ai-workflows/${workflowId}`);
}

async function executeWorkflow(
  deploymentId: string,
  workflowId: string,
  request: ExecuteWorkflowRequest
): Promise<WorkflowExecution> {
  const { data } = await apiClient.post<{ data: WorkflowExecution }>(
    `/deployment/${deploymentId}/ai-workflows/${workflowId}/execute`,
    request
  );
  return data.data;
}

async function fetchWorkflowExecutions(
  deploymentId: string,
  workflowId: string,
  params: GetWorkflowsParams = {}
): Promise<PaginatedResponse<WorkflowExecution>> {
  const { data } = await apiClient.get<PaginatedResponse<WorkflowExecution>>(
    `/deployment/${deploymentId}/ai-workflows/${workflowId}/executions`,
    { params }
  );
  return data;
}

export function useWorkflows(params: GetWorkflowsParams = {}) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["workflows", selectedDeployment?.id, params],
    queryFn: () => fetchWorkflows(selectedDeployment!.id, params),
    enabled: !!selectedDeployment?.id,
    select: (data) => ({
      workflows: data.data,
      hasMore: data.has_more,
    }),
  });
}

export function useWorkflow(workflowId: string) {
  const { selectedDeployment } = useProjects();
  
  return useQuery({
    queryKey: ["workflow", selectedDeployment?.id, workflowId],
    queryFn: () => fetchWorkflowById(selectedDeployment!.id, workflowId),
    enabled: !!selectedDeployment?.id && !!workflowId,
  });
}

export function useCreateWorkflow() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflow: CreateWorkflowRequest) =>
      createWorkflow(selectedDeployment!.id, workflow),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows", selectedDeployment?.id] });
    },
  });
}

export function useUpdateWorkflow() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workflowId, workflow }: { workflowId: string; workflow: UpdateWorkflowRequest }) =>
      updateWorkflow(selectedDeployment!.id, workflowId, workflow),
    onSuccess: (_, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: ["workflows", selectedDeployment?.id] });
      queryClient.invalidateQueries({ queryKey: ["workflow", selectedDeployment?.id, workflowId] });
    },
  });
}

export function useDeleteWorkflow() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflowId: string) =>
      deleteWorkflow(selectedDeployment!.id, workflowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows", selectedDeployment?.id] });
    },
  });
}

export function useExecuteWorkflow() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workflowId, request }: { workflowId: string; request: ExecuteWorkflowRequest }) =>
      executeWorkflow(selectedDeployment!.id, workflowId, request),
    onSuccess: (_, { workflowId }) => {
      queryClient.invalidateQueries({ queryKey: ["workflow-executions", selectedDeployment?.id, workflowId] });
      queryClient.invalidateQueries({ queryKey: ["workflows", selectedDeployment?.id] });
    },
  });
}

export function useWorkflowExecutions(workflowId: string, params: GetWorkflowsParams = {}) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["workflow-executions", selectedDeployment?.id, workflowId, params],
    queryFn: () => fetchWorkflowExecutions(selectedDeployment!.id, workflowId, params),
    enabled: !!selectedDeployment?.id && !!workflowId,
    select: (data) => ({
      executions: data.data,
      hasMore: data.has_more,
    }),
  });
}
