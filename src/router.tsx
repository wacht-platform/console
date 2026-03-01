import { createBrowserRouter } from "react-router";
import { ApplicationLayout } from "@/components/application-layout";
import { Suspense } from "react";
import { InlineLoader } from "@/components/ui/loading-screen";
import { lazyImport } from "@/lib/lazy-import";
import { Navigate } from "react-router";

const SimpleFallback = () => <InlineLoader />;

const OverviewPage = lazyImport(() => import("./pages/overview"));
const GettingStartedPage = lazyImport(() => import("./pages/getting-started"));

const ActiveUsersPage = lazyImport(() => import("./pages/users/active"));
const InvitedUsersPage = lazyImport(() => import("./pages/users/invited"));
const WaitlistUsersPage = lazyImport(() => import("./pages/users/waitlist"));
const UserDetailsPage = lazyImport(() => import("./pages/user/[id]"));
const OrganizationsPage = lazyImport(() => import("./pages/organizations"));
const SegmentsLayout = lazyImport(() => import("./pages/segments/layout"));
const SegmentsManagePage = lazyImport(() => import("./pages/segments/manage"));
const SegmentDetailsPage = lazyImport(() => import("./pages/segments/detail"));
const OrganizationDetailsPage = lazyImport(
    () => import("./pages/organization/[id]"),
);
const WorkspaceDetailsPage = lazyImport(() => import("./pages/workspace/[id]"));
const SchemaFactorsPage = lazyImport(
    () => import("./pages/auth/schema-factors"),
);
const SSOConnectionsPage = lazyImport(
    () => import("./pages/auth/social-login"),
);
const SessionsPage = lazyImport(() => import("./pages/auth/sessions"));
const OAuthApplicationsPage = lazyImport(() => import("./pages/auth/oauth"));
const Web3AuthPage = lazyImport(() => import("./pages/auth/web3"));
const RestrictionsPage = lazyImport(() => import("./pages/auth/restrictions"));
const ManageOrganizationsPage = lazyImport(
    () => import("./pages/manage-organizations"),
);
const ManageWorkspacesPage = lazyImport(
    () => import("./pages/manage-workspaces"),
);
const AuthLayout = lazyImport(() => import("./pages/auth/layout"));
const B2BSettingsLayout = lazyImport(
    () => import("./pages/b2b-settings/layout"),
);
const SetupLayout = lazyImport(() => import("./pages/setup/layout"));
const PortalPage = lazyImport(() => import("./pages/portal"));
const DeploymentSettingsPage = lazyImport(
    () => import("./pages/deployment-settings"),
);
const EmailsPage = lazyImport(() => import("./pages/emails"));
const EmailTemplateEditor = lazyImport(
    () => import("./pages/emails/template-editor"),
);
const AISettingsPage = lazyImport(() => import("./pages/setup/ai-settings"));
const OAuthAppsIndexPage = lazyImport(() => import("./pages/oauth/apps"));
const OAuthAppDetailsPage = lazyImport(() => import("./pages/oauth/[slug]"));
const OAuthAppGrantsPage = lazyImport(() => import("./pages/oauth/[slug]-grants"));
const SMSPage = lazyImport(() => import("./pages/sms"));
const ApplicationSettingsPage = lazyImport(() => import("./pages/settings"));
const ProjectsPage = lazyImport(() => import("./pages/projects"));
const JWTTemplatesPage = lazyImport(() => import("./pages/auth/jwt-templates"));
const JWTTemplateCreateUpdatePage = lazyImport(
    () => import("./pages/auth/jwt-template-create-update"),
);
const DnsVerificationPage = lazyImport(
    () => import("./pages/dns-verification"),
);
const BillingSubscriptionPage = lazyImport(
    () => import("./pages/billing/subscription"),
);
const BillingUsagePage = lazyImport(() => import("./pages/billing/usage"));
// AI Agents pages
const CreateAgentsPage = lazyImport(
    () => import("./pages/ai-agents/create-agents"),
);
const ToolsPage = lazyImport(() => import("./pages/ai-agents/tools"));
const KnowledgeBasePage = lazyImport(
    () => import("./pages/ai-agents/knowledge-base"),
);
const AgentDetailsPage = lazyImport(
    () => import("./pages/ai-agents/agent-details"),
);
const ConfigureMCPPage = lazyImport(
    () => import("./pages/ai-agents/configure-mcp"),
);
const WebhooksEmbedPage = lazyImport(() => import("./pages/webhooks/embed"));
const ApiKeysEmbedPage = lazyImport(() => import("./pages/api-keys/embed"));
const WebhookCatalogsPage = lazyImport(
    () => import("./pages/webhooks/catalogs"),
);
const WebhookCatalogEditorPage = lazyImport(
    () => import("./pages/webhooks/catalog-editor"),
);
const ApiKeyRateLimitSchemesPage = lazyImport(
    () => import("./pages/api-keys/rate-limit-schemes"),
);
const RateLimitSchemeEditorPage = lazyImport(
    () => import("./pages/api-keys/rate-limit-scheme-editor"),
);
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
                path: "getting-started",
                element: (
                    <Suspense fallback={<SimpleFallback />}>
                        <GettingStartedPage />
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
                    {
                        path: ":id",
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <UserDetailsPage />
                            </Suspense>
                        ),
                    },
                ],
            },
            {
                path: "organizations",
                children: [
                    {
                        index: true,
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <OrganizationsPage />
                            </Suspense>
                        ),
                    },
                    {
                        path: ":id",
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
                ],
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
                path: "auth",
                element: (
                    <Suspense fallback={<SimpleFallback />}>
                        <AuthLayout />
                    </Suspense>
                ),
                children: [
                    {
                        index: true,
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <SchemaFactorsPage />
                            </Suspense>
                        ),
                    },
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
                                path: ":templateId",
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
                        path: "ai-agents/:agentId",
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <AgentDetailsPage />
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
                    {
                        path: "mcp-servers",
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <ConfigureMCPPage />
                            </Suspense>
                        ),
                    },
                ],
            },
            {
                path: "b2b-settings",
                element: (
                    <Suspense fallback={<SimpleFallback />}>
                        <B2BSettingsLayout />
                    </Suspense>
                ),
                children: [
                    {
                        index: true,
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <ManageOrganizationsPage />
                            </Suspense>
                        ),
                    },
                    {
                        path: "workspaces",
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <ManageWorkspacesPage />
                            </Suspense>
                        ),
                    },
                ],
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
                path: "setup",
                element: (
                    <Suspense fallback={<SimpleFallback />}>
                        <SetupLayout />
                    </Suspense>
                ),
                children: [
                    {
                        index: true,
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
                        path: "ai-settings",
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <AISettingsPage />
                            </Suspense>
                        ),
                    },
                    {
                        path: "webhook-catalogs",
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <WebhookCatalogsPage />
                            </Suspense>
                        ),
                    },
                    {
                        path: "webhook-catalogs/new",
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <WebhookCatalogEditorPage />
                            </Suspense>
                        ),
                    },
                    {
                        path: "webhook-catalogs/:catalogSlug",
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <WebhookCatalogEditorPage />
                            </Suspense>
                        ),
                    },
                    {
                        path: "rate-limit-schemes",
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <ApiKeyRateLimitSchemesPage />
                            </Suspense>
                        ),
                    },
                    {
                        path: "rate-limit-schemes/new",
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <RateLimitSchemeEditorPage />
                            </Suspense>
                        ),
                    },
                    {
                        path: "rate-limit-schemes/:schemeSlug",
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <RateLimitSchemeEditorPage />
                            </Suspense>
                        ),
                    },
                    {
                        path: "oauth-apps",
                        element: <Navigate to="../../oauth" replace />,
                    },
                    {
                        path: "go-live",
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <DnsVerificationPage />
                            </Suspense>
                        ),
                    },
                ],
            },
            {
                path: "oauth",
                children: [
                    {
                        index: true,
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <OAuthAppsIndexPage />
                            </Suspense>
                        ),
                    },
                    {
                        path: ":slug",
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <OAuthAppDetailsPage />
                            </Suspense>
                        ),
                    },
                    {
                        path: ":slug/grants",
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <OAuthAppGrantsPage />
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
                path: "billing",
                children: [
                    {
                        index: true,
                        element: <Navigate to="subscription" replace />,
                    },
                    {
                        path: "subscription",
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <BillingSubscriptionPage />
                            </Suspense>
                        ),
                    },
                    {
                        path: "usage",
                        element: (
                            <Suspense fallback={<SimpleFallback />}>
                                <BillingUsagePage />
                            </Suspense>
                        ),
                    },
                ],
            },
            {
                path: "dns-verification",
                element: <Navigate to="../setup/go-live" replace />,
            },
            {
                path: "webhooks/*",
                element: (
                    <Suspense fallback={<SimpleFallback />}>
                        <WebhooksEmbedPage />
                    </Suspense>
                ),
            },
            {
                path: "api-keys",
                element: (
                    <Suspense fallback={<SimpleFallback />}>
                        <ApiKeysEmbedPage />
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
