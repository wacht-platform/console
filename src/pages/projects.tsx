import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Navbar, NavbarSpacer } from "@/components/ui/navbar";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { ProjectWithDeployments } from "@/types/project";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { useProjectStore } from "@/lib/store/project";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { useState } from "react";
import { UserButton, OrganizationSwitcher } from "@snipextt/wacht";
import { Tab, SimpleTabs } from "@/components/ui/simple-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingFallback } from "@/components/loading-fallback";
import { PlusIcon, GlobeAltIcon, ClockIcon } from "@heroicons/react/24/outline";
import { AIAgentChat } from "@snipextt/wacht";

export default function ProjectsPage() {
  const { projects, isLoading } = useProjects();
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <LoadingFallback variant="detailed" message="Loading your projects..." />
    );
  }

  const productionDeployments =
    projects?.filter((project) =>
      project.deployments.some(
        (deployment) => deployment.mode === "production",
      ),
    ) || [];

  const stagingDeployments =
    projects?.filter((project) =>
      project.deployments.some((deployment) => deployment.mode === "staging"),
    ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar className="fixed z-50 top-0 left-0 right-0 bg-white border-b border-gray-200 h-14">
        <div className="max-w-7xl mx-auto w-full flex items-center px-8 h-full">
          <OrganizationSwitcher />
          <NavbarSpacer />
          <UserButton showName={false} />
        </div>
      </Navbar>

      {/* Main Content */}
      <div className="pt-14 max-w-7xl mx-auto px-8">
        {/* Header */}
        <div className="py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg text-gray-900">Projects</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your applications and deployments
              </p>
            </div>
            <Button
              onClick={() => setCreateProjectDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>New project</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <SimpleTabs>
            <Tab label="All projects">
              <div className="mt-6">
                {projects && projects.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {projects.map((project, index) => (
                      <ProjectItem
                        key={project.id}
                        {...project}
                        isLast={index === projects.length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No projects yet"
                    description="Create your first project to get started"
                    actionLabel="New project"
                    onAction={() => setCreateProjectDialogOpen(true)}
                  />
                )}
              </div>
            </Tab>

            <Tab label="Production">
              <div className="mt-6">
                {productionDeployments.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {productionDeployments.map((project, index) => (
                      <ProjectItem
                        key={project.id}
                        {...project}
                        highlightMode="production"
                        isLast={index === productionDeployments.length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No production deployments"
                    description="Deploy your first production environment"
                  />
                )}
              </div>
            </Tab>

            <Tab label="Staging">
              <div className="mt-6">
                {stagingDeployments.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {stagingDeployments.map((project, index) => (
                      <ProjectItem
                        key={project.id}
                        {...project}
                        highlightMode="staging"
                        isLast={index === stagingDeployments.length - 1}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No staging deployments"
                    description="Create a staging environment for testing"
                  />
                )}
              </div>
            </Tab>
          </SimpleTabs>
        </div>
      </div>

      <CreateProjectDialog
        open={createProjectDialogOpen}
        onClose={() => setCreateProjectDialogOpen(false)}
      />
    </div>
  );
}

interface ProjectItemProps extends ProjectWithDeployments {
  highlightMode?: "production" | "staging";
  isLast?: boolean;
}

function ProjectItem({
  name,
  image_url,
  deployments,
  created_at,
  id,
  highlightMode,
  isLast,
}: ProjectItemProps) {
  const navigate = useNavigate();
  const { setSelectedProject, setSelectedDeployment, projects } =
    useProjectStore();

  const navigateToProject = () => {
    let targetDeployment = highlightMode
      ? deployments.find((deployment) => deployment.mode === highlightMode)
      : deployments.find((deployment) => deployment.mode === "production") ||
        deployments[0];

    if (!targetDeployment) {
      targetDeployment = deployments[0];
    }

    const project = projects?.find((project) => project.id === id);
    if (project && targetDeployment) {
      setSelectedProject(project);
      setSelectedDeployment(targetDeployment);
      navigate(`/project/${id}/deployment/${targetDeployment.id}`);
    }
  };

  const productionDeployment = deployments.find((d) => d.mode === "production");
  const stagingDeployment = deployments.find((d) => d.mode === "staging");

  // Get the primary deployment URL
  const primaryDeployment =
    productionDeployment || stagingDeployment || deployments[0];

  return (
    <div
      onClick={navigateToProject}
      className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${!isLast ? "border-b border-gray-200" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            className="w-10 h-10"
            initials={name.charAt(0)}
            src={image_url}
          />
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-900">{name}</h3>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                <span>{format(new Date(created_at), "MMM d, yyyy")}</span>
              </div>
              {primaryDeployment && (
                <div className="flex items-center gap-1">
                  <GlobeAltIcon className="w-3 h-3" />
                  <span className="truncate max-w-xs">
                    {primaryDeployment.frontend_host}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {productionDeployment && (
            <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
              Production
            </Badge>
          )}
          {stagingDeployment && (
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
              Staging
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
