import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useProjects } from "./use-projects";
import { toast } from 'sonner';
import { 
  Segment, 
  CreateSegmentRequest, 
  UpdateSegmentRequest,
  SegmentType,
  AnalyzeRequest,
  AnalyzedEntity,
} from "@/types/segment";
import { QueryParams, PaginatedResponse } from "@/types/api";

// Fetch Segments
async function fetchSegments(deploymentId: string, params: QueryParams): Promise<Segment[]> {
  const response = await apiClient.get<{ data: Segment[] }>(
    `/deployments/${deploymentId}/segments`,
    { params }
  );
  return response.data.data;
}

// Create Segment
async function createSegment(
  deploymentId: string,
  data: CreateSegmentRequest
): Promise<Segment> {
  const response = await apiClient.post<{ data: Segment }>(
    `/deployments/${deploymentId}/segments`,
    data
  );
  return response.data.data;
}

// Update Segment
async function updateSegment(
  deploymentId: string,
  segmentId: string,
  data: UpdateSegmentRequest
): Promise<Segment> {
  const response = await apiClient.patch<{ data: Segment }>(
    `/deployments/${deploymentId}/segments/${segmentId}`,
    data
  );
  return response.data.data;
}

// Delete Segment
async function deleteSegment(
  deploymentId: string,
  segmentId: string
): Promise<void> {
  await apiClient.delete(
    `/deployments/${deploymentId}/segments/${segmentId}`
  );
}

// Assign Segment
async function assignSegment(
  deploymentId: string,
  targetId: string,
  segmentId: string
): Promise<void> {
  // The backend expects POST /deployments/:deploymentId/segments/:segmentId/assign
  // with body { entity_id: targetId }
  const endpoint = `/deployments/${deploymentId}/segments/${segmentId}/assign`;
  await apiClient.post(endpoint, { entity_id: targetId });
}

// Remove Segment
async function removeSegment(
  deploymentId: string,
  targetId: string,
  segmentId: string
): Promise<void> {
  // The backend expects POST /deployments/:deploymentId/segments/:segmentId/remove
  // with body { entity_id: targetId }
  const endpoint = `/deployments/${deploymentId}/segments/${segmentId}/remove`;
  await apiClient.post(endpoint, { entity_id: targetId });
}


// Analyze Segments
async function analyzeSegments(
  deploymentId: string,
  data: AnalyzeRequest
): Promise<PaginatedResponse<AnalyzedEntity>> {
  const response = await apiClient.post<PaginatedResponse<AnalyzedEntity>>(
    `/deployments/${deploymentId}/segments/analyze`,
    data
  );
  return response.data;
}

// Hooks

export function useSegments(params: QueryParams = {}) {
  const { selectedDeployment } = useProjects();
  
  return useQuery({
    queryKey: ["segments", selectedDeployment?.id, params],
    queryFn: () => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return fetchSegments(selectedDeployment.id.toString(), params);
    },
    enabled: !!selectedDeployment?.id,
  });
}

export function useCreateSegment() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (data: CreateSegmentRequest) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return createSegment(selectedDeployment.id.toString(), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segments"] });
      toast.success("Segment created successfully");
    },
    onError: () => {
      toast.error("Failed to create segment");
    },
  });
}

export function useUpdateSegment() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: ({ segmentId, data }: { segmentId: string; data: UpdateSegmentRequest }) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return updateSegment(selectedDeployment.id.toString(), segmentId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segments"] });
      toast.success("Segment updated successfully");
    },
    onError: () => {
      toast.error("Failed to update segment");
    },
  });
}

export function useDeleteSegment() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (segmentId: string) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return deleteSegment(selectedDeployment.id.toString(), segmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["segments"] });
      // Invalidate all entity details queries to ensure deleted segments are removed from UI
      queryClient.invalidateQueries({ queryKey: ["organization-details"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-details"] });
      queryClient.invalidateQueries({ queryKey: ["user-details"] });
      toast.success("Segment deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete segment");
    },
  });
}

export function useAssignSegment() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: ({ targetId, segmentId }: { targetId: string; targetType: SegmentType; segmentId: string }) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return assignSegment(selectedDeployment.id.toString(), targetId, segmentId);
    },
    onSuccess: (_, { targetId, targetType }) => {
      // Invalidate relevant queries (org details or workspace details)
      if (targetType === 'organization') {
        queryClient.invalidateQueries({ queryKey: ["organization-details", selectedDeployment?.id, targetId] });
      } else if (targetType === 'workspace') {
        queryClient.invalidateQueries({ queryKey: ["workspace-details", selectedDeployment?.id, targetId] });
      } else if (targetType === 'user') {
        queryClient.invalidateQueries({ queryKey: ["user-details", selectedDeployment?.id, targetId] });
      }
      queryClient.invalidateQueries({ queryKey: ["segments"] }); // Just in case
      toast.success("Segment assigned successfully");
    },
    onError: () => {
      toast.error("Failed to assign segment");
    },
  });
}

export function useRemoveSegment() {
  const queryClient = useQueryClient();
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: ({ targetId, segmentId }: { targetId: string; targetType: SegmentType; segmentId: string }) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return removeSegment(selectedDeployment.id.toString(), targetId, segmentId);
    },
    onSuccess: (_, { targetId, targetType }) => {
      if (targetType === 'organization') {
        queryClient.invalidateQueries({ queryKey: ["organization-details", selectedDeployment?.id, targetId] });
      } else if (targetType === 'workspace') {
        queryClient.invalidateQueries({ queryKey: ["workspace-details", selectedDeployment?.id, targetId] });
      } else if (targetType === 'user') {
         queryClient.invalidateQueries({ queryKey: ["user-details", selectedDeployment?.id, targetId] });
      }
      queryClient.invalidateQueries({ queryKey: ["segments"] });
      toast.success("Segment removed successfully");
    },
    onError: () => {
      toast.error("Failed to remove segment");
    },
  });
}

export function useAnalyzeSegments() {
  const { selectedDeployment } = useProjects();

  return useMutation({
    mutationFn: (data: AnalyzeRequest) => {
      if (!selectedDeployment?.id) {
        throw new Error("No deployment selected");
      }
      return analyzeSegments(selectedDeployment.id.toString(), data);
    },
    onError: () => {
      toast.error("Failed to analyze segments");
    },
  });
}
