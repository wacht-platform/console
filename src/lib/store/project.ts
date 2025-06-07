import { create } from 'zustand'
import type { ProjectWithDeployments } from "@/types/project";
import type { Deployment } from "@/types/deployment";

interface ProjectState {
    projects: ProjectWithDeployments[] | undefined;
    isLoading: boolean;
    selectedProject: ProjectWithDeployments | null;
    selectedDeployment: Deployment | null;
    setSelectedProject: (project: ProjectWithDeployments | null, navigate?: boolean) => void;
    setSelectedDeployment: (deployment: Deployment | null, navigate?: boolean) => void;
    setProjects: (projects: ProjectWithDeployments[]) => void;
    initializeFromUrl: (projectId: string, deploymentId: string) => void;
    navigateToSelection: () => void;
}

// Store navigation function reference to avoid circular dependencies
let navigationFunction: ((path: string) => void) | null = null;

export const setNavigationFunction = (navigate: (path: string) => void) => {
    navigationFunction = navigate;
};

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: undefined,
    isLoading: false,
    selectedProject: null,
    selectedDeployment: null,

    setSelectedProject: (project, navigate = true) => {
        set({ selectedProject: project });

        if (navigate && project && navigationFunction) {
            // If we have a project but no deployment, select the first one
            const { selectedDeployment } = get();
            const targetDeployment = selectedDeployment || project.deployments[0];

            if (targetDeployment) {
                set({ selectedDeployment: targetDeployment });
                navigationFunction(`/project/${project.id}/deployment/${targetDeployment.id}`);
            }
        }
    },

    setSelectedDeployment: (deployment, navigate = true) => {
        set({ selectedDeployment: deployment });

        if (navigate && deployment && navigationFunction) {
            const { selectedProject } = get();
            if (selectedProject) {
                navigationFunction(`/project/${selectedProject.id}/deployment/${deployment.id}`);
            }
        }
    },

    setProjects: (projects) => {
        set({ projects });

        const { selectedProject } = get();
        if (!selectedProject && projects.length > 0) {
            set({
                selectedProject: projects[0],
                selectedDeployment: projects[0].deployments[0] || null
            });
        }
    },

    initializeFromUrl: (projectId: string, deploymentId: string) => {
        const { projects } = get();
        if (!projects) return;

        const project = projects.find(p => p.id === projectId);
        if (project) {
            const deployment = project.deployments.find(d => d.id === deploymentId);
            if (deployment) {
                // Set without navigation to avoid infinite loops
                set({
                    selectedProject: project,
                    selectedDeployment: deployment
                });
            }
        }
    },

    navigateToSelection: () => {
        const { selectedProject, selectedDeployment } = get();
        if (selectedProject && selectedDeployment && navigationFunction) {
            navigationFunction(`/project/${selectedProject.id}/deployment/${selectedDeployment.id}`);
        }
    }
}))