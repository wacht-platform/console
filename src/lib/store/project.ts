import { create } from 'zustand'
import type { ProjectWithDeployments } from "@/types/project";
import type { Deployment } from "@/types/deployment";

interface ProjectState {
    projects: ProjectWithDeployments[] | undefined;
    isLoading: boolean;
    selectedProject: ProjectWithDeployments | null;
    selectedDeployment: Deployment | null;
    setSelectedProject: (project: ProjectWithDeployments | null) => void;
    setSelectedDeployment: (deployment: Deployment | null) => void;
    setProjects: (projects: ProjectWithDeployments[]) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: undefined,
    isLoading: false,
    selectedProject: null,
    selectedDeployment: null,

    setSelectedProject: (project) => set({ selectedProject: project }),
    setSelectedDeployment: (deployment) => set({ selectedDeployment: deployment }),

    setProjects: (projects) => {
        set({ projects });

        const { selectedProject } = get();
        if (!selectedProject && projects.length > 0) {
            set({
                selectedProject: projects[0],
                selectedDeployment: projects[0].deployments[0] || null
            });
        }
    }
}))