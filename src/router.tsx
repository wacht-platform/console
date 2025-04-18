import { createBrowserRouter } from "react-router";
import { ApplicationLayout } from "@/components/application-layout";
import { lazy, Suspense } from "react";
import { LoadingFallback } from "@/components/loading-fallback";

const OverviewPage = lazy(() => import("./pages/overview"));
const UsersPage = lazy(() => import("./pages/users"));
const OrganizationsPage = lazy(() => import("./pages/organizations"));
const WorkspacesPage = lazy(() => import("./pages/workspaces"));
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
const AvatarsPage = lazy(() => import("./pages/avatars"));
const EmailsPage = lazy(() => import("./pages/emails"));
const SMSPage = lazy(() => import("./pages/sms"));
const ApplicationSettingsPage = lazy(() => import("./pages/settings"));

const EmailWorkspaceInvitationPage = lazy(
	() => import("./pages/emails/workspace-invitations"),
);
const EmailOrganizationInvitationPage = lazy(
	() => import("./pages/emails/organization-invitation"),
);
const EmailWaitlistedPage = lazy(() => import("./pages/emails/waitlisted"));
const EmailNewSignUpPage = lazy(() => import("./pages/emails/new-sign-up"));
const EmailNewDeviceLogInPage = lazy(
	() => import("./pages/emails/new-device-log-in"),
);
const EmailOtpPage = lazy(() => import("./pages/emails/email-otp"));
const EmailMagicLinkPage = lazy(() => import("./pages/emails/magic-link"));
const EmailPasswordResetPage = lazy(
	() => import("./pages/emails/password-reset"),
);
const EmailBadSignUpAttemptPage = lazy(
	() => import("./pages/emails/bad-sign-up-attempt"),
);
const EmailPasswordChangedPage = lazy(
	() => import("./pages/emails/password-changed"),
);

const ProjectsPage = lazy(() => import("./pages/projects"));
const JWTTemplatesPage = lazy(() => import("./pages/auth/jwt-templates"));
const JWTTemplateCreateUpdatePage = lazy(
	() => import("./pages/auth/jwt-template-create-update"),
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
				path: "organizations",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<OrganizationsPage />
					</Suspense>
				),
			},
			{
				path: "workspaces",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<WorkspacesPage />
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
							}
						]
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
				path: "avatars",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<AvatarsPage />
					</Suspense>
				),
			},
			{
				path: "emails",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<EmailsPage />
					</Suspense>
				),
			},
			{
				path: "emails/workspace-invitation",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<EmailWorkspaceInvitationPage />
					</Suspense>
				),
			},
			{
				path: "emails/organization-invitation",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<EmailOrganizationInvitationPage />
					</Suspense>
				),
			},
			{
				path: "emails/waitlisted",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<EmailWaitlistedPage />
					</Suspense>
				),
			},
			{
				path: "emails/new-sign-up",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<EmailNewSignUpPage />
					</Suspense>
				),
			},
			{
				path: "emails/new-device-log-in",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<EmailNewDeviceLogInPage />
					</Suspense>
				),
			},
			{
				path: "emails/email-otp",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<EmailOtpPage />
					</Suspense>
				),
			},
			{
				path: "emails/magic-link",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<EmailMagicLinkPage />
					</Suspense>
				),
			},
			{
				path: "emails/password-reset",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<EmailPasswordResetPage />
					</Suspense>
				),
			},
			{
				path: "emails/bad-sign-up-attempt",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<EmailBadSignUpAttemptPage />
					</Suspense>
				),
			},
			{
				path: "emails/password-changed",
				element: (
					<Suspense fallback={<LoadingFallback />}>
						<EmailPasswordChangedPage />
					</Suspense>
				),
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
