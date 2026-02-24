import { create } from "zustand";
import type { ProjectWithDeployments } from "@/types/project";
import type { Deployment } from "@/types/deployment";

interface ProjectState {
    projects: ProjectWithDeployments[] | undefined;
    isLoading: boolean;
    selectedProject: ProjectWithDeployments | null;
    selectedDeployment: Deployment | null;
    notFound: boolean;
    setSelectedProject: (
        project: ProjectWithDeployments | null,
        navigate?: boolean,
    ) => void;
    setSelectedDeployment: (
        deployment: Deployment | null,
        navigate?: boolean,
    ) => void;
    setProjects: (projects: ProjectWithDeployments[]) => void;
    initializeFromUrl: (projectId: string, deploymentId: string) => void;
    setNotFound: (notFound: boolean) => void;
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
    notFound: false,

    setSelectedProject: (project, navigate = true) => {
        set({ selectedProject: project, notFound: false });

        if (navigate && project && navigationFunction) {
            const { selectedDeployment } = get();
            const targetDeployment =
                selectedDeployment || project.deployments[0];

            if (targetDeployment) {
                set({ selectedDeployment: targetDeployment });
                navigationFunction(
                    `/project/${project.id}/deployment/${targetDeployment.id}`,
                );
            }
        }
    },

    setSelectedDeployment: (deployment, navigate = true) => {
        set({ selectedDeployment: deployment, notFound: false });

        if (navigate && deployment && navigationFunction) {
            const { selectedProject } = get();
            if (selectedProject) {
                navigationFunction(
                    `/project/${selectedProject.id}/deployment/${deployment.id}`,
                );
            }
        }
    },

    setProjects: (projects) => {
        set({ projects });
    },

    initializeFromUrl: (projectId: string, deploymentId: string) => {
        const { projects } = get();
        if (!projects) return;

        const project = projects.find((p) => p.id === projectId);
        if (!project) {
            set({ notFound: true });
            return;
        }

        const deployment = project.deployments.find(
            (d) => d.id === deploymentId,
        );
        if (!deployment) {
            set({ notFound: true });
            return;
        }

        // Set without navigation to avoid infinite loops
        set({
            selectedProject: project,
            selectedDeployment: deployment,
            notFound: false,
        });
    },

    setNotFound: (notFound: boolean) => {
        set({ notFound });
    },

    navigateToSelection: () => {
        const { selectedProject, selectedDeployment } = get();
        if (selectedProject && selectedDeployment && navigationFunction) {
            navigationFunction(
                `/project/${selectedProject.id}/deployment/${selectedDeployment.id}`,
            );
        }
    },
}));
