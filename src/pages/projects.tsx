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
import { BillingSetupDialog } from "@/components/billing-setup-dialog";
import { useState } from "react";
import { UserButton, OrganizationSwitcher } from "@wacht/react-router";
import { useBillingAccount } from "@/lib/api/hooks/use-billing";
import { Tab, SimpleTabs } from "@/components/ui/simple-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { PlusIcon, GlobeAltIcon, ClockIcon } from "@heroicons/react/24/outline";

export default function ProjectsPage() {
  const { projects, isLoading } = useProjects();
  const { data: billingAccount } = useBillingAccount();
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [billingSetupDialogOpen, setBillingSetupDialogOpen] = useState(false);

  const handleCreateProject = () => {
    if (!billingAccount) {
      // No billing account exists, show billing setup first
      setBillingSetupDialogOpen(true);
    } else {
      // Billing account exists, proceed with project creation
      setCreateProjectDialogOpen(true);
    }
  };

  const handleBillingSetupSuccess = () => {
    setBillingSetupDialogOpen(false);
    // After billing is set up, you might want to automatically open project creation
    // or just close and let user click create project again
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Loading your projects...
          </span>
        </div>
      </div>
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Navbar */}
      <Navbar className="fixed z-50 top-0 left-0 right-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 h-14">
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
              <h1 className="text-lg text-neutral-900 dark:text-neutral-100">
                Projects
              </h1>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Manage your applications and deployments
              </p>
            </div>
            <Button
              onClick={handleCreateProject}
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
                  <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
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
                    onAction={handleCreateProject}
                  />
                )}
              </div>
            </Tab>

            <Tab label="Production">
              <div className="mt-6">
                {productionDeployments.length > 0 ? (
                  <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
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
                  <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
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

      <BillingSetupDialog
        open={billingSetupDialogOpen}
        onClose={() => setBillingSetupDialogOpen(false)}
        onSuccess={handleBillingSetupSuccess}
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
      className={`px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors ${!isLast ? "border-b border-neutral-200 dark:border-neutral-800" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            className="w-10 h-10"
            initials={name.charAt(0)}
            src={image_url}
          />
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {name}
            </h3>
            <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
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
            <Badge className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 text-xs">
              Production
            </Badge>
          )}
          {stagingDeployment && (
            <Badge className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs">
              Staging
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
