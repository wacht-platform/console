import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { toast } from "sonner";

export interface KnowledgeBase {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  deployment_id: string;
  configuration: Record<string, unknown>;
  documents_count: number;
  total_size: number;
}

export interface KnowledgeBaseDocument {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description?: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  knowledge_base_id: string;
  processing_metadata?: Record<string, unknown>;
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
  configuration?: Record<string, unknown>;
}

export interface UpdateKnowledgeBaseRequest {
  name?: string;
  description?: string;
  configuration?: Record<string, unknown>;
}

export interface KnowledgeBasesResponse {
  data: KnowledgeBase[];
  has_more: boolean;
}

export interface DocumentsResponse {
  data: KnowledgeBaseDocument[];
  has_more: boolean;
}

async function fetchKnowledgeBases(
  deploymentId: string,
  params?: {
    limit?: number;
    offset?: number;
    search?: string;
  },
): Promise<KnowledgeBasesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.search) searchParams.set("search", params.search);

  const { data } = await apiClient.get<KnowledgeBasesResponse>(
    `/deployments/${deploymentId}/ai/knowledge-bases?${searchParams.toString()}`,
  );
  return data;
}

async function fetchKnowledgeBase(
  deploymentId: string,
  knowledgeBaseId: string,
): Promise<KnowledgeBase> {
  const { data } = await apiClient.get<KnowledgeBase>(
    `/deployments/${deploymentId}/ai/knowledge-bases/${knowledgeBaseId}`,
  );
  return data;
}

async function createKnowledgeBase(
  deploymentId: string,
  request: CreateKnowledgeBaseRequest,
): Promise<KnowledgeBase> {
  const { data } = await apiClient.post<KnowledgeBase>(
    `/deployments/${deploymentId}/ai/knowledge-bases`,
    request,
  );
  return data;
}

async function updateKnowledgeBase(
  deploymentId: string,
  knowledgeBaseId: string,
  request: UpdateKnowledgeBaseRequest,
): Promise<KnowledgeBase> {
  const { data } = await apiClient.patch<KnowledgeBase>(
    `/deployments/${deploymentId}/ai/knowledge-bases/${knowledgeBaseId}`,
    request,
  );
  return data;
}

async function deleteKnowledgeBase(
  deploymentId: string,
  knowledgeBaseId: string,
): Promise<void> {
  await apiClient.delete(
    `/deployments/${deploymentId}/ai/knowledge-bases/${knowledgeBaseId}`,
  );
}

async function deleteDocument(
  deploymentId: string,
  knowledgeBaseId: string,
  documentId: string,
): Promise<void> {
  await apiClient.delete(
    `/deployments/${deploymentId}/ai/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`,
  );
}

async function fetchKnowledgeBaseDocuments(
  deploymentId: string,
  knowledgeBaseId: string,
  params?: {
    limit?: number;
    offset?: number;
  },
): Promise<DocumentsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const { data } = await apiClient.get<DocumentsResponse>(
    `/deployments/${deploymentId}/ai/knowledge-bases/${knowledgeBaseId}/documents?${searchParams.toString()}`,
  );
  return data;
}

async function fetchAgentKnowledgeBases(
  deploymentId: string,
  agentId: string,
): Promise<KnowledgeBasesResponse> {
  const { data } = await apiClient.get<KnowledgeBasesResponse>(
    `/deployments/${deploymentId}/ai/agents/${agentId}/knowledge-bases`,
  );
  return data;
}

async function uploadDocument(
  deploymentId: string,
  knowledgeBaseId: string,
  formData: FormData,
): Promise<KnowledgeBaseDocument> {
  const { data } = await apiClient.post<KnowledgeBaseDocument>(
    `/deployments/${deploymentId}/ai/knowledge-bases/${knowledgeBaseId}/documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return data;
}

async function attachKnowledgeBaseToAgent(
  deploymentId: string,
  agentId: string,
  knowledgeBaseId: string,
): Promise<void> {
  await apiClient.post(
    `/deployments/${deploymentId}/ai/agents/${agentId}/knowledge-bases/${knowledgeBaseId}`,
  );
}

async function detachKnowledgeBaseFromAgent(
  deploymentId: string,
  agentId: string,
  knowledgeBaseId: string,
): Promise<void> {
  await apiClient.delete(
    `/deployments/${deploymentId}/ai/agents/${agentId}/knowledge-bases/${knowledgeBaseId}`,
  );
}

export function useKnowledgeBases(params?: {
  limit?: number;
  offset?: number;
  search?: string;
}) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["knowledge-bases", selectedDeployment?.id, params],
    queryFn: () => fetchKnowledgeBases(selectedDeployment!.id, params),
    enabled: !!selectedDeployment?.id,
  });
}

export function useKnowledgeBase(knowledgeBaseId: string) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["knowledge-base", selectedDeployment?.id, knowledgeBaseId],
    queryFn: () => fetchKnowledgeBase(selectedDeployment!.id, knowledgeBaseId),
    enabled: !!selectedDeployment?.id && !!knowledgeBaseId,
  });
}

export function useAgentKnowledgeBases(agentId: string) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["agent-knowledge-bases", selectedDeployment?.id, agentId],
    queryFn: () => fetchAgentKnowledgeBases(selectedDeployment!.id, agentId),
    enabled: !!selectedDeployment?.id && !!agentId,
    select: (data) => data.data,
  });
}

export function useCreateKnowledgeBase() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateKnowledgeBaseRequest) =>
      createKnowledgeBase(selectedDeployment!.id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["knowledge-bases", selectedDeployment!.id],
      });
      toast.success("Knowledge base created successfully!");
    },
    onError: () => {
      toast.error("Failed to create knowledge base. Please try again.");
    },
  });
}

export function useUpdateKnowledgeBase(knowledgeBaseId: string) {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateKnowledgeBaseRequest) =>
      updateKnowledgeBase(selectedDeployment!.id, knowledgeBaseId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["knowledge-bases", selectedDeployment!.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["knowledge-base", selectedDeployment!.id, knowledgeBaseId],
      });
      toast.success("Knowledge base updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update knowledge base. Please try again.");
    },
  });
}

export function useDeleteKnowledgeBase() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (knowledgeBaseId: string) =>
      deleteKnowledgeBase(selectedDeployment!.id, knowledgeBaseId),
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: ["knowledge-bases", selectedDeployment!.id],
      });
      toast.success("Knowledge base deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete knowledge base. Please try again.");
    },
  });
}

export function useDeleteDocument(knowledgeBaseId: string) {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) =>
      deleteDocument(selectedDeployment!.id, knowledgeBaseId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "knowledge-base-documents",
          selectedDeployment!.id,
          knowledgeBaseId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["knowledge-base", selectedDeployment!.id, knowledgeBaseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["knowledge-bases", selectedDeployment!.id],
      });
      toast.success("Document deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete document. Please try again.");
    },
  });
}

export function useKnowledgeBaseDocuments(
  knowledgeBaseId: string,
  params?: {
    limit?: number;
    offset?: number;
  },
) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: [
      "knowledge-base-documents",
      selectedDeployment?.id,
      knowledgeBaseId,
      params,
    ],
    queryFn: () =>
      fetchKnowledgeBaseDocuments(
        selectedDeployment!.id,
        knowledgeBaseId,
        params,
      ),
    enabled: !!selectedDeployment?.id && !!knowledgeBaseId,
    select: (data) => ({
      documents: data.data,
      hasMore: data.has_more,
    }),
  });
}

export function useUploadDocument(knowledgeBaseId: string) {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      uploadDocument(selectedDeployment!.id, knowledgeBaseId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "knowledge-base-documents",
          selectedDeployment!.id,
          knowledgeBaseId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["knowledge-base", selectedDeployment!.id, knowledgeBaseId],
      });
      toast.success("Document uploaded successfully!");
    },
    onError: () => {
      toast.error("Failed to upload document. Please try again.");
    },
  });
}

export function useAttachKnowledgeBase(agentId: string) {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (knowledgeBaseId: string) =>
      attachKnowledgeBaseToAgent(
        selectedDeployment!.id,
        agentId,
        knowledgeBaseId,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["agent-knowledge-bases", selectedDeployment?.id, agentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["agent-details", selectedDeployment?.id, agentId],
      });
      toast.success("Knowledge base attached");
    },
    onError: () => {
      toast.error("Failed to attach knowledge base");
    },
  });
}

export function useDetachKnowledgeBase(agentId: string) {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (knowledgeBaseId: string) =>
      detachKnowledgeBaseFromAgent(
        selectedDeployment!.id,
        agentId,
        knowledgeBaseId,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["agent-knowledge-bases", selectedDeployment?.id, agentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["agent-details", selectedDeployment?.id, agentId],
      });
      toast.success("Knowledge base detached");
    },
    onError: () => {
      toast.error("Failed to detach knowledge base");
    },
  });
}
