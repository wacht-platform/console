import { Outlet, useNavigate, useLocation, useParams } from "react-router";
import { useState, useEffect } from "react";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { AppLoading } from "./ui/loading-screen";
import { CreateProjectDialog } from "./create-project-dialog";
import { BillingSetupDialog } from "./billing-setup-dialog";
import { CreateProductionDeploymentDialog } from "./create-production-deployment-dialog";
import { CreateStagingDeploymentDialog } from "./create-staging-deployment-dialog";
import { setNavigationFunction } from "@/lib/store/project";
import { useCreateStagingDeployment } from "@/lib/api/hooks/use-projects";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useBillingAccount } from "@/lib/api/hooks/use-billing";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import {
    Dialog,
    DialogTitle,
    DialogDescription,
    DialogContent,
    DialogHeader,
    DialogFooter,
} from "@/components/ui/dialog";
import { Text } from "@/components/ui/text";
import type { Deployment } from "@/types/deployment";

export function ApplicationLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] =
        useState(false);
    const [isBillingSetupDialogOpen, setIsBillingSetupDialogOpen] =
        useState(false);
    const [isCreateProductionDialogOpen, setIsCreateProductionDialogOpen] =
        useState(false);
    const [isCreateStagingDialogOpen, setIsCreateStagingDialogOpen] =
        useState(false);
    const [isPendingBillingDialogOpen, setIsPendingBillingDialogOpen] =
        useState(false);

    const { data: billingAccount } = useBillingAccount();

    const handleBillingSetupSuccess = () => {
        setIsBillingSetupDialogOpen(false);
    };

    const guardAction = (action: () => void) => {
        if (
            !billingAccount ||
            billingAccount.status === "cancelled" ||
            billingAccount.status === "failed"
        ) {
            setIsBillingSetupDialogOpen(true);
        } else if (billingAccount.status === "pending") {
            setIsPendingBillingDialogOpen(true);
        } else {
            action();
        }
    };

    const {
        selectedProject,
        selectedDeployment,
        projects,
        isLoading: isStoreLoading,
        notFound,
        initializeFromUrl,
        setSelectedDeployment,
    } = useProjects();
    const { createStagingDeployment, isLoading: isCreatingStagingDeployment } =
        useCreateStagingDeployment();

    useEffect(() => {
        if (params.projectId && params.deploymentId && projects) {
            initializeFromUrl(params.projectId, params.deploymentId);
        }
    }, [params.projectId, params.deploymentId, projects, initializeFromUrl]);

    const isContextReady =
        !params.projectId ||
        (selectedProject?.id === params.projectId &&
            selectedDeployment?.id === params.deploymentId);

    useEffect(() => {
        setNavigationFunction(navigate);
    }, [navigate]);

    if (notFound) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-zinc-50 dark:bg-zinc-900">
                <h1 className="text-2xl font-normal text-zinc-900 dark:text-zinc-50 mb-2 tracking-tight">
                    Project Not Found
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6 max-w-md font-normal">
                    The requested project or deployment doesn't exist or you
                    don't have access to it.
                </p>
                <Button onClick={() => navigate("/")}>Go to Dashboard</Button>
            </div>
        );
    }

    if (isStoreLoading || !isContextReady) {
        return <AppLoading />;
    }

    const isUsersRoute = location.pathname.includes("/users");
    const isB2BRoute = location.pathname.includes("/b2b-settings");
    const isSetupRoute = location.pathname.includes("/setup");
    const isAuthRoute =
        location.pathname.includes("/auth/") ||
        location.pathname.endsWith("/auth");
    const isLLMRoute = location.pathname.includes("/llms/");
    const isBillingRoute = location.pathname.includes("/billing");
    const llmsBasePath = `/project/${params.projectId}/deployment/${params.deploymentId}/llms`;
    const llmsToolsPath = `${llmsBasePath}/tools`;
    const llmsKnowledgeBasePath = `${llmsBasePath}/knowledge-base`;
    const llmsMcpServersPath = `${llmsBasePath}/mcp-servers`;

    let currentTab = "";
    if (isUsersRoute) {
        currentTab = location.pathname.includes("/users/invited")
            ? "invited"
            : location.pathname.includes("/users/waitlist")
              ? "waitlist"
              : "active";
    } else if (isB2BRoute) {
        currentTab = location.pathname.includes("/b2b-settings/workspaces")
            ? "workspaces"
            : "organizations";
    } else if (isSetupRoute) {
        currentTab = location.pathname.includes("/setup/emails")
            ? "emails"
            : location.pathname.includes("/setup/ai-settings")
              ? "ai-settings"
              : location.pathname.includes("/setup/webhook-catalogs")
                ? "webhook-catalogs"
                : location.pathname.includes("/setup/rate-limit-schemes")
                  ? "rate-limit-schemes"
                  : "deployment-settings";
    } else if (isAuthRoute) {
        currentTab = location.pathname.includes("/auth/sso")
            ? "sso"
            : location.pathname.includes("/auth/sessions")
              ? "sessions"
              : location.pathname.includes("/auth/restrictions")
                ? "restrictions"
                : location.pathname.includes("/auth/jwt-templates")
                  ? "jwt-templates"
                  : "schema-factors";
    } else if (isLLMRoute) {
        currentTab =
            location.pathname === llmsToolsPath ||
            location.pathname.startsWith(`${llmsToolsPath}/`)
                ? "tools"
                : location.pathname === llmsKnowledgeBasePath ||
                    location.pathname.startsWith(`${llmsKnowledgeBasePath}/`)
                  ? "knowledge-base"
                  : location.pathname === llmsMcpServersPath ||
                      location.pathname.startsWith(`${llmsMcpServersPath}/`)
                    ? "mcp-servers"
                    : "ai-agents";
    } else if (isBillingRoute) {
        currentTab = location.pathname.includes("/billing/usage")
            ? "usage"
            : "subscription";
    }

    const handleTabChange = (value: string) => {
        const basePath = `/project/${params.projectId}/deployment/${params.deploymentId}`;
        if (isUsersRoute) {
            navigate(
                `${basePath}/users${value === "active" ? "" : `/${value}`}`,
            );
        } else if (isB2BRoute) {
            navigate(
                `${basePath}/b2b-settings${value === "organizations" ? "" : `/${value}`}`,
            );
        } else if (isSetupRoute) {
            navigate(
                `${basePath}/setup${value === "deployment-settings" ? "" : `/${value}`}`,
            );
        } else if (isAuthRoute) {
            navigate(`${basePath}/auth/${value}`);
        } else if (isLLMRoute) {
            navigate(`${basePath}/llms/${value}`);
        } else if (isBillingRoute) {
            navigate(`${basePath}/billing/${value}`);
        }
    };

    const handleProductionDeploymentCreated = (deployment: Deployment) => {
        setSelectedDeployment(deployment, false);
        navigate(
            `/project/${selectedProject?.id}/deployment/${deployment.id}/go-live`,
        );
    };

    const handleStagingDeploymentCreated = (deployment: Deployment) => {
        setSelectedDeployment(deployment, false);
        navigate(`/project/${selectedProject?.id}/deployment/${deployment.id}`);
    };

    const handleCreateStagingDeployment = async (authMethods: string[]) => {
        if (!selectedProject) {
            return;
        }

        const deployment = await createStagingDeployment({
            projectId: selectedProject.id,
            authMethods,
        });

        handleStagingDeploymentCreated(deployment);
    };

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
            className="h-svh overflow-hidden"
        >
            <AppSidebar variant="inset" />
            <SidebarInset className="h-full overflow-hidden">
                <SiteHeader
                    onCreateProject={() =>
                        guardAction(() => setIsCreateProjectDialogOpen(true))
                    }
                    onCreateStaging={() =>
                        guardAction(() => setIsCreateStagingDialogOpen(true))
                    }
                    onCreateProduction={() =>
                        guardAction(() => setIsCreateProductionDialogOpen(true))
                    }
                    canCreateStaging={!!selectedProject}
                    canCreateProduction={!!selectedProject}
                />
                <div className="flex flex-1 flex-col overflow-y-auto">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        {(isUsersRoute ||
                            isB2BRoute ||
                            isSetupRoute ||
                            isAuthRoute ||
                            isLLMRoute ||
                            isBillingRoute) && (
                            <div className="px-4 pt-4 lg:px-6 lg:pt-6">
                                <Tabs
                                    value={currentTab}
                                    onValueChange={handleTabChange}
                                >
                                    <TabsList>
                                        {isUsersRoute && (
                                            <>
                                                <TabsTrigger value="active">
                                                    Active
                                                </TabsTrigger>
                                                <TabsTrigger value="invited">
                                                    Invited
                                                </TabsTrigger>
                                                <TabsTrigger value="waitlist">
                                                    Waitlist
                                                </TabsTrigger>
                                            </>
                                        )}
                                        {isB2BRoute && (
                                            <>
                                                <TabsTrigger value="organizations">
                                                    Organizations
                                                </TabsTrigger>
                                                <TabsTrigger value="workspaces">
                                                    Workspaces
                                                </TabsTrigger>
                                            </>
                                        )}
                                        {isSetupRoute && (
                                            <>
                                                <TabsTrigger value="deployment-settings">
                                                    Deployment Settings
                                                </TabsTrigger>
                                                <TabsTrigger value="emails">
                                                    Email Settings
                                                </TabsTrigger>
                                                <TabsTrigger value="ai-settings">
                                                    AI Settings
                                                </TabsTrigger>
                                                <TabsTrigger value="webhook-catalogs">
                                                    Webhook Catalogs
                                                </TabsTrigger>
                                                <TabsTrigger value="rate-limit-schemes">
                                                    Rate Limit Schemes
                                                </TabsTrigger>
                                            </>
                                        )}
                                        {isAuthRoute && (
                                            <>
                                                <TabsTrigger value="schema-factors">
                                                    Schema & Factors
                                                </TabsTrigger>
                                                <TabsTrigger value="sso">
                                                    SSO
                                                </TabsTrigger>
                                                <TabsTrigger value="sessions">
                                                    Sessions
                                                </TabsTrigger>
                                                <TabsTrigger value="restrictions">
                                                    Restrictions
                                                </TabsTrigger>
                                                <TabsTrigger value="jwt-templates">
                                                    JWT Templates
                                                </TabsTrigger>
                                            </>
                                        )}
                                        {isLLMRoute && (
                                            <>
                                                <TabsTrigger value="ai-agents">
                                                    AI Agents
                                                </TabsTrigger>
                                                <TabsTrigger value="tools">
                                                    Tools
                                                </TabsTrigger>
                                                <TabsTrigger value="knowledge-base">
                                                    Knowledge Base
                                                </TabsTrigger>
                                                <TabsTrigger value="mcp-servers">
                                                    MCP Servers
                                                </TabsTrigger>
                                            </>
                                        )}
                                        {isBillingRoute && (
                                            <>
                                                <TabsTrigger value="subscription">
                                                    Subscription
                                                </TabsTrigger>
                                                <TabsTrigger value="usage">
                                                    Usage & Credits
                                                </TabsTrigger>
                                            </>
                                        )}
                                    </TabsList>
                                </Tabs>
                            </div>
                        )}
                        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </SidebarInset>

            <CreateProjectDialog
                open={isCreateProjectDialogOpen}
                onClose={() => setIsCreateProjectDialogOpen(false)}
            />
            <BillingSetupDialog
                open={isBillingSetupDialogOpen}
                onClose={handleBillingSetupSuccess}
            />
            {selectedProject && (
                <CreateProductionDeploymentDialog
                    open={isCreateProductionDialogOpen}
                    onClose={() => setIsCreateProductionDialogOpen(false)}
                    projectId={selectedProject!.id}
                    onCreated={handleProductionDeploymentCreated}
                />
            )}
            <CreateStagingDeploymentDialog
                open={isCreateStagingDialogOpen}
                onOpenChange={setIsCreateStagingDialogOpen}
                onCreateStagingDeployment={handleCreateStagingDeployment}
                isLoading={isCreatingStagingDeployment}
            />

            <Dialog
                open={isPendingBillingDialogOpen}
                onOpenChange={(isOpen) => !isOpen && setIsPendingBillingDialogOpen(false)}
            >
                <DialogContent>
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="shrink-0 w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                            </div>
                            <DialogTitle>Subscription Not Complete</DialogTitle>
                        </div>
                        <DialogDescription>
                            <Text>
                                Your billing account has been created but the
                                subscription payment has not been completed yet.
                            </Text>
                            <ul className="list-disc list-inside mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                                <li>
                                    You closed the payment page before
                                    completing checkout
                                </li>
                                <li>The payment is still processing</li>
                                <li>
                                    There was an issue with your payment method
                                </li>
                            </ul>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsPendingBillingDialogOpen(false)}
                        >
                            Close
                        </Button>
                        <Button
                            onClick={() => {
                                setIsPendingBillingDialogOpen(false);
                                setIsBillingSetupDialogOpen(true);
                            }}
                        >
                            Complete Checkout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}
