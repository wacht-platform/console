import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ProjectWithDeployments } from "@/types/project";
import type { Deployment } from "@/types/deployment";
import { useEffect, useCallback, useState } from "react";
import { useProjectStore } from "@/lib/store/project";

async function fetchProjects(): Promise<ProjectWithDeployments[]> {
	const { data } = await apiClient.get<{ data: ProjectWithDeployments[] }>(
		"/projects",
	);
	return data.data;
}

export function useProjects() {
	const queryClient = useQueryClient();
	const {
		projects,
		isLoading: storeIsLoading,
		selectedProject,
		selectedDeployment,
		setSelectedProject,
		setSelectedDeployment,
		setProjects,
		initializeFromUrl,
	} = useProjectStore();

	const {
		data: queryProjects,
		isLoading: queryIsLoading,
	} = useQuery({
		queryKey: ["projects"],
		queryFn: fetchProjects,
		refetchOnWindowFocus: false,
	});

	useEffect(() => {
		if (queryProjects) {
			setProjects(queryProjects);
		}
	}, [queryProjects, setProjects]);

	const createProject = useCallback(
		async (data: FormData) => {
			try {
				const response = await apiClient.post("/project", data);
				queryClient.invalidateQueries({ queryKey: ["projects"] });
				return response.data;
			} catch (error) {
				console.error("Error creating project:", error);
				throw error;
			}
		},
		[queryClient],
	);

	const deleteProject = useCallback(
		async (projectId: string) => {
			try {
				const response = await apiClient.delete(`/project/${projectId}`);
				queryClient.invalidateQueries({ queryKey: ["projects"] });
				return response.data;
			} catch (error) {
				console.error("Error deleting project:", error);
				throw error;
			}
		},
		[queryClient],
	);

	const deleteDeployment = useCallback(
		async (projectId: string, deploymentId: string) => {
			try {
				const response = await apiClient.delete(`/project/${projectId}/deployment/${deploymentId}`);
				queryClient.invalidateQueries({ queryKey: ["projects"] });
				return response.data;
			} catch (error) {
				console.error("Error deleting deployment:", error);
				throw error;
			}
		},
		[queryClient],
	);

	const isLoading = storeIsLoading || queryIsLoading;

	return {
		projects,
		isLoading,
		selectedProject,
		selectedDeployment,
		setSelectedProject,
		setSelectedDeployment,
		createProject,
		deleteProject,
		deleteDeployment,
		initializeFromUrl,
	};
}

interface CreateProductionDeploymentRequest {
	projectId: string;
	customDomain: string;
	authMethods: string[];
}

async function createProductionDeployment(
	request: CreateProductionDeploymentRequest,
): Promise<Deployment> {
	const { data } = await apiClient.post<Deployment>(
		`/project/${request.projectId}/production-deployment`,
		{
			custom_domain: request.customDomain,
			auth_methods: request.authMethods,
		},
	);
	return data;
}

export function useCreateProductionDeployment() {
	const [isLoading, setIsLoading] = useState(false);
	const queryClient = useQueryClient();

	const createDeployment = useCallback(
		async (request: CreateProductionDeploymentRequest) => {
			setIsLoading(true);
			try {
				const deployment = await createProductionDeployment(request);
				queryClient.invalidateQueries({ queryKey: ["projects"] });
				return deployment;
			} catch (error) {
				console.error("Error creating production deployment:", error);
				throw error;
			} finally {
				setIsLoading(false);
			}
		},
		[queryClient],
	);

	return {
		createProductionDeployment: createDeployment,
		isLoading,
	};
}
