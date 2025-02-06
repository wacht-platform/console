import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ProjectWithDeployments } from "@/types/project";
import { useEffect, useState } from "react";
import type { Deployment } from "@/types/deployment";

async function fetchProjects(): Promise<ProjectWithDeployments[]> {
  const { data } = await apiClient.get<{ data: ProjectWithDeployments[] }>(
    "/projects",
  );
  return data.data;
}

export function useProjectAndDeployments() {
  const [selectedProject, setSelectedProject] =
    useState<ProjectWithDeployments | null>(null);
  const [selectedDeployment, setSelectedDeployment] =
    useState<Deployment | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  useEffect(() => {
    if (isLoading || selectedProject) return;
    const project = projects?.[0];
    if (!project) return;
    setSelectedProject(project);
    setSelectedDeployment(project.deployments[0]);
  }, [isLoading, projects, selectedProject]);

  return {
    projects,
    isLoading,
    selectedProject,
    selectedDeployment,
    setSelectedProject,
    setSelectedDeployment,
  };
}
