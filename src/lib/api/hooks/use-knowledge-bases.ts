import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useProjects } from "@/lib/api/hooks/use-projects";

export interface KnowledgeBase {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  deployment_id: string;
  configuration: Record<string, any>;
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
  processing_metadata?: Record<string, any>;
  usage_count: number;
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
  configuration?: Record<string, any>;
}

export interface UpdateKnowledgeBaseRequest {
  name?: string;
  description?: string;
  configuration?: Record<string, any>;
}

export interface KnowledgeBasesResponse {
  data: KnowledgeBase[];
  has_more: boolean;
}

async function fetchKnowledgeBases(
  deploymentId: string,
  params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }
): Promise<KnowledgeBasesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.search) searchParams.set("search", params.search);

  const { data } = await apiClient.get<KnowledgeBasesResponse>(
    `/deployment/${deploymentId}/ai-knowledge-bases?${searchParams.toString()}`
  );
  return data;
}

async function fetchKnowledgeBase(
  deploymentId: string,
  knowledgeBaseId: string
): Promise<KnowledgeBase> {
  const { data } = await apiClient.get<KnowledgeBase>(
    `/deployment/${deploymentId}/ai-knowledge-bases/${knowledgeBaseId}`
  );
  return data;
}

async function createKnowledgeBase(
  deploymentId: string,
  request: CreateKnowledgeBaseRequest
): Promise<KnowledgeBase> {
  const { data } = await apiClient.post<KnowledgeBase>(
    `/deployment/${deploymentId}/ai-knowledge-bases`,
    request
  );
  return data;
}

async function updateKnowledgeBase(
  deploymentId: string,
  knowledgeBaseId: string,
  request: UpdateKnowledgeBaseRequest
): Promise<KnowledgeBase> {
  const { data } = await apiClient.patch<KnowledgeBase>(
    `/deployment/${deploymentId}/ai-knowledge-bases/${knowledgeBaseId}`,
    request
  );
  return data;
}

async function deleteKnowledgeBase(
  deploymentId: string,
  knowledgeBaseId: string
): Promise<void> {
  await apiClient.delete(
    `/deployment/${deploymentId}/ai-knowledge-bases/${knowledgeBaseId}`
  );
}

async function fetchKnowledgeBaseDocuments(
  deploymentId: string,
  knowledgeBaseId: string,
  params?: {
    limit?: number;
    offset?: number;
  }
): Promise<KnowledgeBaseDocument[]> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const { data } = await apiClient.get<KnowledgeBaseDocument[]>(
    `/deployment/${deploymentId}/ai-knowledge-bases/${knowledgeBaseId}/documents?${searchParams.toString()}`
  );
  return data;
}

async function uploadDocument(
  deploymentId: string,
  knowledgeBaseId: string,
  formData: FormData
): Promise<KnowledgeBaseDocument> {
  const { data } = await apiClient.post<KnowledgeBaseDocument>(
    `/deployment/${deploymentId}/ai-knowledge-bases/${knowledgeBaseId}/documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return data;
}

export function useKnowledgeBases(
  params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }
) {
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
    },
  });
}

export function useDeleteKnowledgeBase() {
  const { selectedDeployment } = useProjects();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (knowledgeBaseId: string) =>
      deleteKnowledgeBase(selectedDeployment!.id, knowledgeBaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["knowledge-bases", selectedDeployment!.id],
      });
    },
  });
}

export function useKnowledgeBaseDocuments(
  knowledgeBaseId: string,
  params?: {
    limit?: number;
    offset?: number;
  }
) {
  const { selectedDeployment } = useProjects();

  return useQuery({
    queryKey: ["knowledge-base-documents", selectedDeployment?.id, knowledgeBaseId, params],
    queryFn: () => fetchKnowledgeBaseDocuments(selectedDeployment!.id, knowledgeBaseId, params),
    enabled: !!selectedDeployment?.id && !!knowledgeBaseId,
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
        queryKey: ["knowledge-base-documents", selectedDeployment!.id, knowledgeBaseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["knowledge-base", selectedDeployment!.id, knowledgeBaseId],
      });
    },
  });
}
