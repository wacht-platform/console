import { Outlet, useLocation, useNavigate, useParams } from "react-router";
import { Avatar } from "@/components/ui/avatar";
import { useCallback, useState, useEffect } from "react";
import { Navbar, NavbarSection, NavbarSpacer } from "@/components/ui/navbar";
import { LoadingFallback } from "./loading-fallback";
import {
  Sidebar,
  SidebarBody,
  SidebarDivider,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "./ui/sidebar";
import { SidebarLayout } from "@/components/ui/sidebar-layout";
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownIcon,
} from "@/components/ui/dropdown";
import {
  ChevronDownIcon,
  PlusIcon,
  LockClosedIcon,
  KeyIcon,
  UserGroupIcon,
  EnvelopeIcon,
  ViewColumnsIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  NoSymbolIcon,
  DocumentTextIcon,
  FireIcon,
  CodeBracketSquareIcon,
  WrenchScrewdriverIcon,
  BookOpenIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import {
  useProjects,
  useCreateStagingDeployment,
} from "@/lib/api/hooks/use-projects";
import { capitalize } from "@/lib/capitalize";
import { CreateProjectDialog } from "./create-project-dialog";
import { CreateProductionDeploymentDialog } from "./create-production-deployment-dialog";
import { CreateStagingDeploymentDialog } from "./create-staging-deployment-dialog";
import { OrganizationSwitcher, UserButton } from "@snipextt/wacht-react-router";
import { setNavigationFunction } from "@/lib/store/project";

export function ApplicationLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { projectId, deploymentId } = useParams();
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] =
    useState(false);
  const [isCreateProductionDialogOpen, setIsCreateProductionDialogOpen] =
    useState(false);
  const [isCreateStagingDialogOpen, setIsCreateStagingDialogOpen] =
    useState(false);
  const {
    projects,
    isLoading,
    selectedProject,
    selectedDeployment,
    setSelectedProject,
    setSelectedDeployment,
    initializeFromUrl,
  } = useProjects();

  const { createStagingDeployment, isLoading: isCreatingStagingDeployment } =
    useCreateStagingDeployment();

  // Initialize navigation function for the store
  useEffect(() => {
    setNavigationFunction(navigate);
  }, [navigate]);

  const handleCreateStagingDeployment = async (authMethods: string[]) => {
    if (!selectedProject) return;

    try {
      const deployment = await createStagingDeployment({
        projectId: selectedProject.id,
        authMethods,
      });
      setIsCreateStagingDialogOpen(false);
      // Navigate to the new staging deployment
      setSelectedDeployment(deployment, true);
    } catch (error) {
      console.error("Failed to create staging deployment:", error);
    }
  };

  // Check deployment limits
  const hasProductionDeployment = selectedProject?.deployments.some(
    (deployment) => deployment.mode === "production"
  );
  const stagingDeploymentCount =
    selectedProject?.deployments.filter(
      (deployment) => deployment.mode === "staging"
    ).length || 0;
  const canCreateStagingDeployment = stagingDeploymentCount < 3;
  const canCreateProductionDeployment = !hasProductionDeployment;

  // Sync store with URL parameters when they change
  useEffect(() => {
    if (projects && projectId && deploymentId) {
      initializeFromUrl(projectId, deploymentId);
    }
  }, [projects, projectId, deploymentId, initializeFromUrl]);

  const createNavigationLink = useCallback(
    (pathname: string) => {
      return `/project/${selectedProject?.id}/deployment/${selectedDeployment?.id}/${pathname}`;
    },
    [selectedDeployment, selectedProject]
  );

  if (isLoading) {
    return (
      <LoadingFallback variant="detailed" message="Loading your workspace..." />
    );
  }

  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSection>
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <SidebarLabel>
                  {selectedProject?.name || "Select Project"}
                </SidebarLabel>
                <DropdownIcon icon={ChevronDownIcon} />
              </DropdownButton>
              <DropdownMenu
                className="min-w-80 lg:min-w-64"
                anchor="bottom start"
              >
                {projects?.map((project) => (
                  <DropdownItem
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project, true);
                    }}
                  >
                    <Avatar
                      slot="icon"
                      src={project.image_url}
                      initials={project.name.substring(0, 2).toUpperCase()}
                      className="bg-blue-500 text-white"
                    />
                    <DropdownLabel>{project.name}</DropdownLabel>
                  </DropdownItem>
                ))}
                <DropdownDivider />
                <DropdownItem
                  onClick={() => setIsCreateProjectDialogOpen(true)}
                >
                  <DropdownIcon icon={PlusIcon} />
                  <DropdownLabel>New project</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
            {selectedProject && (
              <>
                <span className="text-sm text-zinc-500">/</span>
                <Dropdown>
                  <DropdownButton as={SidebarItem}>
                    <SidebarLabel>
                      {selectedDeployment?.name ||
                        capitalize(selectedDeployment?.mode || "")}
                    </SidebarLabel>
                    <DropdownIcon icon={ChevronDownIcon} />
                  </DropdownButton>
                  <DropdownMenu
                    className="min-w-80 lg:min-w-64"
                    anchor="bottom start"
                  >
                    {selectedProject.deployments.map((deployment) => (
                      <DropdownItem
                        key={deployment.id}
                        onClick={() => setSelectedDeployment(deployment, true)}
                        className="flex items-center gap-2"
                      >
                        <div
                          slot="icon"
                          className={`h-5 w-5 rounded flex items-center justify-center ${
                            deployment.mode === "production"
                              ? "bg-green-500"
                              : "bg-yellow-500"
                          } text-white`}
                        >
                          {deployment.mode === "production" ? "P" : "S"}
                        </div>
                        <DropdownLabel>
                          {deployment.name || capitalize(deployment.mode || "")}
                        </DropdownLabel>
                      </DropdownItem>
                    ))}
                    <DropdownDivider />
                    {canCreateStagingDeployment ? (
                      <DropdownItem
                        onClick={() => setIsCreateStagingDialogOpen(true)}
                      >
                        <DropdownIcon icon={PlusIcon} />
                        <DropdownLabel>Staging deployment</DropdownLabel>
                      </DropdownItem>
                    ) : (
                      <DropdownItem disabled>
                        <DropdownIcon icon={PlusIcon} />
                        <DropdownLabel className="text-zinc-400">
                          Staging deployment (3/3 limit reached)
                        </DropdownLabel>
                      </DropdownItem>
                    )}
                    {canCreateProductionDeployment && (
                      <DropdownItem
                        onClick={() => setIsCreateProductionDialogOpen(true)}
                      >
                        <DropdownIcon icon={PlusIcon} />
                        <DropdownLabel>Production deployment</DropdownLabel>
                      </DropdownItem>
                    )}
                  </DropdownMenu>
                </Dropdown>
              </>
            )}
          </NavbarSection>
          <NavbarSpacer />
          <NavbarSection>
            <UserButton showName={false} />
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <OrganizationSwitcher />
          </SidebarHeader>

          <SidebarBody>
            <SidebarSection>
              <SidebarHeading>Manage</SidebarHeading>
              <SidebarItem
                href={createNavigationLink("/")}
                current={pathname === "/"}
              >
                <DropdownIcon icon={ViewColumnsIcon} />
                <SidebarLabel>Overview</SidebarLabel>
              </SidebarItem>
              <SidebarItem
                href={createNavigationLink("users")}
                current={pathname.startsWith("/users")}
              >
                <DropdownIcon icon={UserGroupIcon} />
                <SidebarLabel>Users</SidebarLabel>
              </SidebarItem>
              <SidebarItem
                href={createNavigationLink("organizations")}
                current={pathname.startsWith("/organizations")}
              >
                <DropdownIcon icon={BuildingOffice2Icon} />
                <SidebarLabel>Organizations</SidebarLabel>
              </SidebarItem>
            </SidebarSection>

            <SidebarDivider />

            <SidebarSection className="max-lg:hidden">
              <SidebarHeading>Agents & LLMs</SidebarHeading>

              <SidebarItem href={createNavigationLink("llms/ai-agents")}>
                <DropdownIcon icon={CodeBracketSquareIcon} />
                <SidebarLabel>AI Agents</SidebarLabel>
              </SidebarItem>

              <SidebarItem href={createNavigationLink("llms/workflows")}>
                <DropdownIcon icon={FireIcon} />
                <SidebarLabel>Workflows</SidebarLabel>
              </SidebarItem>

              <SidebarItem href={createNavigationLink("llms/tools")}>
                <DropdownIcon icon={WrenchScrewdriverIcon} />
                <SidebarLabel>Tools</SidebarLabel>
              </SidebarItem>

              <SidebarItem href={createNavigationLink("llms/knowledge-base")}>
                <DropdownIcon icon={BookOpenIcon} />
                <SidebarLabel>Knowledge Base</SidebarLabel>
              </SidebarItem>
            </SidebarSection>

            <SidebarDivider />

            <SidebarSection className="max-lg:hidden">
              <SidebarHeading>Authentication</SidebarHeading>
              <SidebarItem href={createNavigationLink("auth/schema-factors")}>
                <DropdownIcon icon={LockClosedIcon} />
                <SidebarLabel>Auth Settings</SidebarLabel>
              </SidebarItem>

              <SidebarItem href={createNavigationLink("auth/sso")}>
                <DropdownIcon icon={KeyIcon} />
                <SidebarLabel>Configure SSO</SidebarLabel>
              </SidebarItem>

              <SidebarItem href={createNavigationLink("auth/restrictions")}>
                <DropdownIcon icon={NoSymbolIcon} />
                <SidebarLabel>Restrictions</SidebarLabel>
              </SidebarItem>

              <SidebarItem href={createNavigationLink("auth/jwt-templates")}>
                <DropdownIcon icon={DocumentTextIcon} />
                <SidebarLabel>JWT Templates</SidebarLabel>
              </SidebarItem>

              <SidebarHeading className="mt-3">B2B Features</SidebarHeading>
              <SidebarItem href={createNavigationLink("manage-organizations")}>
                <DropdownIcon icon={BuildingOffice2Icon} />
                <SidebarLabel>Organizations</SidebarLabel>
              </SidebarItem>
              <SidebarItem href={createNavigationLink("manage-workspaces")}>
                <DropdownIcon icon={BriefcaseIcon} />
                <SidebarLabel>Workspaces</SidebarLabel>
              </SidebarItem>

              <SidebarHeading className="mt-3">Customization</SidebarHeading>
              <SidebarItem href={createNavigationLink("deployment-settings")}>
                <DropdownIcon icon={Cog6ToothIcon} />
                <SidebarLabel>Deployment Settings</SidebarLabel>
              </SidebarItem>
              <SidebarItem href={createNavigationLink("emails")}>
                <DropdownIcon icon={EnvelopeIcon} />
                <SidebarLabel>Email Settings</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>
        </Sidebar>
      }
    >
      <Outlet />
      <CreateProjectDialog
        open={isCreateProjectDialogOpen}
        onClose={() => setIsCreateProjectDialogOpen(false)}
      />
      {selectedProject && (
        <>
          <CreateStagingDeploymentDialog
            open={isCreateStagingDialogOpen}
            onOpenChange={setIsCreateStagingDialogOpen}
            onCreateStagingDeployment={handleCreateStagingDeployment}
            isLoading={isCreatingStagingDeployment}
          />
          <CreateProductionDeploymentDialog
            open={isCreateProductionDialogOpen}
            onClose={() => setIsCreateProductionDialogOpen(false)}
            projectId={selectedProject.id}
          />
        </>
      )}
    </SidebarLayout>
  );
}
