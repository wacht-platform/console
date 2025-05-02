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
import { Heading } from "@/components/ui/heading";

export default function ProjectsPage() {
  const { projects, isLoading } = useProjects();
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const productionDeployments =
    projects?.filter((project) =>
      project.deployments.some((deployment) => deployment.mode === "production")
    ) || [];

  const stagingDeployments =
    projects?.filter((project) =>
      project.deployments.some((deployment) => deployment.mode === "staging")
    ) || [];

  return (
    <div className="mx-auto px-8 pt-24 space-y-4">
      <Navbar className="fixed z-10 top-0 left-0 right-0 border-b border-slate-200 bg-white px-8 py-3">
        <OrganizationSwitcher />
        <NavbarSpacer />
        <UserButton showName={false} />
      </Navbar>
      <div className="flex items-center justify-between">
        <Heading>Your Projects</Heading>
        <Button onClick={() => setCreateProjectDialogOpen(true)}>
          <span>Create Project</span>
        </Button>
      </div>

      <div className="w-full">
        <SimpleTabs>
          <Tab label="All Projects">
            <div>
              {projects && projects.length > 0 ? (
                <div className="flex flex-col space-y-2">
                  {projects.map((project) => (
                    <ApplicationListItem key={project.id} {...project} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No projects found"
                  description="Get started by creating your first project"
                  actionLabel="Create project"
                  onAction={() => setCreateProjectDialogOpen(true)}
                />
              )}
            </div>
          </Tab>

          <Tab label="Production Deployments">
            <div>
              {productionDeployments.length > 0 ? (
                <div className="flex flex-col space-y-2">
                  {productionDeployments.map((project) => (
                    <ApplicationListItem
                      key={project.id}
                      {...project}
                      highlightMode="production"
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No production deployments"
                  description="Create a project with a production deployment"
                />
              )}
            </div>
          </Tab>

          <Tab label="Staging Deployments">
            <div>
              {stagingDeployments.length > 0 ? (
                <div className="flex flex-col space-y-2">
                  {stagingDeployments.map((project) => (
                    <ApplicationListItem
                      key={project.id}
                      {...project}
                      highlightMode="staging"
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No staging deployments"
                  description="Create a project with a staging deployment"
                />
              )}
            </div>
          </Tab>
        </SimpleTabs>
      </div>

      <CreateProjectDialog
        open={createProjectDialogOpen}
        onClose={() => setCreateProjectDialogOpen(false)}
      />
    </div>
  );
}

interface ApplicationListItemProps extends ProjectWithDeployments {
  highlightMode?: "production" | "staging";
}

function ApplicationListItem({
  name,
  image_url,
  deployments,
  created_at,
  id,
  highlightMode,
}: ApplicationListItemProps) {
  const navigate = useNavigate();
  const { setSelectedProject, setSelectedDeployment, projects } =
    useProjectStore();

  const navigateToProject = () => {
    // If highlightMode is specified, prioritize that deployment type
    let targetDeployment = highlightMode
      ? deployments.find((deployment) => deployment.mode === highlightMode)
      : deployments.find((deployment) => deployment.mode === "production") ||
        deployments[0];

    // Fallback if no matching deployment found
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

  // Get badge color based on deployment mode
  const getBadgeClass = (mode: string) => {
    if (mode === "production") {
      return "gap-1 border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/50 dark:text-green-400";
    } else if (mode === "staging") {
      return "gap-1 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-400";
    }
    return "gap-1 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-400";
  };

  // Find deployments to highlight
  const productionDeployment = deployments.find((d) => d.mode === "production");
  const stagingDeployment = deployments.find((d) => d.mode === "staging");

  // Determine which deployment to show in the URL
  const displayDeployment =
    highlightMode === "staging" && stagingDeployment
      ? stagingDeployment
      : productionDeployment || deployments[0];

  return (
    <div
      onClick={navigateToProject}
      className="cursor-pointer group flex items-center justify-between py-4 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
    >
      <div className="flex items-center gap-4">
        <Avatar className="w-8 h-8" initials={name.charAt(0)} src={image_url} />
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white">
            {name}
          </h3>
          <div className="flex items-center gap-2">
            <Badge className={getBadgeClass(displayDeployment.mode)}>
              https://{displayDeployment.frontend_host}
            </Badge>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Created {format(new Date(created_at), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {productionDeployment && (
          <Badge className={getBadgeClass("production")}>Production</Badge>
        )}
        {stagingDeployment && (
          <Badge className={getBadgeClass("staging")}>Staging</Badge>
        )}
        <Badge className="gap-1 border-gray-200 bg-gray-50 text-gray-700">
          {deployments.length} deployment{deployments.length !== 1 ? "s" : ""}
        </Badge>
      </div>
    </div>
  );
}
