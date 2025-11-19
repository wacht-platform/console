import {
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  Link,
} from "react-router";
import { useCallback, useState, useEffect } from "react";
import { Spinner } from "./ui/spinner";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import {
  LockClosedIcon,
  UserGroupIcon,
  ViewColumnsIcon,
  BuildingOffice2Icon,
  CodeBracketSquareIcon,
  Cog6ToothIcon,
  BoltIcon,
  XMarkIcon,
  Bars3Icon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import {
  useProjects,
  useCreateStagingDeployment,
} from "@/lib/api/hooks/use-projects";

import { CreateProjectDialog } from "./create-project-dialog";
import { BillingSetupDialog } from "./billing-setup-dialog";
import { CreateProductionDeploymentDialog } from "./create-production-deployment-dialog";
import { CreateStagingDeploymentDialog } from "./create-staging-deployment-dialog";
import { useBillingAccount } from "@/lib/api/hooks/use-billing";
import {
  NotificationBell,
  OrganizationSwitcher,
  UserButton,
} from "@wacht/react-router";
import { setNavigationFunction } from "@/lib/store/project";
import { ProjectDeploymentSelector } from "./project-deployment-selector";
import { ThemeToggle } from "./ui/theme-toggle";
import { ProjectWithDeployments } from "@/types/project";
import { Deployment } from "@/types/deployment";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export function ApplicationLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { projectId, deploymentId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] =
    useState(false);
  const [isBillingSetupDialogOpen, setIsBillingSetupDialogOpen] =
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

  const { data: billingAccount } = useBillingAccount();
  const { createStagingDeployment, isLoading: isCreatingStagingDeployment } =
    useCreateStagingDeployment();

  const handleCreateProject = () => {
    if (!billingAccount) {
      setIsBillingSetupDialogOpen(true);
    } else {
      setIsCreateProjectDialogOpen(true);
    }
  };

  const handleBillingSetupSuccess = () => {
    setIsBillingSetupDialogOpen(false);
  };

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
    (deployment) => deployment.mode === "production",
  );
  const stagingDeploymentCount =
    selectedProject?.deployments.filter(
      (deployment) => deployment.mode === "staging",
    ).length || 0;
  const canCreateStagingDeployment = stagingDeploymentCount === 0;
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
    [selectedDeployment, selectedProject],
  );

  // Main navigation sections for the vertical sidebar (only main categories)
  const mainNavigation = [
    {
      name: "Overview",
      href: createNavigationLink("/"),
      icon: ViewColumnsIcon,
      current: pathname === "/" || pathname.endsWith("//"),
    },
    {
      name: "Users",
      href: createNavigationLink("users/active"),
      icon: UserGroupIcon,
      current: pathname.includes("/users"),
    },
    {
      name: "Organizations",
      href: createNavigationLink("organizations"),
      icon: BuildingOffice2Icon,
      current: pathname.includes("/organizations"),
    },
    {
      name: "Webhooks",
      href: createNavigationLink("webhooks"),
      icon: BoltIcon,
      current: pathname.includes("/webhooks"),
    },
    {
      name: "API Keys",
      href: createNavigationLink("api-keys"),
      icon: KeyIcon,
      current: pathname.includes("/api-keys"),
    },
    // {
    //   name: "Billing",
    //   href: createNavigationLink("billing"),
    //   icon: CreditCardIcon,
    //   current: pathname.includes("/billing"),
    // },
  ];

  const sidebarSections = [
    {
      name: "Agents & LLMs",
      href: createNavigationLink("llms/ai-agents"), // Default to first sub-page
      icon: CodeBracketSquareIcon,
      current: pathname.includes("llms/"),
    },
    {
      name: "Authentication",
      href: createNavigationLink("auth/schema-factors"), // Default to first sub-page
      icon: LockClosedIcon,
      current: pathname.includes("auth/"),
    },
    {
      name: "B2B Features",
      href: createNavigationLink("manage-organizations"), // Default to first sub-page
      icon: BuildingOffice2Icon,
      current: pathname.includes("manage-"),
    },
    {
      name: "Customization",
      href: createNavigationLink("deployment-settings"), // Default to first sub-page
      icon: Cog6ToothIcon,
      current:
        pathname.includes("deployment-settings") || pathname.includes("emails"),
    },
  ];

  // Sub-navigation for horizontal tabs (only shown when in that section)
  const userSections = [
    {
      name: "Active",
      href: createNavigationLink("users/active"),
      current:
        pathname.includes("users/active") ||
        (pathname.includes("users") &&
          !pathname.includes("users/invited") &&
          !pathname.includes("users/waitlist")),
    },
    {
      name: "Invited",
      href: createNavigationLink("users/invited"),
      current: pathname.includes("users/invited"),
    },
    {
      name: "Waitlist",
      href: createNavigationLink("users/waitlist"),
      current: pathname.includes("users/waitlist"),
    },
  ];

  const agentSections = [
    {
      name: "AI Agents",
      href: createNavigationLink("llms/ai-agents"),
      current: pathname.includes("ai-agents"),
    },
    {
      name: "Workflows",
      href: createNavigationLink("llms/workflows"),
      current: pathname.includes("workflows"),
    },
    {
      name: "Tools",
      href: createNavigationLink("llms/tools"),
      current: pathname.includes("tools"),
    },
    {
      name: "Knowledge Base",
      href: createNavigationLink("llms/knowledge-base"),
      current: pathname.includes("knowledge-base"),
    },
  ];

  const authSections = [
    {
      name: "Auth Settings",
      href: createNavigationLink("auth/schema-factors"),
      current: pathname.includes("auth/schema-factors"),
    },
    {
      name: "Configure SSO",
      href: createNavigationLink("auth/sso"),
      current: pathname.includes("auth/sso"),
    },
    {
      name: "Sessions",
      href: createNavigationLink("auth/sessions"),
      current: pathname.includes("auth/sessions"),
    },
    {
      name: "Restrictions",
      href: createNavigationLink("auth/restrictions"),
      current: pathname.includes("auth/restrictions"),
    },
    {
      name: "JWT Templates",
      href: createNavigationLink("auth/jwt-templates"),
      current: pathname.includes("auth/jwt-templates"),
    },
  ];

  const b2bSections = [
    {
      name: "Organizations",
      href: createNavigationLink("manage-organizations"),
      current: pathname.includes("manage-organizations"),
    },
    {
      name: "Workspaces",
      href: createNavigationLink("manage-workspaces"),
      current: pathname.includes("manage-workspaces"),
    },
  ];

  const customizationSections = [
    {
      name: "Deployment Settings",
      href: createNavigationLink("deployment-settings"),
      current: pathname.includes("deployment-settings"),
    },
    {
      name: "Email Settings",
      href: createNavigationLink("emails"),
      current: pathname.includes("emails"),
    },
  ];

  const webhookSections = [
    {
      name: "Overview",
      href: createNavigationLink("webhooks"),
      current:
        pathname === createNavigationLink("webhooks") ||
        (pathname.includes("webhooks") &&
          !pathname.includes("webhooks/endpoints") &&
          !pathname.includes("webhooks/deliveries") &&
          !pathname.includes("webhooks/analytics")),
    },
    {
      name: "Endpoints",
      href: createNavigationLink("webhooks/endpoints"),
      current: pathname.includes("webhooks/endpoints"),
    },
    {
      name: "Deliveries",
      href: createNavigationLink("webhooks/deliveries"),
      current: pathname.includes("webhooks/deliveries"),
    },
    {
      name: "Analytics",
      href: createNavigationLink("webhooks/analytics"),
      current: pathname.includes("webhooks/analytics"),
    },
  ];

  // Get current section for horizontal navigation
  const getCurrentSection = () => {
    if (pathname.includes("users")) return "users";
    if (pathname.includes("llms/")) return "agents";
    if (pathname.includes("auth/")) return "auth";
    if (pathname.includes("manage-")) return "b2b";
    if (pathname.includes("deployment-settings") || pathname.includes("emails"))
      return "customization";
    if (pathname.includes("webhooks")) return "webhooks";
    return "main";
  };

  const currentSection = getCurrentSection();

  const getHorizontalNavigation = () => {
    switch (currentSection) {
      case "users":
        return userSections;
      case "agents":
        return agentSections;
      case "auth":
        return authSections;
      case "b2b":
        return b2bSections;
      case "customization":
        return customizationSections;
      case "webhooks":
        return webhookSections;
      default:
        return [];
    }
  };

  const horizontalNavigation = getHorizontalNavigation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Loading your workspace...
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen overflow-hidden">
        {/* Mobile sidebar */}
        <Dialog
          open={sidebarOpen}
          onClose={setSidebarOpen}
          className="relative z-50 xl:hidden"
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
          />
          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
            >
              <TransitionChild>
                <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="-m-2.5 p-2.5"
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon
                      aria-hidden="true"
                      className="size-6 text-white"
                    />
                  </button>
                </div>
              </TransitionChild>

              {/* Mobile sidebar content */}
              <div className="relative flex grow flex-col gap-y-4 overflow-y-auto overflow-x-hidden bg-gray-50/50 px-4 dark:bg-zinc-800 border-r border-gray-200/40 dark:border-zinc-700/40">
                <div className="relative flex h-16 shrink-0 items-center border-b border-gray-200/40 dark:border-zinc-700/40 -mx-4 px-4 mb-2">
                  <div className="w-full">
                    <OrganizationSwitcher />
                  </div>
                </div>
                <nav className="relative flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-6">
                    {/* Main navigation */}
                    <li>
                      <div className="text-xs font-normal text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Manage
                      </div>
                      <ul role="list" className="-mx-2 mt-1.5 space-y-0.5">
                        {mainNavigation.map((item) => (
                          <li key={item.name}>
                            <Link
                              to={item.href}
                              className={classNames(
                                item.current
                                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                                  : "text-gray-800 hover:bg-gray-50/70 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-gray-200",
                                "group flex gap-x-3 rounded-lg p-2 text-sm font-normal transition-all duration-150",
                              )}
                            >
                              <item.icon
                                aria-hidden="true"
                                className={classNames(
                                  item.current
                                    ? "text-indigo-600 dark:text-indigo-400"
                                    : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400",
                                  "size-5 shrink-0 transition-colors duration-150",
                                )}
                              />
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>

                    {/* Main sections */}
                    <li>
                      <div className="text-xs font-normal text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Features
                      </div>
                      <ul role="list" className="-mx-2 mt-1.5 space-y-0.5">
                        {sidebarSections.map((item) => (
                          <li key={item.name}>
                            <Link
                              to={item.href}
                              className={classNames(
                                item.current
                                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                                  : "text-gray-800 hover:bg-gray-50/70 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-gray-200",
                                "group flex gap-x-3 rounded-lg p-2 text-sm font-normal transition-all duration-150",
                              )}
                            >
                              <item.icon
                                aria-hidden="true"
                                className={classNames(
                                  item.current
                                    ? "text-indigo-600 dark:text-indigo-400"
                                    : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400",
                                  "size-5 shrink-0 transition-colors duration-150",
                                )}
                              />
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>

                    <li className="-mx-6 mt-auto">
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-3 pb-3 px-6">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0">
                            <ThemeToggle />
                          </div>
                          <div className="flex-1 min-w-0">
                            <UserButton showName={false} />
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Static sidebar for desktop */}
        <div className="hidden xl:fixed xl:inset-y-0 xl:z-50 xl:flex xl:w-72 xl:flex-col dark:bg-neutral-900 flex-shrink-0 max-w-72">
          <div className="flex grow flex-col gap-y-4 overflow-y-auto overflow-x-hidden bg-gray-50/50 px-4 border-r border-gray-200/40 dark:bg-neutral-900 dark:border-zinc-700/40">
            <div className="flex h-16 shrink-0 items-center border-b border-gray-200/40 dark:border-zinc-700/40 -mx-4 px-4">
              <div className="w-full">
                <OrganizationSwitcher />
              </div>
            </div>
            <nav className="flex flex-1 flex-col min-w-0">
              <ul role="list" className="flex flex-1 flex-col gap-y-6">
                {/* Main navigation */}
                <li>
                  <div className="text-xs font-normal text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Manage
                  </div>
                  <ul role="list" className="-mx-2 mt-1.5 space-y-0.5">
                    {mainNavigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={classNames(
                            item.current
                              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                              : "text-gray-800 hover:bg-gray-50/70 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-gray-200",
                            "group flex gap-x-3 rounded-lg p-2 text-sm font-normal transition-all duration-150",
                          )}
                        >
                          <item.icon
                            aria-hidden="true"
                            className={classNames(
                              item.current
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400",
                              "size-5 shrink-0 transition-colors duration-150",
                            )}
                          />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>

                {/* Main sections */}
                <li>
                  <div className="text-xs font-normal text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Features
                  </div>
                  <ul role="list" className="-mx-2 mt-1.5 space-y-0.5">
                    {sidebarSections.map((item) => (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={classNames(
                            item.current
                              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                              : "text-gray-800 hover:bg-gray-50/70 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-gray-200",
                            "group flex gap-x-3 rounded-lg p-2 text-sm font-normal transition-all duration-150",
                          )}
                        >
                          <item.icon
                            aria-hidden="true"
                            className={classNames(
                              item.current
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400",
                              "size-5 shrink-0 transition-colors duration-150",
                            )}
                          />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>

                <li className="-mx-4 mt-auto">
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-3 pb-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <UserButton showName={false} />
                      </div>
                      <div className="flex-shrink-0">
                        <ThemeToggle />
                      </div>
                      <div className="flex-shrink-0">
                        <NotificationBell showBadge />
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="xl:pl-72 min-w-0 flex-1">
          {/* Header with bottom border */}
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 bg-white px-4 sm:px-6 lg:px-8 dark:bg-neutral-900 min-w-0 border-b border-gray-200/40 dark:border-zinc-800/40">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="-m-2.5 p-2.5 text-gray-900 xl:hidden dark:text-white"
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon aria-hidden="true" className="size-5" />
            </button>

            {/* Custom project and deployment selector */}
            <ProjectDeploymentSelector
              projects={projects}
              selectedProject={selectedProject || undefined}
              selectedDeployment={selectedDeployment || undefined}
              onProjectSelect={(project) =>
                setSelectedProject(
                  project as unknown as ProjectWithDeployments,
                  true,
                )
              }
              onDeploymentSelect={(deployment) =>
                setSelectedDeployment(deployment as unknown as Deployment, true)
              }
              onCreateProject={handleCreateProject}
              onCreateStaging={() => setIsCreateStagingDialogOpen(true)}
              onCreateProduction={() => setIsCreateProductionDialogOpen(true)}
              canCreateStaging={canCreateStagingDeployment}
              canCreateProduction={canCreateProductionDeployment}
            />

            <div className="flex-1"></div>

            <div className="flex items-center gap-x-4">
              {/*<NotificationBell />*/}
            </div>
          </div>

          <main>
            {/* Horizontal sub-navigation */}
            {horizontalNavigation.length > 0 && (
              <header className="border-b border-gray-200/40 dark:border-zinc-800/40 bg-white dark:bg-neutral-900">
                <nav
                  className="-mb-px flex overflow-x-auto px-4 sm:px-6 lg:px-8"
                  aria-label="Tabs"
                >
                  <div className="flex space-x-8">
                    {horizontalNavigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          item.current
                            ? "border-gray-900 text-gray-900 dark:border-white dark:text-white"
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200",
                          "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors duration-150",
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </nav>
              </header>
            )}
            <div className="px-4 py-6 sm:px-6 lg:px-8 bg-white min-h-screen dark:bg-neutral-900 min-w-0">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Dialogs */}
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
      <BillingSetupDialog
        open={isBillingSetupDialogOpen}
        onClose={() => setIsBillingSetupDialogOpen(false)}
        onSuccess={handleBillingSetupSuccess}
      />
    </>
  );
}
