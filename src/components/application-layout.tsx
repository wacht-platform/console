import { Outlet, useLocation } from "react-router";
import { Avatar } from "@/components/ui/avatar";
import { useCallback, useState } from "react";
import { Navbar, NavbarSection, NavbarSpacer } from "@/components/ui/navbar";
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
  SparklesIcon,
  ViewColumnsIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  NoSymbolIcon,
  DocumentTextIcon,
  FireIcon,
  CodeBracketSquareIcon,
} from "@heroicons/react/24/outline";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { capitalize } from "@/lib/capitalize";
import { CreateProjectDialog } from "./create-project-dialog";
import { OrganizationSwitcher, UserButton } from "@snipextt/wacht";

export function ApplicationLayout() {
  const { pathname } = useLocation();
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] =
    useState(false);
  const {
    projects,
    isLoading,
    selectedProject,
    selectedDeployment,
    setSelectedProject,
    setSelectedDeployment,
  } = useProjects();

  const createNavigationLink = useCallback(
    (pathname: string) => {
      return `/project/${selectedProject?.id}/deployment/${selectedDeployment?.id}/${pathname}`;
    },
    [selectedDeployment, selectedProject],
  );

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-500" />
          <p className="text-sm text-zinc-500">Loading your workspace...</p>
        </div>
      </div>
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
                      setSelectedProject(project);
                      setSelectedDeployment(project.deployments[0]);
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
                  <DropdownLabel>New project...</DropdownLabel>
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
                        onClick={() => setSelectedDeployment(deployment)}
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
                    <DropdownItem href="#">
                      <DropdownIcon icon={PlusIcon} />
                      <DropdownLabel>New deployment...</DropdownLabel>
                    </DropdownItem>
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
              <SidebarItem
                href={createNavigationLink("workspaces")}
                current={pathname.startsWith("/workspaces")}
              >
                <DropdownIcon icon={BriefcaseIcon} />
                <SidebarLabel>Workspaces</SidebarLabel>
              </SidebarItem>
            </SidebarSection>

            <SidebarDivider />

            <SidebarSection className="max-lg:hidden">
              <SidebarHeading>Agents & LLMs</SidebarHeading>

              <SidebarItem href={createNavigationLink("llms/ai-agents")}>
                <DropdownIcon icon={CodeBracketSquareIcon} />
                <SidebarLabel>Create Agents</SidebarLabel>
              </SidebarItem>

              <SidebarItem href={createNavigationLink("llms/workflows")}>
                <DropdownIcon icon={FireIcon} />
                <SidebarLabel>Workflows</SidebarLabel>
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
              <SidebarItem href={createNavigationLink("portal")}>
                <DropdownIcon icon={SparklesIcon} />
                <SidebarLabel>UI Settings</SidebarLabel>
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
    </SidebarLayout>
  );
}
