import { createBrowserRouter } from "react-router";
import { ApplicationLayout } from "@/components/application-layout";
import { lazy, Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

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

const OverviewPage = lazy(() => import("./pages/overview"));

const ActiveUsersPage = lazy(() => import("./pages/users/active"));
const InvitedUsersPage = lazy(() => import("./pages/users/invited"));
const WaitlistUsersPage = lazy(() => import("./pages/users/waitlist"));
const UserDetailsPage = lazy(() => import("./pages/user/[id]"));
const OrganizationsPage = lazy(() => import("./pages/organizations"));
const OrganizationDetailsPage = lazy(() => import("./pages/organization/[id]"));
const WorkspaceDetailsPage = lazy(() => import("./pages/workspace/[id]"));
const SchemaFactorsPage = lazy(() => import("./pages/auth/schema-factors"));
const SSOConnectionsPage = lazy(() => import("./pages/auth/social-login"));
const SessionsPage = lazy(() => import("./pages/auth/sessions"));
const OAuthApplicationsPage = lazy(() => import("./pages/auth/oauth"));
const Web3AuthPage = lazy(() => import("./pages/auth/web3"));
const RestrictionsPage = lazy(() => import("./pages/auth/restrictions"));
const ManageOrganizationsPage = lazy(
  () => import("./pages/manage-organizations"),
);
const ManageWorkspacesPage = lazy(() => import("./pages/manage-workspaces"));
const PortalPage = lazy(() => import("./pages/portal"));
const DeploymentSettingsPage = lazy(
  () => import("./pages/deployment-settings"),
);
const EmailsPage = lazy(() => import("./pages/emails"));
const EmailTemplateEditor = lazy(
  () => import("./pages/emails/template-editor"),
);
const SMSPage = lazy(() => import("./pages/sms"));
const ApplicationSettingsPage = lazy(() => import("./pages/settings"));
const ProjectsPage = lazy(() => import("./pages/projects"));
const JWTTemplatesPage = lazy(() => import("./pages/auth/jwt-templates"));
const JWTTemplateCreateUpdatePage = lazy(
  () => import("./pages/auth/jwt-template-create-update"),
);
const DnsVerificationPage = lazy(() => import("./pages/dns-verification"));
// AI Agents pages
const CreateAgentsPage = lazy(() => import("./pages/ai-agents/create-agents"));
const WorkflowsPage = lazy(() => import("./pages/ai-agents/workflows"));
const CreateWorkflowPage = lazy(
  () => import("./pages/ai-agents/create-workflow"),
);
const ToolsPage = lazy(() => import("./pages/ai-agents/tools"));
const KnowledgeBasePage = lazy(
  () => import("./pages/ai-agents/knowledge-base"),
);
const WebhooksPage = lazy(() => import("./pages/webhooks"));
const WebhookEndpointsPage = lazy(() => import("./pages/webhooks/endpoints"));
const WebhookDeliveriesPage = lazy(() => import("./pages/webhooks/deliveries"));
const WebhookDeliveryDetailsPage = lazy(
  () => import("./pages/webhooks/delivery-details"),
);
const WebhookAnalyticsPage = lazy(() => import("./pages/webhooks/analytics"));
const ApiKeysPage = lazy(() => import("./pages/api-keys"));
// const BillingPage = lazy(() => import("./pages/billing"));
// const BillingSuccessPage = lazy(() => import("./pages/billing/success"));

export const router = createBrowserRouter([
  {
    path: "/project/:projectId/deployment/:deploymentId",
    element: <ApplicationLayout />,
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
      // {
      //   path: "billing",
      //   element: (
      //     <Suspense fallback={<SimpleFallback />}>
      //       <BillingPage />
      //     </Suspense>
      //   ),
      // },
      // {
      //   path: "billing/success",
      //   element: (
      //     <Suspense fallback={<SimpleFallback />}>
      //       <BillingSuccessPage />
      //     </Suspense>
      //   ),
      // },
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
        path: "organization/:id",
        element: (
          <Suspense fallback={<SimpleFallback />}>
            <OrganizationDetailsPage />
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
]);
