import { createBrowserRouter } from "react-router";
import { ApplicationLayout } from "@/components/application-layout";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "@/components/loading-fallback";

const OverviewPage = lazy(() => import("./pages/overview"));
const UsersPage = lazy(() => import("./pages/users"));
const UserDetailsPage = lazy(() => import("./pages/user/[id]"));
const OrganizationsPage = lazy(() => import("./pages/organizations"));
const OrganizationDetailsPage = lazy(() => import("./pages/organization/[id]"));
const WorkspaceDetailsPage = lazy(() => import("./pages/workspace/[id]"));
const SchemaFactorsPage = lazy(() => import("./pages/auth/schema-factors"));
const SSOConnectionsPage = lazy(() => import("./pages/auth/social-login"));
const OAuthApplicationsPage = lazy(() => import("./pages/auth/oauth"));
const Web3AuthPage = lazy(() => import("./pages/auth/web3"));
const RestrictionsPage = lazy(() => import("./pages/auth/restrictions"));
const ManageOrganizationsPage = lazy(
	() => import("./pages/manage-organizations"),
);
const ManageWorkspacesPage = lazy(() => import("./pages/manage-workspaces"));
const PortalPage = lazy(() => import("./pages/portal"));
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

export const router = createBrowserRouter([
	{
		path: "/project/:projectId/deployment/:deploymentId",
		element: <ApplicationLayout />,
		children: [
			{
				index: true,
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<OverviewPage />
					</Suspense>
				),
			},
			{
				path: "users",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<UsersPage />
					</Suspense>
				),
			},
			{
				path: "user/:id",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<UserDetailsPage />
					</Suspense>
				),
			},
			{
				path: "organizations",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<OrganizationsPage />
					</Suspense>
				),
			},
			{
				path: "organization/:id",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<OrganizationDetailsPage />
					</Suspense>
				),
			},
			{
				path: "workspace/:id",
				element: (
					<Suspense fallback={<LoadingFallback />}>
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
							<Suspense fallback={<LoadingFallback />}>
								<SchemaFactorsPage />
							</Suspense>
						),
					},
					{
						path: "sso",
						element: (
							<Suspense fallback={<LoadingFallback />}>
								<SSOConnectionsPage />
							</Suspense>
						),
					},
					{
						path: "oauth",
						element: (
							<Suspense fallback={<LoadingFallback />}>
								<OAuthApplicationsPage />
							</Suspense>
						),
					},
					{
						path: "web3",
						element: (
							<Suspense fallback={<LoadingFallback />}>
								<Web3AuthPage />
							</Suspense>
						),
					},
					{
						path: "restrictions",
						element: (
							<Suspense fallback={<LoadingFallback />}>
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
									<Suspense fallback={<LoadingFallback />}>
										<JWTTemplatesPage />
									</Suspense>
								),
							},
							{
								path: "new",
								element: (
									<Suspense fallback={<LoadingFallback />}>
										<JWTTemplateCreateUpdatePage />
									</Suspense>
								),
							},
							{
								path: "edit/:templateId",
								element: (
									<Suspense fallback={<LoadingFallback />}>
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
							<Suspense fallback={<LoadingFallback />}>
								<CreateAgentsPage />
							</Suspense>
						),
					},
					{
						path: "workflows",
						element: (
							<Suspense fallback={<LoadingFallback />}>
								<WorkflowsPage />
							</Suspense>
						),
					},
					{
						path: "workflows/create-workflow",
						element: (
							<Suspense fallback={<LoadingFallback />}>
								<CreateWorkflowPage />
							</Suspense>
						),
					},
					{
						path: "workflows/edit/:workflowId",
						element: (
							<Suspense fallback={<LoadingFallback />}>
								<CreateWorkflowPage />
							</Suspense>
						),
					},
					{
						path: "tools",
						element: (
							<Suspense fallback={<LoadingFallback />}>
								<ToolsPage />
							</Suspense>
						),
					},
					{
						path: "knowledge-base",
						element: (
							<Suspense fallback={<LoadingFallback />}>
								<KnowledgeBasePage />
							</Suspense>
						),
					},
				],
			},
			{
				path: "manage-organizations",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<ManageOrganizationsPage />
					</Suspense>
				),
			},
			{
				path: "manage-workspaces",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<ManageWorkspacesPage />
					</Suspense>
				),
			},
			{
				path: "portal",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<PortalPage />
					</Suspense>
				),
			},
			{
				path: "emails",
				children: [
					{
						index: true,
						element: (
							<Suspense fallback={<LoadingFallback />}>
								<EmailsPage />
							</Suspense>
						),
					},
					{
						path: ":templateId",
						element: (
							<Suspense fallback={<LoadingFallback />}>
								<EmailTemplateEditor />
							</Suspense>
						),
					},
				],
			},
			{
				path: "sms",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<SMSPage />
					</Suspense>
				),
			},
			{
				path: "settings",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<ApplicationSettingsPage />
					</Suspense>
				),
			},
			{
				path: "dns-verification",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<DnsVerificationPage />
					</Suspense>
				),
			},
		],
	},
	{
		path: "",
		element: (
			<Suspense fallback={<LoadingFallback />}>
				<ProjectsPage />
			</Suspense>
		),
	},
]);
