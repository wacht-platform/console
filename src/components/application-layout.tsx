import { Outlet, useLocation } from "react-router";
import { Avatar } from "@/components/ui/avatar";
import {
  Navbar,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from "@/components/ui/navbar";
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
} from "@/components/ui/dropdown";
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  Cog8ToothIcon,
  LightBulbIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  KeyIcon,
  UserGroupIcon,
  ClockIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
  ViewColumnsIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import { useProjectAndDeployments } from "@/lib/api/hooks/use-projects";
import { capitalize } from "@/lib/capitalize";

function AccountDropdownMenu({
  anchor,
}: {
  anchor: "top start" | "bottom end";
}) {
  return (
    <DropdownMenu className="min-w-64" anchor={anchor}>
      <DropdownItem href="#">
        <UserCircleIcon />
        <DropdownLabel>My account</DropdownLabel>
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem href="#">
        <ShieldCheckIcon />
        <DropdownLabel>Privacy policy</DropdownLabel>
      </DropdownItem>
      <DropdownItem href="#">
        <LightBulbIcon />
        <DropdownLabel>Share feedback</DropdownLabel>
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem href="#">
        <ArrowRightStartOnRectangleIcon />
        <DropdownLabel>Sign out</DropdownLabel>
      </DropdownItem>
    </DropdownMenu>
  );
}

export function ApplicationLayout() {
  const { pathname } = useLocation();
  const {
    projects,
    isLoading,
    selectedProject,
    selectedDeployment,
    setSelectedProject,
    setSelectedDeployment,
  } = useProjectAndDeployments();

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
                <ChevronDownIcon />
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
                      initials={project.name.substring(0, 2).toUpperCase()}
                      className="bg-blue-500 text-white"
                    />
                    <DropdownLabel>{project.name}</DropdownLabel>
                  </DropdownItem>
                ))}
                <DropdownDivider />
                <DropdownItem href="#">
                  <PlusIcon />
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
                    <ChevronDownIcon />
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
                      <PlusIcon />
                      <DropdownLabel>New deployment...</DropdownLabel>
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </>
            )}
          </NavbarSection>
          <NavbarSpacer />
          <NavbarSection>
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                <Avatar src="https://github.com/erica.png" square />
              </DropdownButton>
              <AccountDropdownMenu anchor="bottom end" />
            </Dropdown>
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <Avatar src="/teams/catalyst.svg" />
                <SidebarLabel>Catalyst</SidebarLabel>
                <ChevronDownIcon />
              </DropdownButton>
              <DropdownMenu
                className="min-w-80 lg:min-w-64"
                anchor="bottom start"
              >
                <DropdownItem href="/settings">
                  <Cog8ToothIcon />
                  <DropdownLabel>Settings</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="#">
                  <Avatar slot="icon" src="/teams/catalyst.svg" />
                  <DropdownLabel>Catalyst</DropdownLabel>
                </DropdownItem>
                <DropdownItem href="#">
                  <Avatar
                    slot="icon"
                    initials="BE"
                    className="bg-purple-500 text-white"
                  />
                  <DropdownLabel>Big Events</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="#">
                  <PlusIcon />
                  <DropdownLabel>New team&hellip;</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </SidebarHeader>

          <SidebarBody>
            <SidebarSection>
              <SidebarHeading>Manage</SidebarHeading>
              <SidebarItem href="/" current={pathname === "/"}>
                <ViewColumnsIcon />
                <SidebarLabel>Overview</SidebarLabel>
              </SidebarItem>
              <SidebarItem
                href="/users"
                current={pathname.startsWith("/users")}
              >
                <UserGroupIcon />
                <SidebarLabel>Users</SidebarLabel>
              </SidebarItem>
              <SidebarItem
                href="/organizations"
                current={pathname.startsWith("/organizations")}
              >
                <BuildingOffice2Icon />
                <SidebarLabel>Organizations</SidebarLabel>
              </SidebarItem>
              <SidebarItem
                href="/workspaces"
                current={pathname.startsWith("/workspaces")}
              >
                <BriefcaseIcon />
                <SidebarLabel>Workspaces</SidebarLabel>
              </SidebarItem>
            </SidebarSection>

            <SidebarDivider />

            <SidebarSection className="max-lg:hidden">
              <SidebarHeading>Authentication</SidebarHeading>
              <SidebarItem href="/auth/schema-factors">
                <EnvelopeIcon />
                <SidebarLabel>Schema & Factors</SidebarLabel>
              </SidebarItem>

              <SidebarItem href="/auth/sso">
                <KeyIcon />
                <SidebarLabel>Social logins</SidebarLabel>
              </SidebarItem>

              <SidebarItem href="/auth/restrictions">
                <NoSymbolIcon />
                <SidebarLabel>Restrictions</SidebarLabel>
              </SidebarItem>

              <SidebarItem href="/sessions">
                <ClockIcon />
                <SidebarLabel>Sessions</SidebarLabel>
              </SidebarItem>

              <SidebarHeading className="mt-3">B2B Features</SidebarHeading>
              <SidebarItem href="/manage-organizations">
                <BuildingOffice2Icon />
                <SidebarLabel>Organizations</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/manage-workspaces">
                <BriefcaseIcon />
                <SidebarLabel>Workspaces</SidebarLabel>
              </SidebarItem>

              <SidebarHeading className="mt-3">Customization</SidebarHeading>
              <SidebarItem href="/portal">
                <SparklesIcon />
                <SidebarLabel>Account Portal</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/avatars">
                <UserCircleIcon />
                <SidebarLabel>Avatars</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/emails">
                <EnvelopeIcon />
                <SidebarLabel>Emails</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/sms">
                <DevicePhoneMobileIcon />
                <SidebarLabel>SMS</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>
        </Sidebar>
      }
    >
      <Outlet />
    </SidebarLayout>
  );
}
