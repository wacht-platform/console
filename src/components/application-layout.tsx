import { Outlet, useNavigate, useLocation, useParams } from "react-router";
import { useState, useEffect } from "react";
import { useProjects } from "@/lib/api/hooks/use-projects";
import { CreateProjectDialog } from "./create-project-dialog";
import { BillingSetupDialog } from "./billing-setup-dialog";
import { CreateProductionDeploymentDialog } from "./create-production-deployment-dialog";
import { setNavigationFunction } from "@/lib/store/project";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ApplicationLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isBillingSetupDialogOpen, setIsBillingSetupDialogOpen] = useState(false);
  const [isCreateProductionDialogOpen, setIsCreateProductionDialogOpen] = useState(false);

  const {
    selectedProject,
  } = useProjects();

  const handleBillingSetupSuccess = () => {
    setIsBillingSetupDialogOpen(false);
  };

  // Initialize navigation function for the store
  useEffect(() => {
    setNavigationFunction(navigate);
  }, [navigate]);

  // Determine current section and tab
  const isUsersRoute = location.pathname.includes('/users');
  const isB2BRoute = location.pathname.includes('/b2b-settings');
  const isCustomizationRoute = location.pathname.includes('/customization');
  const isAuthRoute = location.pathname.includes('/auth/') || location.pathname.endsWith('/auth');
  const isWebhooksRoute = location.pathname.includes('/webhooks');
  const isLLMRoute = location.pathname.includes('/llms/');

  let currentTab = '';
  if (isUsersRoute) {
    currentTab = location.pathname.includes('/users/invited') ? 'invited' :
      location.pathname.includes('/users/waitlist') ? 'waitlist' : 'active';
  } else if (isB2BRoute) {
    currentTab = location.pathname.includes('/b2b-settings/workspaces') ? 'workspaces' : 'organizations';
  } else if (isCustomizationRoute) {
    currentTab = location.pathname.includes('/customization/emails') ? 'emails' : 'deployment-settings';
  } else if (isAuthRoute) {
    currentTab = location.pathname.includes('/auth/sso') ? 'sso' :
      location.pathname.includes('/auth/sessions') ? 'sessions' :
        location.pathname.includes('/auth/restrictions') ? 'restrictions' :
          location.pathname.includes('/auth/jwt-templates') ? 'jwt-templates' : 'schema-factors';
  } else if (isWebhooksRoute) {
    currentTab = location.pathname.includes('/webhooks/endpoints') ? 'endpoints' :
      location.pathname.includes('/webhooks/deliveries') ? 'deliveries' :
        location.pathname.includes('/webhooks/analytics') ? 'analytics' : 'overview';
  } else if (isLLMRoute) {
    currentTab = location.pathname.includes('/workflows') ? 'workflows' :
      location.pathname.includes('/tools') ? 'tools' :
        location.pathname.includes('/knowledge-base') ? 'knowledge-base' : 'ai-agents';
  }

  const handleTabChange = (value: string) => {
    const basePath = `/project/${params.projectId}/deployment/${params.deploymentId}`;
    if (isUsersRoute) {
      navigate(`${basePath}/users${value === 'active' ? '' : `/${value}`}`);
    } else if (isB2BRoute) {
      navigate(`${basePath}/b2b-settings${value === 'organizations' ? '' : `/${value}`}`);
    } else if (isCustomizationRoute) {
      navigate(`${basePath}/customization${value === 'deployment-settings' ? '' : `/${value}`}`);
    } else if (isAuthRoute) {
      navigate(`${basePath}/auth/${value}`);
    } else if (isWebhooksRoute) {
      navigate(`${basePath}/webhooks${value === 'overview' ? '' : `/${value}`}`);
    } else if (isLLMRoute) {
      navigate(`${basePath}/llms/${value}`);
    }
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
          onCreateProject={() => setIsCreateProjectDialogOpen(true)}
          onCreateStaging={() => console.log("Create Staging")}
          onCreateProduction={() => setIsCreateProductionDialogOpen(true)}
          canCreateStaging={true}
          canCreateProduction={!!selectedProject}
        />
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {(isUsersRoute || isB2BRoute || isCustomizationRoute || isAuthRoute || isWebhooksRoute || isLLMRoute) && (
              <div className="px-4 pt-4 lg:px-6 lg:pt-6">
                <Tabs value={currentTab} onValueChange={handleTabChange}>
                  <TabsList>
                    {isUsersRoute && (
                      <>
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="invited">Invited</TabsTrigger>
                        <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
                      </>
                    )}
                    {isB2BRoute && (
                      <>
                        <TabsTrigger value="organizations">Organizations</TabsTrigger>
                        <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
                      </>
                    )}
                    {isCustomizationRoute && (
                      <>
                        <TabsTrigger value="deployment-settings">Deployment Settings</TabsTrigger>
                        <TabsTrigger value="emails">Email Settings</TabsTrigger>
                      </>
                    )}
                    {isAuthRoute && (
                      <>
                        <TabsTrigger value="schema-factors">Schema & Factors</TabsTrigger>
                        <TabsTrigger value="sso">SSO</TabsTrigger>
                        <TabsTrigger value="sessions">Sessions</TabsTrigger>
                        <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
                        <TabsTrigger value="jwt-templates">JWT Templates</TabsTrigger>
                      </>
                    )}
                    {isWebhooksRoute && (
                      <>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                        <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                      </>
                    )}
                    {isLLMRoute && (
                      <>
                        <TabsTrigger value="ai-agents">AI Agents</TabsTrigger>
                        <TabsTrigger value="workflows">Workflows</TabsTrigger>
                        <TabsTrigger value="tools">Tools</TabsTrigger>
                        <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
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

      {/* Dialogs */}
      <CreateProjectDialog
        open={isCreateProjectDialogOpen}
        onClose={() => setIsCreateProjectDialogOpen(false)}
      />
      <BillingSetupDialog
        open={isBillingSetupDialogOpen}
        onClose={handleBillingSetupSuccess}
      />
      {selectedProject && <CreateProductionDeploymentDialog
        open={isCreateProductionDialogOpen}
        onClose={() => setIsCreateProductionDialogOpen(false)}
        projectId={selectedProject!.id}
      />}
    </SidebarProvider>
  );
}
