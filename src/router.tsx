import { createBrowserRouter } from "react-router";
import { ApplicationLayout } from "@/components/application-layout";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { lazyImport } from "@/lib/lazy-import";

const SimpleFallback = () => (
  <div className="flex items-center justify-center min-h-[400px] w-full">
    <div className="flex flex-col items-center gap-4">
      <Spinner size="lg" />
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        Loading...
      </span>
    </div>
  </div>
);

const OverviewPage = lazyImport(() => import("./pages/overview"));

const ActiveUsersPage = lazyImport(() => import("./pages/users/active"));
const InvitedUsersPage = lazyImport(() => import("./pages/users/invited"));
const WaitlistUsersPage = lazyImport(() => import("./pages/users/waitlist"));
const UserDetailsPage = lazyImport(() => import("./pages/user/[id]"));
const OrganizationsPage = lazyImport(() => import("./pages/organizations"));
const SegmentsLayout = lazyImport(() => import("./pages/segments/layout"));
const SegmentsManagePage = lazyImport(() => import("./pages/segments/manage"));
const SegmentDetailsPage = lazyImport(() => import("./pages/segments/detail"));
const WorkspacesPage = lazyImport(() => import("./pages/workspaces"));
const OrganizationDetailsPage = lazyImport(() => import("./pages/organization/[id]"));
const WorkspaceDetailsPage = lazyImport(() => import("./pages/workspace/[id]"));
const SchemaFactorsPage = lazyImport(() => import("./pages/auth/schema-factors"));
const SSOConnectionsPage = lazyImport(() => import("./pages/auth/social-login"));
const SessionsPage = lazyImport(() => import("./pages/auth/sessions"));
const OAuthApplicationsPage = lazyImport(() => import("./pages/auth/oauth"));
const Web3AuthPage = lazyImport(() => import("./pages/auth/web3"));
const RestrictionsPage = lazyImport(() => import("./pages/auth/restrictions"));
const ManageOrganizationsPage = lazyImport(
  () => import("./pages/manage-organizations"),
);
const ManageWorkspacesPage = lazyImport(() => import("./pages/manage-workspaces"));
const PortalPage = lazyImport(() => import("./pages/portal"));
const DeploymentSettingsPage = lazyImport(
  () => import("./pages/deployment-settings"),
);
const EmailsPage = lazyImport(() => import("./pages/emails"));
const EmailTemplateEditor = lazyImport(
  () => import("./pages/emails/template-editor"),
);
const SMSPage = lazyImport(() => import("./pages/sms"));
const ApplicationSettingsPage = lazyImport(() => import("./pages/settings"));
const ProjectsPage = lazyImport(() => import("./pages/projects"));
const JWTTemplatesPage = lazyImport(() => import("./pages/auth/jwt-templates"));
const JWTTemplateCreateUpdatePage = lazyImport(
  () => import("./pages/auth/jwt-template-create-update"),
);
const DnsVerificationPage = lazyImport(() => import("./pages/dns-verification"));
// AI Agents pages
const CreateAgentsPage = lazyImport(() => import("./pages/ai-agents/create-agents"));
const WorkflowsPage = lazyImport(() => import("./pages/ai-agents/workflows"));
const CreateWorkflowPage = lazyImport(
  () => import("./pages/ai-agents/create-workflow"),
);
const ToolsPage = lazyImport(() => import("./pages/ai-agents/tools"));
const KnowledgeBasePage = lazyImport(
  () => import("./pages/ai-agents/knowledge-base"),
);
const WebhooksPage = lazyImport(() => import("./pages/webhooks"));
const WebhookEndpointsPage = lazyImport(() => import("./pages/webhooks/endpoints"));
const WebhookDeliveriesPage = lazyImport(() => import("./pages/webhooks/deliveries"));
const WebhookDeliveryDetailsPage = lazyImport(
  () => import("./pages/webhooks/delivery-details"),
);
const WebhookAnalyticsPage = lazyImport(() => import("./pages/webhooks/analytics"));
const ApiKeysPage = lazyImport(() => import("./pages/api-keys"));
const NotFoundPage = lazyImport(() => import("./pages/not-found"));
const ErrorBoundaryPage = lazyImport(() => import("./pages/error-boundary"));

export const router = createBrowserRouter([
  {
    path: "/project/:projectId/deployment/:deploymentId",
    element: <ApplicationLayout />,
    errorElement: (
      <Suspense fallback={<SimpleFallback />}>
        <ErrorBoundaryPage />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<SimpleFallback />}>
            <OverviewPage />
          </Suspense>
        ),
      },
      {
        path: "users",
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <ActiveUsersPage />
              </Suspense>
            ),
          },
          {
            path: "active",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <ActiveUsersPage />
              </Suspense>
            ),
          },
          {
            path: "invited",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <InvitedUsersPage />
              </Suspense>
            ),
          },
          {
            path: "waitlist",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <WaitlistUsersPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "user/:id",
        element: (
          <Suspense fallback={<SimpleFallback />}>
            <UserDetailsPage />
          </Suspense>
        ),
      },
      {
        path: "organizations",
        element: (
          <Suspense fallback={<SimpleFallback />}>
            <OrganizationsPage />
          </Suspense>
        ),
      },
      {
        path: "segments",
        element: (
          <Suspense fallback={<SimpleFallback />}>
            <SegmentsLayout />
          </Suspense>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <SegmentsManagePage />
              </Suspense>
            ),
          },
          {
            path: ":id",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <SegmentDetailsPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "organization/:id",
        element: (
          <Suspense fallback={<SimpleFallback />}>
            <OrganizationDetailsPage />
          </Suspense>
        ),
      },
      {
        path: "workspaces",
        element: (
          <Suspense fallback={<SimpleFallback />}>
            <WorkspacesPage />
          </Suspense>
        ),
      },
      {
        path: "workspace/:id",
        element: (
          <Suspense fallback={<SimpleFallback />}>
            <WorkspaceDetailsPage />
          </Suspense>
        ),
      },
      {
        path: "auth",
        children: [
          {
            path: "schema-factors",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <SchemaFactorsPage />
              </Suspense>
            ),
          },
          {
            path: "sso",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <SSOConnectionsPage />
              </Suspense>
            ),
          },
          {
            path: "sessions",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <SessionsPage />
              </Suspense>
            ),
          },
          {
            path: "oauth",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <OAuthApplicationsPage />
              </Suspense>
            ),
          },
          {
            path: "web3",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <Web3AuthPage />
              </Suspense>
            ),
          },
          {
            path: "restrictions",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <RestrictionsPage />
              </Suspense>
            ),
          },
          {
            path: "jwt-templates",
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<SimpleFallback />}>
                    <JWTTemplatesPage />
                  </Suspense>
                ),
              },
              {
                path: "new",
                element: (
                  <Suspense fallback={<SimpleFallback />}>
                    <JWTTemplateCreateUpdatePage />
                  </Suspense>
                ),
              },
              {
                path: "edit/:templateId",
                element: (
                  <Suspense fallback={<SimpleFallback />}>
                    <JWTTemplateCreateUpdatePage />
                  </Suspense>
                ),
              },
            ],
          },
        ],
      },
      {
        path: "llms",
        children: [
          {
            path: "ai-agents",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <CreateAgentsPage />
              </Suspense>
            ),
          },
          {
            path: "workflows",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <WorkflowsPage />
              </Suspense>
            ),
          },
          {
            path: "workflows/create-workflow",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <CreateWorkflowPage />
              </Suspense>
            ),
          },
          {
            path: "workflows/edit/:workflowId",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <CreateWorkflowPage />
              </Suspense>
            ),
          },
          {
            path: "tools",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <ToolsPage />
              </Suspense>
            ),
          },
          {
            path: "knowledge-base",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <KnowledgeBasePage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "manage-organizations",
        element: (
          <Suspense fallback={<SimpleFallback />}>
            <ManageOrganizationsPage />
          </Suspense>
        ),
      },
      {
        path: "manage-workspaces",
        element: (
          <Suspense fallback={<SimpleFallback />}>
            <ManageWorkspacesPage />
          </Suspense>
        ),
      },
      {
        path: "portal",
        element: (
          <Suspense fallback={<SimpleFallback />}>
            <PortalPage />
          </Suspense>
        ),
      },
      {
        path: "deployment-settings",
        element: (
          <Suspense fallback={<SimpleFallback />}>
            <DeploymentSettingsPage />
          </Suspense>
        ),
      },
      {
        path: "emails",
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <EmailsPage />
              </Suspense>
            ),
          },
          {
            path: ":templateId",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <EmailTemplateEditor />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "sms",
        element: (
          <Suspense fallback={<SimpleFallback />}>
            <SMSPage />
          </Suspense>
        ),
      },
      {
        path: "settings",
        element: (
          <Suspense fallback={<SimpleFallback />}>
            <ApplicationSettingsPage />
          </Suspense>
        ),
      },
      {
        path: "dns-verification",
        element: (
          <Suspense fallback={<SimpleFallback />}>
            <DnsVerificationPage />
          </Suspense>
        ),
      },
      {
        path: "webhooks",
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <WebhooksPage />
              </Suspense>
            ),
          },
          {
            path: "endpoints",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <WebhookEndpointsPage />
              </Suspense>
            ),
          },
          {
            path: "deliveries",
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<SimpleFallback />}>
                    <WebhookDeliveriesPage />
                  </Suspense>
                ),
              },
              {
                path: ":deliveryId",
                element: (
                  <Suspense fallback={<SimpleFallback />}>
                    <WebhookDeliveryDetailsPage />
                  </Suspense>
                ),
              },
            ],
          },
          {
            path: "analytics",
            element: (
              <Suspense fallback={<SimpleFallback />}>
                <WebhookAnalyticsPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "api-keys",
        element: (
          <Suspense fallback={<SimpleFallback />}>
            <ApiKeysPage />
          </Suspense>
        ),
      },
      {
        path: "*",
        element: (
          <Suspense fallback={<SimpleFallback />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "",
    element: (
      <Suspense fallback={<SimpleFallback />}>
        <ProjectsPage />
      </Suspense>
    ),
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<SimpleFallback />}>
        <NotFoundPage />
      </Suspense>
    ),
    errorElement: (
      <Suspense fallback={<SimpleFallback />}>
        <ErrorBoundaryPage />
      </Suspense>
    ),
  },
]);
